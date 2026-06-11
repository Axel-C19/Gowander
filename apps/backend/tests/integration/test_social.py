"""Functional tests — social: friends, messages, trip sharing, explore."""

import pytest
from app.core.security import hash_password, create_access_token
from app.models.user import User


@pytest.fixture
def friend(db):
    u = User(email="friend@x.com", full_name="Friend One", hashed_password=hash_password("x"))
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@pytest.fixture
def friend_headers(friend):
    return {"Authorization": f"Bearer {create_access_token(str(friend.id))}"}


def befriend(client, my_headers, their_headers, their_id):
    r = client.post("/api/v1/social/friends/request", json={"user_id": str(their_id)}, headers=my_headers)
    assert r.status_code == 201
    req_id = client.get("/api/v1/social/friends/requests", headers=their_headers).json()[0]["id"]
    r = client.post(f"/api/v1/social/friends/requests/{req_id}/accept", headers=their_headers)
    assert r.status_code == 200


class TestFriends:
    def test_search_users(self, client, auth_headers, friend):
        r = client.get("/api/v1/social/users/search?q=friend", headers=auth_headers)
        assert any(u["email"] == "friend@x.com" for u in r.json())

    def test_full_friendship_flow(self, client, auth_headers, friend_headers, friend, test_user):
        befriend(client, auth_headers, friend_headers, friend.id)
        mine = client.get("/api/v1/social/friends", headers=auth_headers).json()
        theirs = client.get("/api/v1/social/friends", headers=friend_headers).json()
        assert mine[0]["user"]["email"] == "friend@x.com"
        assert theirs[0]["user"]["email"] == test_user.email

    def test_cannot_add_self(self, client, auth_headers, test_user):
        r = client.post("/api/v1/social/friends/request", json={"user_id": str(test_user.id)}, headers=auth_headers)
        assert r.status_code == 422

    def test_duplicate_request_409(self, client, auth_headers, friend):
        client.post("/api/v1/social/friends/request", json={"user_id": str(friend.id)}, headers=auth_headers)
        r = client.post("/api/v1/social/friends/request", json={"user_id": str(friend.id)}, headers=auth_headers)
        assert r.status_code == 409

    def test_decline_request(self, client, auth_headers, friend_headers, friend):
        client.post("/api/v1/social/friends/request", json={"user_id": str(friend.id)}, headers=auth_headers)
        req_id = client.get("/api/v1/social/friends/requests", headers=friend_headers).json()[0]["id"]
        r = client.delete(f"/api/v1/social/friends/requests/{req_id}", headers=friend_headers)
        assert r.status_code == 204
        assert client.get("/api/v1/social/friends", headers=friend_headers).json() == []


class TestMessages:
    def test_cannot_message_non_friend(self, client, auth_headers, friend):
        r = client.post(
            "/api/v1/social/messages",
            json={"recipient_id": str(friend.id), "text": "hi"},
            headers=auth_headers,
        )
        assert r.status_code == 403

    def test_message_flow(self, client, auth_headers, friend_headers, friend):
        befriend(client, auth_headers, friend_headers, friend.id)
        r = client.post(
            "/api/v1/social/messages",
            json={"recipient_id": str(friend.id), "text": "hola!"},
            headers=auth_headers,
        )
        assert r.status_code == 201
        thread = client.get(f"/api/v1/social/messages/{friend.id}", headers=auth_headers).json()
        assert thread[0]["text"] == "hola!"

    def test_empty_message_rejected(self, client, auth_headers, friend_headers, friend):
        befriend(client, auth_headers, friend_headers, friend.id)
        r = client.post(
            "/api/v1/social/messages",
            json={"recipient_id": str(friend.id)},
            headers=auth_headers,
        )
        assert r.status_code == 422


class TestTripSharing:
    @pytest.fixture
    def trip(self, db, test_user, destination):
        from app.models.itinerary import Itinerary

        it = Itinerary(user_id=test_user.id, destination_id=destination.id,
                       title="Paris — Jun 15", total_duration_minutes=120)
        db.add(it)
        db.commit()
        db.refresh(it)
        return it

    def test_publish_shows_in_explore(self, client, auth_headers, friend_headers, trip):
        # Not public yet → explore empty
        assert client.get("/api/v1/explore", headers=friend_headers).json() == []

        r = client.post(f"/api/v1/itinerary/{trip.id}/publish", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["is_public"] is True

        feed = client.get("/api/v1/explore", headers=friend_headers).json()
        assert len(feed) == 1
        assert feed[0]["itinerary"]["title"] == "Paris — Jun 15"
        assert feed[0]["owner"]["email"] == "test@gowander.app"

    def test_unpublish_removes_from_explore(self, client, auth_headers, trip):
        client.post(f"/api/v1/itinerary/{trip.id}/publish", headers=auth_headers)
        client.post(f"/api/v1/itinerary/{trip.id}/unpublish", headers=auth_headers)
        assert client.get("/api/v1/explore", headers=auth_headers).json() == []

    def test_private_share_grants_view_access(self, client, auth_headers, friend_headers, friend, trip):
        # Friend can't see the private trip…
        r = client.get(f"/api/v1/itinerary/{trip.id}", headers=friend_headers)
        assert r.status_code == 404

        # …until it's shared in a message
        befriend(client, auth_headers, friend_headers, friend.id)
        r = client.post(
            "/api/v1/social/messages",
            json={"recipient_id": str(friend.id), "text": "check this trip", "itinerary_id": str(trip.id)},
            headers=auth_headers,
        )
        assert r.status_code == 201
        assert r.json()["itinerary"]["title"] == "Paris — Jun 15"

        r = client.get(f"/api/v1/itinerary/{trip.id}", headers=friend_headers)
        assert r.status_code == 200

    def test_cannot_share_someone_elses_trip(self, client, auth_headers, friend_headers, friend, test_user, trip):
        befriend(client, auth_headers, friend_headers, friend.id)
        r = client.post(
            "/api/v1/social/messages",
            json={"recipient_id": str(test_user.id), "itinerary_id": str(trip.id), "text": "x"},
            headers=friend_headers,   # friend tries to share MY trip back to me
        )
        assert r.status_code == 404
