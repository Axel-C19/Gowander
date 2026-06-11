from pydantic import BaseModel, ConfigDict
from typing import Any
import uuid


class PlaceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None
    category: str
    rating: float | None
    image_url: str | None
    address: str | None
    latitude: float
    longitude: float
    opening_hours: dict[str, Any] | None
    estimated_duration_minutes: int
    destination_id: uuid.UUID
