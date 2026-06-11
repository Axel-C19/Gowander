"""
Development seed script.
Run: python -m app.db.seed
Creates one demo user and a set of destinations with places.
"""

import uuid
from sqlalchemy import text
from app.db.session import SessionLocal
from app.models.base import Base
from app.db.session import engine
from app.models.user import User
from app.models.destination import Destination
from app.models.place import Place
from app.core.security import hash_password


DESTINATIONS = [
    {
        "name": "Paris, France",
        "city": "Paris",
        "country": "France",
        "country_code": "FR",
        "latitude": 48.8566,
        "longitude": 2.3522,
        "image_url": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800",
    },
    {
        "name": "Barcelona, Spain",
        "city": "Barcelona",
        "country": "Spain",
        "country_code": "ES",
        "latitude": 41.3851,
        "longitude": 2.1734,
        "image_url": "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800",
    },
    {
        "name": "Tokyo, Japan",
        "city": "Tokyo",
        "country": "Japan",
        "country_code": "JP",
        "latitude": 35.6762,
        "longitude": 139.6503,
        "image_url": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800",
    },
]

PARIS_PLACES = [
    {
        "name": "Eiffel Tower",
        "description": "Iconic iron lattice tower on the Champ de Mars, symbol of Paris.",
        "category": "landmark",
        "rating": 4.7,
        "latitude": 48.8584,
        "longitude": 2.2945,
        "estimated_duration_minutes": 120,
        "opening_hours": {
            "monday": {"open": "09:00", "close": "23:45"},
            "tuesday": {"open": "09:00", "close": "23:45"},
            "wednesday": {"open": "09:00", "close": "23:45"},
            "thursday": {"open": "09:00", "close": "23:45"},
            "friday": {"open": "09:00", "close": "23:45"},
            "saturday": {"open": "09:00", "close": "23:45"},
            "sunday": {"open": "09:00", "close": "23:45"},
        },
        "image_url": "https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=600",
    },
    {
        "name": "Louvre Museum",
        "description": "World's largest art museum and home to the Mona Lisa.",
        "category": "museum",
        "rating": 4.7,
        "latitude": 48.8606,
        "longitude": 2.3376,
        "estimated_duration_minutes": 180,
        "opening_hours": {
            "monday": {"closed": True},
            "tuesday": {"open": "09:00", "close": "18:00"},
            "wednesday": {"open": "09:00", "close": "21:45"},
            "thursday": {"open": "09:00", "close": "18:00"},
            "friday": {"open": "09:00", "close": "21:45"},
            "saturday": {"open": "09:00", "close": "18:00"},
            "sunday": {"open": "09:00", "close": "18:00"},
        },
        "image_url": "https://images.unsplash.com/photo-1565799015042-58ae50c1cfef?w=600",
    },
    {
        "name": "Notre-Dame Cathedral",
        "description": "Medieval Catholic cathedral on the Île de la Cité.",
        "category": "religious",
        "rating": 4.7,
        "latitude": 48.8530,
        "longitude": 2.3499,
        "estimated_duration_minutes": 60,
        "opening_hours": {"always_open": True},
        "image_url": "https://images.unsplash.com/photo-1566154018635-f6b4afddb264?w=600",
    },
    {
        "name": "Musée d'Orsay",
        "description": "Impressionist and post-Impressionist masterpieces in a former railway station.",
        "category": "museum",
        "rating": 4.7,
        "latitude": 48.8600,
        "longitude": 2.3266,
        "estimated_duration_minutes": 150,
        "opening_hours": {
            "monday": {"closed": True},
            "tuesday": {"open": "09:30", "close": "18:00"},
            "wednesday": {"open": "09:30", "close": "18:00"},
            "thursday": {"open": "09:30", "close": "21:45"},
            "friday": {"open": "09:30", "close": "18:00"},
            "saturday": {"open": "09:30", "close": "18:00"},
            "sunday": {"open": "09:30", "close": "18:00"},
        },
        "image_url": "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=600",
    },
    {
        "name": "Sacré-Cœur Basilica",
        "description": "White travertine basilica atop the butte of Montmartre with panoramic views.",
        "category": "religious",
        "rating": 4.7,
        "latitude": 48.8867,
        "longitude": 2.3431,
        "estimated_duration_minutes": 60,
        "opening_hours": {"always_open": True},
        "image_url": "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=600",
    },
]


def seed():
    Base.metadata.create_all(bind=engine)

    # create_all never alters existing tables — add columns introduced later
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSON"))
        conn.execute(text(
            "ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS is_saved BOOLEAN NOT NULL DEFAULT FALSE"
        ))
        conn.commit()

    db = SessionLocal()

    try:
        # Demo user
        if not db.query(User).filter(User.email == "demo@gowander.app").first():
            user = User(
                email="demo@gowander.app",
                full_name="Demo User",
                hashed_password=hash_password("demo1234"),
            )
            db.add(user)
            print("✓ Demo user created  (demo@gowander.app / demo1234)")

        # Destinations + places
        for dest_data in DESTINATIONS:
            existing = db.query(Destination).filter(
                Destination.city == dest_data["city"]
            ).first()
            if existing:
                # Refresh place data (e.g. opening hours) for already-seeded destinations
                if dest_data["city"] == "Paris":
                    for p in PARIS_PLACES:
                        place = db.query(Place).filter(
                            Place.destination_id == existing.id,
                            Place.name == p["name"],
                        ).first()
                        if place:
                            place.opening_hours = p["opening_hours"]
                        else:
                            db.add(Place(destination_id=existing.id, **p))
                    print(f"✓ {dest_data['city']}  (places refreshed)")
                continue

            destination = Destination(**dest_data)
            db.add(destination)
            db.flush()

            if dest_data["city"] == "Paris":
                for p in PARIS_PLACES:
                    db.add(Place(destination_id=destination.id, **p))
                print(f"✓ {dest_data['city']}  ({len(PARIS_PLACES)} places)")
            else:
                print(f"✓ {dest_data['city']}  (no places yet — add via admin)")

        db.commit()
        print("\nSeed completed.")

    except Exception as exc:
        db.rollback()
        print(f"Seed failed: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
