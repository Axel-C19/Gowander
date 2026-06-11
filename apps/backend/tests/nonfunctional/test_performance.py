"""Non-functional tests — performance (ISW112 Unidad II §2.2).

Budgets are deliberately generous for CI machines; the point is catching
order-of-magnitude regressions (e.g. an accidental O(n³) in the engine).
"""

import time
import pytest
from app.models.place import Place
from app.models.swipe_session import SwipeSession, SwipeAction


@pytest.fixture
def big_session(db, test_user, destination):
    """A completed session with 50 accepted places (stress for the engine)."""
    places = [
        Place(
            destination_id=destination.id,
            name=f"Place {i}",
            description="d",
            category="landmark",
            latitude=48.80 + i * 0.002,
            longitude=2.25 + i * 0.003,
            estimated_duration_minutes=45,
            opening_hours={"always_open": True},
        )
        for i in range(50)
    ]
    db.add_all(places)
    db.commit()
    session = SwipeSession(user_id=test_user.id, destination_id=destination.id, completed=True)
    db.add(session)
    db.commit()
    db.refresh(session)
    db.add_all([
        SwipeAction(session_id=session.id, place_id=p.id, decision="accepted")
        for p in places
    ])
    db.commit()
    return session


class TestPerformance:
    def test_generate_50_places_under_2s(self, client, auth_headers, destination, big_session):
        start = time.perf_counter()
        r = client.post(
            "/api/v1/itinerary/generate",
            json={
                "swipe_session_id": str(big_session.id),
                "destination_id": str(destination.id),
                "start_date": "2026-06-20",
                "end_date": "2026-06-26",
            },
            headers=auth_headers,
        )
        elapsed = time.perf_counter() - start
        assert r.status_code == 201
        assert elapsed < 2.0, f"Generation took {elapsed:.2f}s (budget 2s)"

    def test_destination_list_under_500ms(self, client, auth_headers, destination):
        start = time.perf_counter()
        r = client.get("/api/v1/destinations", headers=auth_headers)
        elapsed = time.perf_counter() - start
        assert r.status_code == 200
        assert elapsed < 0.5, f"List took {elapsed:.2f}s (budget 0.5s)"

    def test_login_under_1s(self, client, test_user):
        start = time.perf_counter()
        r = client.post(
            "/api/v1/auth/login",
            json={"email": "test@gowander.app", "password": "testpass123"},
        )
        elapsed = time.perf_counter() - start
        assert r.status_code == 200
        # bcrypt dominates here by design; 1s budget catches pathological config
        assert elapsed < 1.0, f"Login took {elapsed:.2f}s (budget 1s)"
