from sqlalchemy import Column, String, Float
from sqlalchemy.orm import relationship
from .base import Base, UUIDMixin, TimestampMixin


class Destination(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "destinations"

    name = Column(String(255), nullable=False)
    city = Column(String(255), nullable=False, index=True)
    country = Column(String(255), nullable=False, index=True)
    country_code = Column(String(3), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    image_url = Column(String(500), nullable=True)

    places = relationship("Place", back_populates="destination", lazy="dynamic")
    swipe_sessions = relationship("SwipeSession", back_populates="destination")

    def __repr__(self) -> str:
        return f"<Destination {self.city}, {self.country}>"
