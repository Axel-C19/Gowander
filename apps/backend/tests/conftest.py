"""
Shared pytest fixtures.
Uses an in-memory SQLite DB for speed — no Docker needed for unit tests.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.models.base import Base
from app.db.session import get_db
from app.models.user import User
from app.core.security import hash_password, create_access_token

TEST_DB_URL = "sqlite://"

engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,   # Single shared in-memory DB across connections
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def create_tables():
    """Fresh schema per test — full isolation, no leaked rows between tests."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db) -> User:
    user = User(
        email="test@gowander.app",
        full_name="Test User",
        hashed_password=hash_password("testpass123"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user: User) -> dict:
    token = create_access_token(str(test_user.id))
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def destination(db):
    from app.models.destination import Destination

    dest = Destination(
        name="Paris, France", city="Paris", country="France",
        country_code="FR", latitude=48.8566, longitude=2.3522,
    )
    db.add(dest)
    db.commit()
    db.refresh(dest)
    return dest


@pytest.fixture
def places(db, destination):
    """Five Paris places: 3 always open, 1 closed Mondays, 1 closed Mon+Tue."""
    from app.models.place import Place

    specs = [
        ("Eiffel Tower", "landmark", 48.8584, 2.2945, 120, {"always_open": True}),
        ("Notre-Dame", "religious", 48.8530, 2.3499, 60, {"always_open": True}),
        ("Sacré-Cœur", "religious", 48.8867, 2.3431, 60, {"always_open": True}),
        ("Louvre", "museum", 48.8606, 2.3376, 180,
         {"monday": {"closed": True}, "tuesday": {"open": "09:00", "close": "18:00"}}),
        ("Musée d'Orsay", "museum", 48.8600, 2.3266, 150,
         {"monday": {"closed": True}, "tuesday": {"closed": True}}),
    ]
    out = []
    for name, cat, lat, lon, minutes, hours in specs:
        p = Place(
            destination_id=destination.id, name=name, description=f"{name} desc",
            category=cat, latitude=lat, longitude=lon,
            estimated_duration_minutes=minutes, opening_hours=hours,
        )
        db.add(p)
        out.append(p)
    db.commit()
    for p in out:
        db.refresh(p)
    return out


@pytest.fixture
def completed_session(db, test_user, destination, places):
    """A completed swipe session where every place was accepted."""
    from app.models.swipe_session import SwipeSession, SwipeAction

    session = SwipeSession(user_id=test_user.id, destination_id=destination.id, completed=True)
    db.add(session)
    db.commit()
    db.refresh(session)
    for p in places:
        db.add(SwipeAction(session_id=session.id, place_id=p.id, decision="accepted"))
    db.commit()
    return session
