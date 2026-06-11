from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from typing import Optional
from datetime import datetime
import uuid

VALID_INTERESTS = {
    "culture", "gastronomy", "history", "nature", "nightlife",
    "art", "extreme", "shopping", "architecture",
}


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: str
    preferences: Optional[list[str]] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if not v:
            raise ValueError("Name can't be empty")
        if len(v) > 255:
            raise ValueError("Name is too long")
        return v

    @field_validator("bio")
    @classmethod
    def validate_bio(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if len(v) > 500:
            raise ValueError("Bio must be 500 characters or fewer")
        return v


class GoogleLoginRequest(BaseModel):
    id_token: str


class UpdatePreferencesRequest(BaseModel):
    preferences: list[str]

    @field_validator("preferences")
    @classmethod
    def validate_interests(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("Select at least one interest")
        invalid = set(v) - VALID_INTERESTS
        if invalid:
            raise ValueError(f"Unknown interests: {', '.join(sorted(invalid))}")
        return list(dict.fromkeys(v))   # De-duplicate, preserve order


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
