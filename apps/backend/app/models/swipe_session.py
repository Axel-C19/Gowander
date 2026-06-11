from sqlalchemy import Column, String, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base, UUIDMixin, TimestampMixin


class SwipeSession(Base, UUIDMixin, TimestampMixin):
    """
    One session per user per destination per day.
    Tracks which places were swiped and in what direction.
    """
    __tablename__ = "swipe_sessions"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    destination_id = Column(UUID(as_uuid=True), ForeignKey("destinations.id"), nullable=False)
    completed = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="swipe_sessions")
    destination = relationship("Destination", back_populates="swipe_sessions")
    actions = relationship(
        "SwipeAction",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="SwipeAction.created_at",
    )
    itinerary = relationship("Itinerary", back_populates="swipe_session", uselist=False)


class SwipeAction(Base, UUIDMixin, TimestampMixin):
    """
    Individual swipe record: one row per card swiped.
    Decision is 'accepted' or 'rejected'.
    """
    __tablename__ = "swipe_actions"
    __table_args__ = (
        UniqueConstraint("session_id", "place_id", name="uq_session_place"),
    )

    session_id = Column(UUID(as_uuid=True), ForeignKey("swipe_sessions.id"), nullable=False, index=True)
    place_id = Column(UUID(as_uuid=True), ForeignKey("places.id"), nullable=False)
    decision = Column(String(20), nullable=False)   # 'accepted' | 'rejected'

    session = relationship("SwipeSession", back_populates="actions")
    place = relationship("Place")
