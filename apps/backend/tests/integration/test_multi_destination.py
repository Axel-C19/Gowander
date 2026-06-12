"""Functional tests — multi-destination itineraries (legs)."""

import pytest
from app.models.destination import Destination
from app.models.place import Place
from app.models.swipe_session import SwipeSession, SwipeAction


@pytest.fixture
def second_leg(db, test_user):
    """Amsterdam destination with 2 accepted places in a completed session."""
    dest = Destination(
        name="Amsterdam, Netherlands", city="Amsterdam", country="Netherlands",
        country_code="NL", latitude=52.36, longitude=4.90,
    )
    db.add(dest)
    db.flush()
    places = [
        Place(destination_id=dest.id, name="Rijksmuseum", description="d", category="museum",
              latitude=52.36, longitude=4.885, estimated_duration_minutes=120,
              opening_hours={"always_open": True}),
        Place(destination_id=dest.id, name="Vondelpark", description="d", category="park",
              latitude=52.357, longitude=4.868, estimated_duration_minutes=60,
              opening_hours={"always_open": True}),
    ]
    db.add_all(places)
    db.flush()
    session = SwipeSession(user_id=test_user.id, destination_id=dest.id, completed=True)
    db.add(session)
    db.commit()
    db.refresh(session)
    db.add_all([
        SwipeAction(session_id=session.id, place_id=p.id, decision="accepted")
        for p in places
    ])
    db.commit()
    return {"destination": dest, "session": session}


class TestMultiDestination:
    def test_two_city_trip(self, client, auth_headers, completed_session, destination, second_leg):
        r = client.post("/api/v1/itinerary/generate", json={
            "legs": [
                {
                    "swipe_session_id": str(completed_session.id),
                    "destination_id": str(destination.id),
                    "start_date": "2026-06-20",
                    "end_date": "2026-06-21",
                },
                {
                    "swipe_session_id": str(second_leg["session"].id),
                    "destination_id": str(second_leg["destination"].id),
                    "start_date": "2026-06-22",
                    "end_date": "2026-06-23",
                },
            ],
        }, headers=auth_headers)
        assert r.status_code == 201
        body = r.json()

        # Title names both cities; trip spans full range
        assert "Paris" in body["title"] and "Amsterdam" in body["title"]
        assert body["date"] == "2026-06-20"
        assert body["end_date"] == "2026-06-23"

        # All places from both legs present (5 Paris + 2 Amsterdam)
        assert len(body["stops"]) == 7

        # Amsterdam stops land on days 3-4 (calendar-anchored offsets)
        ams = [s for s in body["stops"] if s["place"]["name"] in ("Rijksmuseum", "Vondelpark")]
        assert all(s["day"] >= 3 for s in ams)
        paris_days = [s["day"] for s in body["stops"] if s not in ams]
        assert all(d <= 2 for d in paris_days)

    def test_overlapping_legs_rejected(self, client, auth_headers, completed_session, destination, second_leg):
        r = client.post("/api/v1/itinerary/generate", json={
            "legs": [
                {"swipe_session_id": str(completed_session.id), "destination_id": str(destination.id),
                 "start_date": "2026-06-20", "end_date": "2026-06-22"},
                {"swipe_session_id": str(second_leg["session"].id), "destination_id": str(second_leg["destination"].id),
                 "start_date": "2026-06-21", "end_date": "2026-06-23"},
            ],
        }, headers=auth_headers)
        assert r.status_code == 422

    def test_empty_body_rejected(self, client, auth_headers):
        r = client.post("/api/v1/itinerary/generate", json={}, headers=auth_headers)
        assert r.status_code == 422

    def test_single_leg_flat_fields_still_work(self, client, auth_headers, completed_session, destination):
        r = client.post("/api/v1/itinerary/generate", json={
            "swipe_session_id": str(completed_session.id),
            "destination_id": str(destination.id),
            "start_date": "2026-06-20",
        }, headers=auth_headers)
        assert r.status_code == 201
        assert r.json()["title"].startswith("Paris —")
