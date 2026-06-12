import datetime as dt
import uuid

from fastapi import APIRouter, HTTPException

from app.api.v1.deps import CurrentUser, DB
from app.models.destination import Destination
from app.schemas.flights import TransferSearchOut
from app.services.flights import search_transfer_options

router = APIRouter(prefix="/flights", tags=["flights"])


@router.get("/search", response_model=TransferSearchOut)
def search_flights(
    from_destination_id: uuid.UUID,
    to_destination_id: uuid.UUID,
    travel_date: dt.date,
    _: CurrentUser,
    db: DB,
):
    """
    Transport options between two trip cities on a given date: flights
    (Google Flights when configured) plus train/bus/car estimates, with a
    distance-based recommendation.
    """
    from_dest = db.get(Destination, from_destination_id)
    to_dest = db.get(Destination, to_destination_id)
    if not from_dest or not to_dest:
        raise HTTPException(status_code=404, detail="Destination not found")
    if from_dest.id == to_dest.id:
        raise HTTPException(status_code=422, detail="Destinations must differ")

    return search_transfer_options(from_dest, to_dest, travel_date)
