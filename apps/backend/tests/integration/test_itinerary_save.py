"""Functional tests — R-09: the user can save itineraries and revisit them."""

import pytest
from app.models.destination import Destination
from app.models.itinerary import Itinerary


@pytest.fixture
def itinerary(db, test_user) -> Itinerary:
    dest = Destination(
        name="Paris, France", city="Paris", country="France",
        country_code="FR", latitude=48.85, longitude=2.35,
    )
    db.add(dest)
    db.flush()
    it = Itinerary(
        user_id=test_user.id,
        destination_id=dest.id,
        title="Paris — Jun 15",
        total_duration_minutes=120,
    )
    db.add(it)
    db.commit()
    db.refresh(it)
    return it


class TestSaveItinerary:
    def test_generated_itinerary_starts_unsaved(self, itinerary):
        assert itinerary.is_saved is False

    def test_save_marks_itinerary_saved(self, client, auth_headers, itinerary):
        r = client.post(f"/api/v1/itinerary/{itinerary.id}/save", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["is_saved"] is True

    def test_list_returns_only_saved(self, client, auth_headers, itinerary):
        # Unsaved → not listed
        r = client.get("/api/v1/itinerary", headers=auth_headers)
        assert r.json() == []

        # Saved → listed
        client.post(f"/api/v1/itinerary/{itinerary.id}/save", headers=auth_headers)
        r = client.get("/api/v1/itinerary", headers=auth_headers)
        assert len(r.json()) == 1
        assert r.json()[0]["id"] == str(itinerary.id)

    def test_cannot_save_other_users_itinerary(self, client, db, itinerary):
        from app.models.user import User
        from app.core.security import hash_password, create_access_token

        other = User(email="other@x.com", full_name="O", hashed_password=hash_password("x"))
        db.add(other)
        db.commit()
        db.refresh(other)
        headers = {"Authorization": f"Bearer {create_access_token(str(other.id))}"}

        r = client.post(f"/api/v1/itinerary/{itinerary.id}/save", headers=headers)
        assert r.status_code == 404
