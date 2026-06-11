from __future__ import annotations

from pydantic import BaseModel, ConfigDict, model_validator
from typing import Optional
import uuid
import datetime as dt


class UserPublic(BaseModel):
    """What other users can see about a user."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    full_name: str
    email: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None


class FriendRequestIn(BaseModel):
    user_id: uuid.UUID


class FriendRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    requester: UserPublic
    created_at: dt.datetime


class FriendOut(BaseModel):
    friendship_id: uuid.UUID
    user: UserPublic


class MessageIn(BaseModel):
    recipient_id: uuid.UUID
    text: Optional[str] = None
    itinerary_id: Optional[uuid.UUID] = None

    @model_validator(mode="after")
    def text_or_trip(self):
        if not self.text and not self.itinerary_id:
            raise ValueError("Message needs text or a shared trip")
        return self


class SharedTripPreview(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    total_duration_minutes: int


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    sender_id: uuid.UUID
    recipient_id: uuid.UUID
    text: Optional[str] = None
    itinerary: Optional[SharedTripPreview] = None
    created_at: dt.datetime
