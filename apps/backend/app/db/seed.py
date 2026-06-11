"""
Development seed script.
Run: python -m app.db.seed
Creates one demo user and the 50-city destination catalogue with places.
Idempotent: re-running updates place data without duplicating rows.
"""

from sqlalchemy import text
from app.db.session import SessionLocal
from app.models.base import Base
from app.db.session import engine
from app.models.user import User
from app.models.destination import Destination
from app.models.place import Place
from app.core.security import hash_password
from app.db.seed_data import CITIES, PLACES, expand_hours, img
from app.db.image_urls import CITY_IMAGES, PLACE_IMAGES


def seed():
    Base.metadata.create_all(bind=engine)

    # create_all never alters existing tables — add columns introduced later
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSON"))
        conn.execute(text(
            "ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS is_saved BOOLEAN NOT NULL DEFAULT FALSE"
        ))
        conn.execute(text("ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS end_date DATE"))
        conn.execute(text(
            "ALTER TABLE itinerary_stops ADD COLUMN IF NOT EXISTS day INTEGER NOT NULL DEFAULT 1"
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

        created_cities = 0
        created_places = 0
        updated_places = 0

        for name, city, country, country_code, lat, lon in CITIES:
            city_image = CITY_IMAGES.get(city) or img(city.lower().replace(" ", ","))
            destination = db.query(Destination).filter(Destination.city == city).first()
            if not destination:
                destination = Destination(
                    name=name,
                    city=city,
                    country=country,
                    country_code=country_code,
                    latitude=lat,
                    longitude=lon,
                    image_url=city_image,
                )
                db.add(destination)
                db.flush()
                created_cities += 1
            else:
                destination.image_url = city_image

            for (p_name, desc, category, rating, p_lat, p_lon,
                 minutes, hours, img_query) in PLACES.get(city, []):
                place_image = PLACE_IMAGES.get(f"{city}|{p_name}") or img(img_query)
                place = db.query(Place).filter(
                    Place.destination_id == destination.id,
                    Place.name == p_name,
                ).first()
                if place:
                    place.opening_hours = expand_hours(hours)
                    place.rating = rating
                    place.image_url = place_image
                    updated_places += 1
                else:
                    db.add(Place(
                        destination_id=destination.id,
                        name=p_name,
                        description=desc,
                        category=category,
                        rating=rating,
                        latitude=p_lat,
                        longitude=p_lon,
                        estimated_duration_minutes=minutes,
                        opening_hours=expand_hours(hours),
                        image_url=place_image,
                    ))
                    created_places += 1

        db.commit()
        print(f"✓ Destinations created: {created_cities}")
        print(f"✓ Places created: {created_places}, updated: {updated_places}")
        print("\nSeed completed.")

    except Exception as exc:
        db.rollback()
        print(f"Seed failed: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
