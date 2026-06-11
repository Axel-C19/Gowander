"""Functional tests — star ratings on public trips and explore ranking."""

import pytest
from app.core.security import hash_password, create_access_token
from app.models.user import User
from app.models.itinerary import Itinerary


@pytest.fixture
def friend(db):
    u = User(email="rater@x.com", full_name="Rater One", hashed_password=hash_password("x"))
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@pytest.fixture
def friend_headers(friend):
    return {"Authorization": f"Bearer {create_access_token(str(friend.id))}"}


def make_trip(db, user_id, destination_id, title="Paris — Jun 15"):
    it = Itinerary(user_id=user_id, destination_id=destination_id,
                   title=title, total_duration_minutes=120)
    db.add(it)
    db.commit()
    db.refresh(it)
    return it


@pytest.fixture
def public_trip(client, db, test_user, destination, auth_headers):
    trip = make_trip(db, test_user.id, destination.id)
    r = client.post(f"/api/v1/itinerary/{trip.id}/publish", headers=auth_headers)
    assert r.status_code == 200
    return trip


class TestRateTrip:
    def test_rate_public_trip(self, client, friend_headers, public_trip):
        r = client.post(
            f"/api/v1/itinerary/{public_trip.id}/rate",
            json={"stars": 4},
            headers=friend_headers,
        )
        assert r.status_code == 200
        body = r.json()
        assert body["my_rating"] == 4
        assert body["avg_rating"] == 4.0
        assert body["ratings_count"] == 1

        # GET reflects the rating too
        r = client.get(f"/api/v1/itinerary/{public_trip.id}", headers=friend_headers)
        assert r.json()["my_rating"] == 4

    def test_rerate_updates_not_duplicates(self, client, friend_headers, public_trip):
        client.post(f"/api/v1/itinerary/{public_trip.id}/rate", json={"stars": 2}, headers=friend_headers)
        r = client.post(f"/api/v1/itinerary/{public_trip.id}/rate", json={"stars": 5}, headers=friend_headers)
        body = r.json()
        assert body["my_rating"] == 5
        assert body["avg_rating"] == 5.0
        assert body["ratings_count"] == 1

    def test_owner_cannot_rate_own_trip(self, client, auth_headers, public_trip):
        r = client.post(f"/api/v1/itinerary/{public_trip.id}/rate", json={"stars": 5}, headers=auth_headers)
        assert r.status_code == 400

    def test_cannot_rate_private_trip(self, client, db, test_user, destination, friend_headers):
        trip = make_trip(db, test_user.id, destination.id)
        # Not viewable by a stranger at all
        r = client.post(f"/api/v1/itinerary/{trip.id}/rate", json={"stars": 5}, headers=friend_headers)
        assert r.status_code == 404

    def test_invalid_stars_rejected(self, client, friend_headers, public_trip):
        for stars in (0, 6):
            r = client.post(
                f"/api/v1/itinerary/{public_trip.id}/rate",
                json={"stars": stars},
                headers=friend_headers,
            )
            assert r.status_code == 422


class TestExploreRanking:
    def test_rated_trips_rank_first(self, client, db, test_user, destination, auth_headers, friend_headers):
        older = make_trip(db, test_user.id, destination.id, title="Older trip")
        newer = make_trip(db, test_user.id, destination.id, title="Newer trip")
        for t in (older, newer):
            client.post(f"/api/v1/itinerary/{t.id}/publish", headers=auth_headers)

        # Unrated: newest first
        feed = client.get("/api/v1/explore", headers=friend_headers).json()
        assert [t["itinerary"]["title"] for t in feed] == ["Newer trip", "Older trip"]

        # Rating the older trip promotes it to the top
        client.post(f"/api/v1/itinerary/{older.id}/rate", json={"stars": 5}, headers=friend_headers)
        feed = client.get("/api/v1/explore", headers=friend_headers).json()
        assert [t["itinerary"]["title"] for t in feed] == ["Older trip", "Newer trip"]
        assert feed[0]["itinerary"]["avg_rating"] == 5.0
        assert feed[0]["itinerary"]["my_rating"] == 5
