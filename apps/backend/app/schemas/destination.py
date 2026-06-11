from pydantic import BaseModel, ConfigDict
import uuid


class DestinationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    city: str
    country: str
    latitude: float
    longitude: float
    image_url: str | None
