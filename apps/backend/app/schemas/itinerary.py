from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field
from typing import Literal, Optional
import uuid
import datetime as dt
from .place import PlaceOut
from .destination import DestinationOut


class ItineraryLegIn(BaseModel):
    swipe_session_id: uuid.UUID
    destination_id: uuid.UUID
    start_date: Optional[dt.date] = None
    end_date: Optional[dt.date] = None


class GenerateItineraryRequest(BaseModel):
    # Multi-destination trips send `legs`; single-destination clients may
    # still send the flat fields below instead.
    legs: Optional[list[ItineraryLegIn]] = None
    swipe_session_id: Optional[uuid.UUID] = None
    destination_id: Optional[uuid.UUID] = None
    # NOTE: fields holding dates must not use the bare `date` type when a field
    # is named "date" — the name shadows it during model build.
    start_date: Optional[dt.date] = None
    end_date: Optional[dt.date] = None
    start_time: str = "09:00"


class ItineraryStopOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    order: int
    day: int = 1
    place: PlaceOut
    arrival_time: Optional[str] = None
    departure_time: Optional[str] = None
    travel_time_to_next_minutes: int
    travel_mode: Literal["walking", "driving", "transit"]


class ItineraryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    destination: DestinationOut
    date: Optional[dt.date] = None
    end_date: Optional[dt.date] = None
    start_time: Optional[str] = None
    total_duration_minutes: int
    is_saved: bool = False
    is_public: bool = False
    stops: list[ItineraryStopOut]
    created_at: dt.datetime
    updated_at: dt.datetime
    # Rating summary — populated for public trips (explore feed, trip detail)
    avg_rating: Optional[float] = None
    ratings_count: int = 0
    my_rating: Optional[int] = None


class RateItineraryRequest(BaseModel):
    stars: int = Field(ge=1, le=5)
