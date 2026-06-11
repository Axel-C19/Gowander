"""Functional tests — profile editing (bio, name, avatar) and Google sign-in."""

import io

import httpx
import pytest

from app.api.v1.endpoints import auth as auth_module
from app.core.config import get_settings

# Tiny valid PNG (1x1 transparent pixel)
PNG_BYTES = bytes.fromhex(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489"
    "0000000d4944415478da63fcffff3f030005fe02fea35981840000000049454e44ae426082"
)


class TestUpdateProfile:
    def test_update_bio_and_name(self, client, auth_headers):
        r = client.put(
            "/api/v1/auth/me/profile",
            json={"full_name": "New Name", "bio": "Wanderer of 50 cities."},
            headers=auth_headers,
        )
        assert r.status_code == 200
        assert r.json()["full_name"] == "New Name"
        assert r.json()["bio"] == "Wanderer of 50 cities."

    def test_partial_update_keeps_other_fields(self, client, auth_headers):
        client.put("/api/v1/auth/me/profile", json={"bio": "Hello"}, headers=auth_headers)
        r = client.put("/api/v1/auth/me/profile", json={"full_name": "Only Name"}, headers=auth_headers)
        assert r.json()["bio"] == "Hello"
        assert r.json()["full_name"] == "Only Name"

    def test_empty_bio_clears_it(self, client, auth_headers):
        client.put("/api/v1/auth/me/profile", json={"bio": "Hello"}, headers=auth_headers)
        r = client.put("/api/v1/auth/me/profile", json={"bio": ""}, headers=auth_headers)
        assert r.json()["bio"] is None

    def test_bio_too_long_rejected(self, client, auth_headers):
        r = client.put("/api/v1/auth/me/profile", json={"bio": "x" * 501}, headers=auth_headers)
        assert r.status_code == 422

    def test_blank_name_rejected(self, client, auth_headers):
        r = client.put("/api/v1/auth/me/profile", json={"full_name": "   "}, headers=auth_headers)
        assert r.status_code == 422


class TestAvatarUpload:
    def test_upload_avatar(self, client, auth_headers, tmp_path, monkeypatch):
        monkeypatch.setattr(
            type(get_settings()), "uploads_dir", property(lambda self: tmp_path)
        )
        r = client.post(
            "/api/v1/auth/me/avatar",
            files={"file": ("me.png", io.BytesIO(PNG_BYTES), "image/png")},
            headers=auth_headers,
        )
        assert r.status_code == 200
        url = r.json()["avatar_url"]
        assert url.startswith("/static/avatars/")
        assert (tmp_path / "avatars" / url.rsplit("/", 1)[-1]).exists()

    def test_non_image_rejected(self, client, auth_headers):
        r = client.post(
            "/api/v1/auth/me/avatar",
            files={"file": ("evil.pdf", io.BytesIO(b"%PDF-"), "application/pdf")},
            headers=auth_headers,
        )
        assert r.status_code == 422


class _FakeResponse:
    def __init__(self, status_code, payload):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        return self._payload


GOOGLE_CLAIMS = {
    "aud": "test-client-id.apps.googleusercontent.com",
    "sub": "google-sub-123",
    "email": "googler@gmail.com",
    "email_verified": "true",
    "name": "Google User",
    "picture": "https://lh3.googleusercontent.com/photo.jpg",
}


@pytest.fixture
def google_configured(monkeypatch):
    monkeypatch.setattr(
        type(get_settings()),
        "google_client_ids",
        property(lambda self: ["test-client-id.apps.googleusercontent.com"]),
    )


