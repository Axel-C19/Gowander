"""Functional tests — flight/ground search between cities + transfer selection."""

import pytest
from app.core.config import get_settings
from app.models.destination import Destination
from app.models.place import Place
from app.models.swipe_session import SwipeSession, SwipeAction


@pytest.fixture(autouse=True)
def no_serpapi(monkeypatch):
    """Tests always exercise the offline generator — never the live API,
    even when the developer's .env has a real SERPAPI_KEY."""
    monkeypatch.setattr(get_settings(), "SERPAPI_KEY", "")


def make_destination(db, city, country, lat, lon, code="XX"):
    dest = Destination(
        name=f"{city}, {country}", city=city, country=country,
        country_code=code, latitude=lat, longitude=lon,
    )
    db.add(dest)
    db.commit()
    db.refresh(dest)
    return dest


@pytest.fixture
def tokyo(db):
    return make_destination(db, "Tokyo", "Japan", 35.6762, 139.6503, "JP")


@pytest.fixture
def amsterdam(db):
    return make_destination(db, "Amsterdam", "Netherlands", 52.36, 4.90, "NL")


@pytest.fixture
def nearby_city(db):
    # ~80 km from the Paris fixture (48.8566, 2.3522)
    return make_destination(db, "Compiègne", "France", 49.41, 2.82, "FR")


def search(client, headers, frm, to, date="2026-07-01"):
    return client.get(
        "/api/v1/flights/search",
        params={
            "from_destination_id": str(frm.id),
            "to_destination_id": str(to.id),
            "travel_date": date,
        },
        headers=headers,
    )


class TestFlightSearch:
    def test_long_haul_recommends_flight(self, client, auth_headers, destination, tokyo):
        r = search(client, auth_headers, destination, tokyo)
        assert r.status_code == 200
        body = r.json()
        assert body["recommended_mode"] == "flight"
        assert body["distance_km"] > 5000
        assert body["ground"] == []          # Too far to drive
        assert len(body["flights"]) >= 4
        assert body["flights_source"] == "estimated"   # No SerpAPI key in tests
        first = body["flights"][0]
        assert first["airline"] and first["flight_number"]
        assert first["price"] > 0
        assert first["departure_time"] and first["arrival_time"]
        assert first["from_airport"] == "CDG" and first["to_airport"] == "HND"
        # Cheapest first
        prices = [f["price"] for f in body["flights"]]
        assert prices == sorted(prices)

    def test_mid_distance_offers_both(self, client, auth_headers, destination, amsterdam):
        r = search(client, auth_headers, destination, amsterdam)
        body = r.json()
        assert body["recommended_mode"] == "train"
        assert len(body["flights"]) >= 4
        assert {g["mode"] for g in body["ground"]} == {"train", "bus", "car"}
        assert all(g["price"] > 0 and g["duration_minutes"] > 0 for g in body["ground"])

    def test_short_hop_is_ground_only(self, client, auth_headers, destination, nearby_city):
        r = search(client, auth_headers, destination, nearby_city)
        body = r.json()
        assert body["recommended_mode"] == "car"
        assert body["flights"] == []
        assert len(body["ground"]) == 3

    def test_deterministic_results(self, client, auth_headers, destination, tokyo):
        a = search(client, auth_headers, destination, tokyo).json()
        b = search(client, auth_headers, destination, tokyo).json()
        assert a["flights"] == b["flights"]

    def test_same_destination_rejected(self, client, auth_headers, destination):
        r = search(client, auth_headers, destination, destination)
        assert r.status_code == 422

    def test_airlines_match_the_route(self, client, auth_headers, db):
        """Budapest→Tokyo must only show carriers that plausibly serve the
        route (endpoint airlines + global connectors) — regression for
        unrelated airlines like Aeroméxico appearing on this pair."""
        from app.services.flights import AIRLINES_BY_CITY, CONNECTOR_AIRLINES

        budapest = make_destination(db, "Budapest", "Hungary", 47.4979, 19.0402, "HU")
        tokyo2 = make_destination(db, "Tokyo", "Japan", 35.6762, 139.6503, "JP")
        body = search(client, auth_headers, budapest, tokyo2).json()

        allowed = {
            name
            for name, _, _ in (
                AIRLINES_BY_CITY["Budapest"]
                + AIRLINES_BY_CITY["Tokyo"]
                + CONNECTOR_AIRLINES
            )
        }
        airlines = {f["airline"] for f in body["flights"]}
        assert airlines <= allowed, f"Implausible airlines: {airlines - allowed}"
        assert "Aeroméxico" not in airlines

        # ~9000 km: low-cost short-haul carriers can't fly it nonstop
        assert "Wizz Air" not in airlines and "Ryanair" not in airlines
        # Connector airlines must route through their hub (1 stop)
        local = {n for n, _, _ in AIRLINES_BY_CITY["Budapest"] + AIRLINES_BY_CITY["Tokyo"]}
        for f in body["flights"]:
            if f["airline"] not in local:
                assert f["stops"] >= 1


