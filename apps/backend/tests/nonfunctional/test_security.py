"""Non-functional tests — security (ISW112 Unidad II §2.2).

Covers: authentication enforcement on every protected endpoint,
token integrity, and cross-user data isolation (authorization).
"""

import pytest
from app.core.security import create_access_token, hash_password
from app.models.user import User

PROTECTED_ENDPOINTS = [
    ("GET", "/api/v1/auth/me"),
    ("PUT", "/api/v1/auth/me/preferences"),
    ("GET", "/api/v1/destinations"),
    ("GET", "/api/v1/destinations/search?q=paris"),
    ("POST", "/api/v1/swipe/session"),
    ("POST", "/api/v1/itinerary/generate"),
    ("GET", "/api/v1/itinerary"),
]


class TestAuthenticationEnforcement:
    @pytest.mark.parametrize("method,path", PROTECTED_ENDPOINTS)
    def test_rejects_unauthenticated(self, client, method, path):
        r = client.request(method, path, json={})
        assert r.status_code in (401, 403), f"{method} {path} allowed unauthenticated access"

    def test_rejects_malformed_token(self, client):
        r = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer not-a-jwt"})
        assert r.status_code == 401

    def test_rejects_token_with_invalid_subject(self, client):
        token = create_access_token("not-a-uuid")
        r = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 401

    def test_rejects_token_for_deleted_user(self, client):
        token = create_access_token("00000000-0000-0000-0000-000000000099")
        r = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 401


class TestCrossUserIsolation:
    @pytest.fixture
    def other_headers(self, db):
        other = User(email="other@x.com", full_name="Other", hashed_password=hash_password("x"))
        db.add(other)
        db.commit()
        db.refresh(other)
        return {"Authorization": f"Bearer {create_access_token(str(other.id))}"}

    def test_cannot_act_on_others_swipe_session(self, client, other_headers, completed_session, places):
        r = client.post(
            f"/api/v1/swipe/session/{completed_session.id}/action",
            json={"place_id": str(places[0].id), "decision": "accepted"},
            headers=other_headers,
        )
        assert r.status_code == 404   # Existence is not even revealed

    def test_cannot_generate_from_others_session(self, client, other_headers, completed_session, destination):
        r = client.post(
            "/api/v1/itinerary/generate",
            json={
                "swipe_session_id": str(completed_session.id),
                "destination_id": str(destination.id),
                "start_date": "2026-06-20",
            },
            headers=other_headers,
        )
        assert r.status_code == 422   # Engine reports "session not found"


class TestPasswordHandling:
    def test_password_never_returned(self, client, auth_headers):
        r = client.get("/api/v1/auth/me", headers=auth_headers)
        body = r.json()
        assert "password" not in body
        assert "hashed_password" not in body

    def test_weak_password_rejected_on_register(self, client):
        r = client.post(
            "/api/v1/auth/register",
            json={"email": "weak@x.com", "password": "short", "full_name": "W"},
        )
        assert r.status_code == 422
