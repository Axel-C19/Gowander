from __future__ import annotations

from pydantic import BaseModel
from typing import Literal, Optional


class FlightOption(BaseModel):
    airline: str
    flight_number: str
    departure_time: Optional[str] = None   # "09:40"
    arrival_time: Optional[str] = None
    duration_minutes: Optional[int] = None
    price: Optional[float] = None          # USD
    stops: int = 0
    from_airport: Optional[str] = None     # IATA
    to_airport: Optional[str] = None


class GroundOption(BaseModel):
    mode: Literal["train", "bus", "car"]
    duration_minutes: int
    price: float


class TransferSearchOut(BaseModel):
    distance_km: float
    recommended_mode: Literal["flight", "train", "bus", "car"]
    from_airport: Optional[str] = None
    to_airport: Optional[str] = None
    # 'google_flights' = live SerpAPI data, 'estimated' = offline generator
    flights_source: Literal["google_flights", "estimated", "none"]
    flights: list[FlightOption]
    ground: list[GroundOption]
