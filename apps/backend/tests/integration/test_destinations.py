"""Functional tests — R-04: destination selection (list, search, places)."""


class TestListDestinations:
    def test_returns_destinations(self, client, auth_headers, destination):
        r = client.get("/api/v1/destinations", headers=auth_headers)
        assert r.status_code == 200
        cities = [d["city"] for d in r.json()]
        assert "Paris" in cities

    def test_requires_auth(self, client, destination):
        r = client.get("/api/v1/destinations")
        assert r.status_code in (401, 403)


class TestSearchDestinations:
    def test_search_by_city(self, client, auth_headers, destination):
        r = client.get("/api/v1/destinations/search?q=par", headers=auth_headers)
        assert r.status_code == 200
        assert any(d["city"] == "Paris" for d in r.json())

    def test_search_by_country(self, client, auth_headers, destination):
        r = client.get("/api/v1/destinations/search?q=france", headers=auth_headers)
        assert any(d["country"] == "France" for d in r.json())

    def test_search_no_match(self, client, auth_headers, destination):
        r = client.get("/api/v1/destinations/search?q=atlantis", headers=auth_headers)
        assert r.json() == []

    def test_empty_query_rejected(self, client, auth_headers):
        r = client.get("/api/v1/destinations/search?q=", headers=auth_headers)
        assert r.status_code == 422


class TestPlacesByDestination:
    def test_returns_paginated_places(self, client, auth_headers, destination, places):
        r = client.get(f"/api/v1/destinations/{destination.id}/places", headers=auth_headers)
        assert r.status_code == 200
        body = r.json()
        assert body["total"] == 5
        assert len(body["items"]) == 5
        assert body["has_next"] is False

    def test_pagination(self, client, auth_headers, destination, places):
        r = client.get(
            f"/api/v1/destinations/{destination.id}/places?page=1&per_page=2",
            headers=auth_headers,
        )
        body = r.json()
        assert len(body["items"]) == 2
        assert body["has_next"] is True

    def test_unknown_destination_404(self, client, auth_headers):
        r = client.get(
            "/api/v1/destinations/00000000-0000-0000-0000-000000000000/places",
            headers=auth_headers,
        )
        assert r.status_code == 404
