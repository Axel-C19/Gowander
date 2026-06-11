from fastapi import APIRouter
from sqlalchemy import func

from app.api.v1.deps import CurrentUser, DB
from app.models.itinerary import Itinerary, ItineraryRating
from app.schemas.itinerary import ItineraryOut
from app.schemas.social import UserPublic
from pydantic import BaseModel

router = APIRouter(prefix="/explore", tags=["explore"])


class PublicTripOut(BaseModel):
    itinerary: ItineraryOut
    owner: UserPublic


@router.get("", response_model=list[PublicTripOut])
def public_trips(current_user: CurrentUser, db: DB):
    """Public trips ranked by popularity: best-rated first, unrated last (newest first)."""
    trips = (
        db.query(Itinerary)
        .filter(Itinerary.is_public.is_(True))
        .order_by(Itinerary.created_at.desc())
        .limit(100)
        .all()
    )
    trip_ids = [t.id for t in trips]

    # One aggregate query for all listed trips, one for the viewer's own ratings
    summaries = {
        itinerary_id: (avg, count)
        for itinerary_id, avg, count in db.query(
            ItineraryRating.itinerary_id,
            func.avg(ItineraryRating.stars),
            func.count(ItineraryRating.id),
        )
        .filter(ItineraryRating.itinerary_id.in_(trip_ids))
        .group_by(ItineraryRating.itinerary_id)
        .all()
    }
    my_ratings = {
        r.itinerary_id: r.stars
        for r in db.query(ItineraryRating)
        .filter(
            ItineraryRating.itinerary_id.in_(trip_ids),
            ItineraryRating.user_id == current_user.id,
        )
        .all()
    }

    results = []
    for t in trips:
        out = ItineraryOut.model_validate(t)
        avg, count = summaries.get(t.id, (None, 0))
        out.avg_rating = round(float(avg), 2) if avg is not None else None
        out.ratings_count = count
        out.my_rating = my_ratings.get(t.id)
        results.append(PublicTripOut(itinerary=out, owner=UserPublic.model_validate(t.user)))

    # Rated trips first (higher average, then more ratings); query already
    # ordered newest-first, and Python's sort is stable, so ties keep that order.
    results.sort(
        key=lambda r: (
            r.itinerary.avg_rating if r.itinerary.avg_rating is not None else -1,
            r.itinerary.ratings_count,
        ),
        reverse=True,
    )
    return results
