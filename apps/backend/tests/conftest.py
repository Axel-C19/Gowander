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