class TestGoogleLogin:
    def test_not_configured_returns_503(self, client, monkeypatch):
        # Force-unset even if the developer's .env has real client IDs
        monkeypatch.setattr(
            type(get_settings()), "google_client_ids", property(lambda self: [])
        )
        r = client.post("/api/v1/auth/google", json={"id_token": "x"})
        assert r.status_code == 503

    def test_creates_account_and_logs_in(self, client, google_configured, monkeypatch):
        monkeypatch.setattr(
            auth_module.httpx, "get", lambda *a, **k: _FakeResponse(200, GOOGLE_CLAIMS)
        )
        r = client.post("/api/v1/auth/google", json={"id_token": "good-token"})
        assert r.status_code == 200
        body = r.json()
        assert body["access_token"]
        assert body["user"]["email"] == "googler@gmail.com"
        assert body["user"]["full_name"] == "Google User"
        assert body["user"]["avatar_url"] == GOOGLE_CLAIMS["picture"]

        # Second login reuses the same account
        r2 = client.post("/api/v1/auth/google", json={"id_token": "good-token"})
        assert r2.json()["user"]["id"] == body["user"]["id"]

    def test_links_existing_email_account(self, client, google_configured, monkeypatch, test_user):
        claims = {**GOOGLE_CLAIMS, "email": test_user.email}
        monkeypatch.setattr(
            auth_module.httpx, "get", lambda *a, **k: _FakeResponse(200, claims)
        )
        r = client.post("/api/v1/auth/google", json={"id_token": "good-token"})
        assert r.status_code == 200
        assert r.json()["user"]["id"] == str(test_user.id)

    def test_wrong_audience_rejected(self, client, google_configured, monkeypatch):
        claims = {**GOOGLE_CLAIMS, "aud": "someone-elses-app"}
        monkeypatch.setattr(
            auth_module.httpx, "get", lambda *a, **k: _FakeResponse(200, claims)
        )
        r = client.post("/api/v1/auth/google", json={"id_token": "stolen-token"})
        assert r.status_code == 401

    def test_invalid_token_rejected(self, client, google_configured, monkeypatch):
        monkeypatch.setattr(
            auth_module.httpx, "get", lambda *a, **k: _FakeResponse(400, {"error": "invalid_token"})
        )
        r = client.post("/api/v1/auth/google", json={"id_token": "garbage"})
        assert r.status_code == 401


@pytest.fixture
def web_flow_configured(google_configured, monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "GOOGLE_OAUTH_CLIENT_SECRET", "shh-secret")
    monkeypatch.setattr(settings, "PUBLIC_BASE_URL", "https://tunnel.example.com")


RETURN_URL = "exp://192.168.50.103:8081/--/google-auth"


class TestGoogleWebFlow:
    def test_start_redirects_to_google(self, client, web_flow_configured):
        r = client.get(
            "/api/v1/auth/google/start",
            params={"return_url": RETURN_URL},
            follow_redirects=False,
        )
        assert r.status_code == 302
        loc = r.headers["location"]
        assert loc.startswith("https://accounts.google.com/o/oauth2/v2/auth?")
        assert "tunnel.example.com" in loc
        assert "state=" in loc

    def test_start_rejects_foreign_return_url(self, client, web_flow_configured):
        r = client.get(
            "/api/v1/auth/google/start",
            params={"return_url": "https://evil.example.com/phish"},
            follow_redirects=False,
        )
        assert r.status_code == 422

    def test_start_unconfigured_returns_503(self, client, google_configured, monkeypatch):
        # Force-unset even if the developer's .env has real values
        monkeypatch.setattr(get_settings(), "GOOGLE_OAUTH_CLIENT_SECRET", "")
        monkeypatch.setattr(get_settings(), "PUBLIC_BASE_URL", "")
        r = client.get(
            "/api/v1/auth/google/start",
            params={"return_url": RETURN_URL},
            follow_redirects=False,
        )
        assert r.status_code == 503

    def _start_state(self, client):
        r = client.get(
            "/api/v1/auth/google/start",
            params={"return_url": RETURN_URL},
            follow_redirects=False,
        )
        from urllib.parse import parse_qs, urlparse
        return parse_qs(urlparse(r.headers["location"]).query)["state"][0]

    def test_callback_signs_in_and_deep_links(self, client, web_flow_configured, monkeypatch):
        state = self._start_state(client)
        monkeypatch.setattr(
            auth_module.httpx, "post", lambda *a, **k: _FakeResponse(200, {"id_token": "fake"})
        )
        monkeypatch.setattr(
            auth_module.httpx, "get", lambda *a, **k: _FakeResponse(200, GOOGLE_CLAIMS)
        )
        r = client.get(
            "/api/v1/auth/google/callback",
            params={"state": state, "code": "auth-code"},
            follow_redirects=False,
        )
        assert r.status_code in (302, 307)
        loc = r.headers["location"]
        assert loc.startswith(f"{RETURN_URL}?token=")

    def test_callback_user_cancelled(self, client, web_flow_configured):
        state = self._start_state(client)
        r = client.get(
            "/api/v1/auth/google/callback",
            params={"state": state, "error": "access_denied"},
            follow_redirects=False,
        )
        assert r.headers["location"] == f"{RETURN_URL}?error=access_denied"

    def test_callback_bad_state_rejected(self, client, web_flow_configured):
        r = client.get(
            "/api/v1/auth/google/callback",
            params={"state": "forged", "code": "auth-code"},
            follow_redirects=False,
        )
        assert r.status_code == 400
