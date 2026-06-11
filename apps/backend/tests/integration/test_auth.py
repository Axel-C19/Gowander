"""Integration tests for the auth endpoints."""

import pytest
from fastapi.testclient import TestClient


class TestLogin:
    def test_login_success(self, client: TestClient, test_user):
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "test@gowander.app", "password": "testpass123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "test@gowander.app"

    def test_login_wrong_password(self, client: TestClient, test_user):
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "test@gowander.app", "password": "wrongpass"},
        )
        assert response.status_code == 401

    def test_login_unknown_email(self, client: TestClient):
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "nobody@gowander.app", "password": "pass"},
        )
        assert response.status_code == 401


class TestGetMe:
    def test_me_authenticated(self, client: TestClient, auth_headers, test_user):
        response = client.get("/api/v1/auth/me", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["email"] == "test@gowander.app"

    def test_me_unauthenticated(self, client: TestClient):
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 403
