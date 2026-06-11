from pydantic import BaseModel, ConfigDict
from typing import Literal
import uuid
from datetime import datetime


class SwipeActionIn(BaseModel):
    place_id: uuid.UUID
    decision: Literal["accepted", "rejected"]


class SwipeSessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    destination_id: uuid.UUID
    completed: bool
    created_at: datetime