@pytest.fixture
def amsterdam_session(db, test_user, amsterdam):
    place = Place(
        destination_id=amsterdam.id, name="Rijksmuseum", description="d",
        category="museum", latitude=52.36, longitude=4.885,
        estimated_duration_minutes=120, opening_hours={"always_open": True},
    )
    db.add(place)
    db.flush()
    session = SwipeSession(user_id=test_user.id, destination_id=amsterdam.id, completed=True)
    db.add(session)
    db.commit()
    db.refresh(session)
    db.add(SwipeAction(session_id=session.id, place_id=place.id, decision="accepted"))
    db.commit()
    return session


@pytest.fixture
def two_city_trip(client, auth_headers, completed_session, destination, amsterdam, amsterdam_session):
    r = client.post("/api/v1/itinerary/generate", json={
        "legs": [
            {
                "swipe_session_id": str(completed_session.id),
                "destination_id": str(destination.id),
                "start_date": "2026-07-01",
                "end_date": "2026-07-02",
            },
            {
                "swipe_session_id": str(amsterdam_session.id),
                "destination_id": str(amsterdam.id),
                "start_date": "2026-07-03",
                "end_date": "2026-07-04",
            },
        ],
    }, headers=auth_headers)
    assert r.status_code == 201
    return r.json()


class TestTransferSelection:
    def test_generate_returns_legs(self, two_city_trip):
        legs = two_city_trip["legs"]
        assert [leg["position"] for leg in legs] == [0, 1]
        assert legs[0]["destination"]["city"] == "Paris"
        assert legs[1]["destination"]["city"] == "Amsterdam"
        assert two_city_trip["transfers"] == []

    def test_select_flight_transfer(self, client, auth_headers, two_city_trip):
        r = client.put(
            f"/api/v1/itinerary/{two_city_trip['id']}/transfers",
            json={
                "position": 0,
                "mode": "flight",
                "airline": "KLM",
                "flight_number": "KL1234",
                "departure_time": "09:40",
                "arrival_time": "11:05",
                "duration_minutes": 85,
                "price": 123.0,
                "from_airport": "CDG",
                "to_airport": "AMS",
            },
            headers=auth_headers,
        )
        assert r.status_code == 200
        transfers = r.json()["transfers"]
        assert len(transfers) == 1
        t = transfers[0]
        assert t["mode"] == "flight"
        assert t["airline"] == "KLM"
        assert t["from_destination"]["city"] == "Paris"
        assert t["to_destination"]["city"] == "Amsterdam"
        assert t["travel_date"] == "2026-07-03"   # Day the next leg starts

    def test_reselect_replaces_choice(self, client, auth_headers, two_city_trip):
        url = f"/api/v1/itinerary/{two_city_trip['id']}/transfers"
        client.put(url, json={"position": 0, "mode": "flight", "airline": "KLM"}, headers=auth_headers)
        r = client.put(url, json={"position": 0, "mode": "train", "duration_minutes": 200, "price": 60}, headers=auth_headers)
        transfers = r.json()["transfers"]
        assert len(transfers) == 1
        assert transfers[0]["mode"] == "train"
        assert transfers[0]["airline"] is None

    def test_invalid_position_rejected(self, client, auth_headers, two_city_trip):
        r = client.put(
            f"/api/v1/itinerary/{two_city_trip['id']}/transfers",
            json={"position": 1, "mode": "flight"},   # Only boundary 0 exists
            headers=auth_headers,
        )
        assert r.status_code == 422
