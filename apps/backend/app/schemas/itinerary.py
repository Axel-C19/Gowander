from __future__ import annotations

from pydantic import BaseModel, ConfigDict
from typing import Literal, Optional
import uuid
import datetime as dt
from .place import PlaceOut
from .destination import DestinationOut


class GenerateItineraryRequest(BaseModel):
    swipe_session_id: uuid.UUID
    destination_id: uuid.UUID
    # NOTE: field named "date" must not use the bare `date` type — the field
    # name shadows it during model build and Pydantic resolves the type as None.
    date: Optional[dt.date] = None
    start_time: str = "09:00"


class ItineraryStopOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    order: int
    place: PlaceOut
    arrival_time: Optional[str] = None
    departure_time: Optional[str] = None
    travel_time_to_next_minutes: int
    travel_mode: Literal["walking", "driving", "transit"]


class ItineraryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    destination: DestinationOut
    date: Optional[dt.date] = None
    start_time: Optional[str] = None
    total_duration_minutes: int
    is_saved: bool = False
    stops: list[ItineraryStopOut]
    created_at: dt.datetime
    updated_at: dt.datetime
