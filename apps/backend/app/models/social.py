from sqlalchemy import Column, String, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base, UUIDMixin, TimestampMixin


class Friendship(Base, UUIDMixin, TimestampMixin):
    """
    A friend relationship. Created as 'pending' by the requester;
    becomes 'accepted' when the addressee confirms.
    """
    __tablename__ = "friendships"
    __table_args__ = (
        UniqueConstraint("requester_id", "addressee_id", name="uq_friendship_pair"),
    )

    requester_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    addressee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String(20), default="pending", nullable=False)  # 'pending' | 'accepted'

    requester = relationship("User", foreign_keys=[requester_id])
    addressee = relationship("User", foreign_keys=[addressee_id])


class Message(Base, UUIDMixin, TimestampMixin):
    """
    Direct message between friends. May carry a shared itinerary
    (private trip sharing) alongside or instead of text.
    """
    __tablename__ = "messages"

    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    recipient_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    text = Column(String(2000), nullable=True)
    itinerary_id = Column(UUID(as_uuid=True), ForeignKey("itineraries.id"), nullable=True)

    sender = relationship("User", foreign_keys=[sender_id])
    recipient = relationship("User", foreign_keys=[recipient_id])
    itinerary = relationship("Itinerary")
