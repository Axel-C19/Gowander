from sqlalchemy import Column, String, Float, Integer, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base, UUIDMixin, TimestampMixin

PLACE_CATEGORIES = (
    "museum", "restaurant", "landmark", "park",
    "shopping", "entertainment", "religious", "viewpoint", "beach", "other",
)


class Place(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "places"

    destination_id = Column(UUID(as_uuid=True), ForeignKey("destinations.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(2000), nullable=True)
    category = Column(String(50), nullable=False, default="other")
    rating = Column(Float, nullable=True)           # 1.0–5.0
    image_url = Column(String(500), nullable=True)
    address = Column(String(500), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    opening_hours = Column(JSON, nullable=True)     # Matches OpeningHours TS type
    estimated_duration_minutes = Column(Integer, default=60, nullable=False)
    google_place_id = Column(String(255), nullable=True, unique=True)

    destination = relationship("Destination", back_populates="places")
    itinerary_stops = relationship("ItineraryStop", back_populates="place")

    def __repr__(self) -> str:
        return f"<Place {self.name}>"
