from fastapi import APIRouter, HTTPException
import uuid
from sqlalchemy import func
from app.api.v1.deps import CurrentUser, DB
from app.schemas.itinerary import ItineraryOut, GenerateItineraryRequest, RateItineraryRequest
from app.models.itinerary import Itinerary, ItineraryRating
from app.services.itinerary_engine import generate_multi_itinerary

router = APIRouter(prefix="/itinerary", tags=["itinerary"])


@router.post("/generate", response_model=ItineraryOut, status_code=201)
def generate(body: GenerateItineraryRequest, current_user: CurrentUser, db: DB):
    # Normalize: legs payload (multi-destination) or flat single-leg fields
    if body.legs:
        legs = [
            {
                "swipe_session_id": leg.swipe_session_id,
                "destination_id": leg.destination_id,
                "start_date": leg.start_date,
                "end_date": leg.end_date,
            }
            for leg in body.legs
        ]
    elif body.swipe_session_id and body.destination_id:
        legs = [{
            "swipe_session_id": body.swipe_session_id,
            "destination_id": body.destination_id,
            "start_date": body.start_date,
            "end_date": body.end_date,
        }]
    else:
        raise HTTPException(status_code=422, detail="Provide legs or a swipe session + destination")

    try:
        itinerary = generate_multi_itinerary(
            db=db,
            user_id=current_user.id,
            legs=legs,
            start_time_str=body.start_time,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    return itinerary


@router.get("", response_model=list[ItineraryOut])
def list_itineraries(current_user: CurrentUser, db: DB):
    """Saved itineraries only — generated-but-unsaved ones are working drafts."""
    return (
        db.query(Itinerary)
        .filter(Itinerary.user_id == current_user.id, Itinerary.is_saved.is_(True))
        .order_by(Itinerary.created_at.desc())
        .all()
    )


@router.post("/{itinerary_id}/save", response_model=ItineraryOut)
def save_itinerary(itinerary_id: uuid.UUID, current_user: CurrentUser, db: DB):
    itinerary = db.get(Itinerary, itinerary_id)
    if not itinerary or itinerary.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    itinerary.is_saved = True
    db.commit()
    db.refresh(itinerary)
    return itinerary


@router.post("/{itinerary_id}/publish", response_model=ItineraryOut)
def publish_itinerary(itinerary_id: uuid.UUID, current_user: CurrentUser, db: DB):
    """Make the trip visible in the public Explore feed (implies saved)."""
    itinerary = db.get(Itinerary, itinerary_id)
    if not itinerary or itinerary.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    itinerary.is_public = True
    itinerary.is_saved = True
    db.commit()
    db.refresh(itinerary)
    return itinerary


@router.post("/{itinerary_id}/unpublish", response_model=ItineraryOut)
def unpublish_itinerary(itinerary_id: uuid.UUID, current_user: CurrentUser, db: DB):
    itinerary = db.get(Itinerary, itinerary_id)
    if not itinerary or itinerary.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    itinerary.is_public = False
    db.commit()
    db.refresh(itinerary)
    return itinerary


def _can_view(db, itinerary: Itinerary, user_id: uuid.UUID) -> bool:
    if itinerary.user_id == user_id or itinerary.is_public:
        return True
    # Privately shared: the owner sent it to this user in a message
    from app.models.social import Message

    return (
        db.query(Message)
        .filter(Message.itinerary_id == itinerary.id, Message.recipient_id == user_id)
        .first()
        is not None
    )


def _with_ratings(db, itinerary: Itinerary, user_id: uuid.UUID) -> ItineraryOut:
    out = ItineraryOut.model_validate(itinerary)
    avg, count = (
        db.query(func.avg(ItineraryRating.stars), func.count(ItineraryRating.id))
        .filter(ItineraryRating.itinerary_id == itinerary.id)
        .one()
    )
    mine = (
        db.query(ItineraryRating)
        .filter(
            ItineraryRating.itinerary_id == itinerary.id,
            ItineraryRating.user_id == user_id,
        )
        .first()
    )
    out.avg_rating = round(float(avg), 2) if avg is not None else None
    out.ratings_count = count
    out.my_rating = mine.stars if mine else None
    return out


@router.get("/{itinerary_id}", response_model=ItineraryOut)
def get_itinerary(itinerary_id: uuid.UUID, current_user: CurrentUser, db: DB):
    itinerary = db.get(Itinerary, itinerary_id)
    if not itinerary or not _can_view(db, itinerary, current_user.id):
        raise HTTPException(status_code=404, detail="Itinerary not found")
    return _with_ratings(db, itinerary, current_user.id)


@router.post("/{itinerary_id}/rate", response_model=ItineraryOut)
def rate_itinerary(
    itinerary_id: uuid.UUID,
    body: RateItineraryRequest,
    current_user: CurrentUser,
    db: DB,
):
    """Rate a public trip 1-5 stars. One rating per user; re-rating updates it."""
    itinerary = db.get(Itinerary, itinerary_id)
    if not itinerary or not _can_view(db, itinerary, current_user.id):
        raise HTTPException(status_code=404, detail="Itinerary not found")
    if not itinerary.is_public:
        raise HTTPException(status_code=400, detail="Only public trips can be rated")
    if itinerary.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You can't rate your own trip")

    rating = (
        db.query(ItineraryRating)
        .filter(
            ItineraryRating.itinerary_id == itinerary.id,
            ItineraryRating.user_id == current_user.id,
        )
        .first()
    )
    if rating:
        rating.stars = body.stars
    else:
        db.add(
            ItineraryRating(
                itinerary_id=itinerary.id,
                user_id=current_user.id,
                stars=body.stars,
            )
        )
    db.commit()
    return _with_ratings(db, itinerary, current_user.id)


@router.delete("/{itinerary_id}", status_code=204)
def delete_itinerary(itinerary_id: uuid.UUID, current_user: CurrentUser, db: DB):
    itinerary = db.get(Itinerary, itinerary_id)
    if not itinerary or itinerary.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    db.delete(itinerary)
    db.commit()
