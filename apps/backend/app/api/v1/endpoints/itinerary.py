from fastapi import APIRouter, HTTPException
import uuid
from app.api.v1.deps import CurrentUser, DB
from app.schemas.itinerary import ItineraryOut, GenerateItineraryRequest
from app.models.itinerary import Itinerary
from app.services.itinerary_engine import generate_itinerary

router = APIRouter(prefix="/itinerary", tags=["itinerary"])


@router.post("/generate", response_model=ItineraryOut, status_code=201)
def generate(body: GenerateItineraryRequest, current_user: CurrentUser, db: DB):
    try:
        itinerary = generate_itinerary(
            db=db,
            user_id=current_user.id,
            swipe_session_id=body.swipe_session_id,
            destination_id=body.destination_id,
            itinerary_date=body.date,
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


@router.get("/{itinerary_id}", response_model=ItineraryOut)
def get_itinerary(itinerary_id: uuid.UUID, current_user: CurrentUser, db: DB):
    itinerary = db.get(Itinerary, itinerary_id)
    if not itinerary or itinerary.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    return itinerary


@router.delete("/{itinerary_id}", status_code=204)
def delete_itinerary(itinerary_id: uuid.UUID, current_user: CurrentUser, db: DB):
    itinerary = db.get(Itinerary, itinerary_id)
    if not itinerary or itinerary.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    db.delete(itinerary)
    db.commit()
