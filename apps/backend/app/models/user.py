from sqlalchemy import Column, String, Boolean, JSON
from sqlalchemy.orm import relationship
from .base import Base, UUIDMixin, TimestampMixin


class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    # Travel interest categories, e.g. ["culture", "gastronomy"]. NULL = never asked.
    preferences = Column(JSON, nullable=True)
    # "/static/avatars/<file>" for uploads, or an external URL (Google photo)
    avatar_url = Column(String(500), nullable=True)
    bio = Column(String(500), nullable=True)
    # Google account `sub` claim when the user signs in with Google
    google_id = Column(String(255), unique=True, nullable=True, index=True)

    swipe_sessions = relationship("SwipeSession", back_populates="user", lazy="dynamic")
    itineraries = relationship("Itinerary", back_populates="user", lazy="dynamic")

    def __repr__(self) -> str:
        return f"<User {self.email}>"
