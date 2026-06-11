"""Functional tests — R-03: the user can configure tourist preferences."""


class TestPreferences:
    def test_new_user_has_no_preferences(self, client, auth_headers):
        r = client.get("/api/v1/auth/me", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["preferences"] is None

    def test_update_preferences(self, client, auth_headers):
        r = client.put(
            "/api/v1/auth/me/preferences",
            json={"preferences": ["culture", "gastronomy", "nature"]},
            headers=auth_headers,
        )
        assert r.status_code == 200
        assert r.json()["preferences"] == ["culture", "gastronomy", "nature"]

        # Persisted — /me reflects it
        r = client.get("/api/v1/auth/me", headers=auth_headers)
        assert r.json()["preferences"] == ["culture", "gastronomy", "nature"]

    def test_preferences_can_be_changed_later(self, client, auth_headers):
        client.put(
            "/api/v1/auth/me/preferences",
            json={"preferences": ["art"]},
            headers=auth_headers,
        )
        r = client.put(
            "/api/v1/auth/me/preferences",
            json={"preferences": ["shopping", "nightlife"]},
            headers=auth_headers,
        )
        assert r.json()["preferences"] == ["shopping", "nightlife"]

    def test_empty_preferences_rejected(self, client, auth_headers):
        r = client.put(
            "/api/v1/auth/me/preferences",
            json={"preferences": []},
            headers=auth_headers,
        )
        assert r.status_code == 422

    def test_invalid_interest_rejected(self, client, auth_headers):
        r = client.put(
            "/api/v1/auth/me/preferences",
            json={"preferences": ["culture", "skydiving-on-mars"]},
            headers=auth_headers,
        )
        assert r.status_code == 422

    def test_requires_auth(self, client):
        r = client.put(
            "/api/v1/auth/me/preferences",
            json={"preferences": ["culture"]},
        )
        assert r.status_code in (401, 403)
