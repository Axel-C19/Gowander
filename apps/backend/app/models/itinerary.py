from sqlalchemy import Column, String, Integer, Date, ForeignKey, Float, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base, UUIDMixin, TimestampMixin


class Itinerary(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "itineraries"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    destination_id = Column(UUID(as_uuid=True), ForeignKey("destinations.id"), nullable=False)
    swipe_session_id = Column(UUID(as_uuid=True), ForeignKey("swipe_sessions.id"), nullable=True)

    title = Column(String(255), nullable=False)
    date = Column(Date, nullable=True)           # Trip start date
    end_date = Column(Date, nullable=True)       # Trip end date (same as date for 1-day trips)
    start_time = Column(String(5), nullable=True)   # "09:00"
    total_duration_minutes = Column(Integer, default=0, nullable=False)
    # Generated itineraries start unsaved; the user explicitly saves to keep them
    is_saved = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="itineraries")
    destination = relationship("Destination")
    swipe_session = relationship("SwipeSession", back_populates="itinerary")
    stops = relationship(
        "ItineraryStop",
        back_populates="itinerary",
        cascade="all, delete-orphan",
        order_by="ItineraryStop.order",
    )


class ItineraryStop(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "itinerary_stops"

    itinerary_id = Column(UUID(as_uuid=True), ForeignKey("itineraries.id"), nullable=False, index=True)
    place_id = Column(UUID(as_uuid=True), ForeignKey("places.id"), nullable=False)

    order = Column(Integer, nullable=False)
    day = Column(Integer, default=1, nullable=False)    # 1-based trip day
    arrival_time = Column(String(5), nullable=True)     # "10:30"
    departure_time = Column(String(5), nullable=True)   # "12:00"
    travel_time_to_next_minutes = Column(Integer, default=0, nullable=False)
    travel_mode = Column(String(20), default="walking", nullable=False)
    travel_distance_meters = Column(Float, nullable=True)

    itinerary = relationship("Itinerary", back_populates="stops")
    place = relationship("Place", back_populates="itinerary_stops")
