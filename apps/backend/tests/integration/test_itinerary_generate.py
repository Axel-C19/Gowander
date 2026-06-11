"""Functional tests — R-07: optimized itinerary generation (single and multi-day)."""


def generate(client, headers, session, destination, start, end=None):
    body = {
        "swipe_session_id": str(session.id),
        "destination_id": str(destination.id),
        "start_date": start,
        "start_time": "09:00",
    }
    if end:
        body["end_date"] = end
    return client.post("/api/v1/itinerary/generate", json=body, headers=headers)


class TestSingleDay:
    def test_generates_with_all_open_places(self, client, auth_headers, completed_session, destination):
        # 2026-06-16 is a Tuesday: Orsay (closed Tue) defers but single-day = last day takes overflow
        r = generate(client, auth_headers, completed_session, destination, "2026-06-20")
        assert r.status_code == 201
        body = r.json()
        assert len(body["stops"]) == 5     # accepted places are never dropped
        assert body["title"].startswith("Paris")
        assert all(s["day"] == 1 for s in body["stops"])

    def test_stops_have_times_and_order(self, client, auth_headers, completed_session, destination):
        body = generate(client, auth_headers, completed_session, destination, "2026-06-20").json()
        orders = [s["order"] for s in body["stops"]]
        assert orders == sorted(orders)
        assert all(s["arrival_time"] for s in body["stops"])


class TestMultiDay:
    def test_two_day_trip_spreads_closed_places(self, client, auth_headers, completed_session, destination):
        # Mon 2026-06-15 → Tue 2026-06-16. Louvre (closed Mon) must land on Tuesday (day 2).
        r = generate(client, auth_headers, completed_session, destination, "2026-06-15", "2026-06-16")
        assert r.status_code == 201
        body = r.json()
        assert body["end_date"] == "2026-06-16"
        louvre = next(s for s in body["stops"] if s["place"]["name"] == "Louvre")
        assert louvre["day"] == 2
        assert len(body["stops"]) == 5

    def test_day_numbers_within_range(self, client, auth_headers, completed_session, destination):
        body = generate(client, auth_headers, completed_session, destination, "2026-06-15", "2026-06-17").json()
        assert all(1 <= s["day"] <= 3 for s in body["stops"])


class TestValidation:
    def test_end_before_start_rejected(self, client, auth_headers, completed_session, destination):
        r = generate(client, auth_headers, completed_session, destination, "2026-06-16", "2026-06-15")
        assert r.status_code == 422

    def test_incomplete_session_rejected(self, client, auth_headers, db, test_user, destination, places):
        from app.models.swipe_session import SwipeSession

        s = SwipeSession(user_id=test_user.id, destination_id=destination.id, completed=False)
        db.add(s)
        db.commit()
        db.refresh(s)
        r = generate(client, auth_headers, s, destination, "2026-06-20")
        assert r.status_code == 422

    def test_no_accepted_places_rejected(self, client, auth_headers, db, test_user, destination):
        from app.models.swipe_session import SwipeSession

        s = SwipeSession(user_id=test_user.id, destination_id=destination.id, completed=True)
        db.add(s)
        db.commit()
        db.refresh(s)
        r = generate(client, auth_headers, s, destination, "2026-06-20")
        assert r.status_code == 422
