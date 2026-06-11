"""Unit tests for the itinerary optimization engine."""

import math
import pytest
from unittest.mock import MagicMock, patch
from app.services.itinerary_engine import (
    _haversine_distance_meters,
    _nearest_neighbour_sort,
    _travel_minutes,
    _is_open_on_day,
    _minutes_to_hhmm,
)
from app.models.place import Place


def make_place(lat: float, lon: float, duration: int = 60, hours: dict = None) -> Place:
    p = MagicMock(spec=Place)
    p.latitude = lat
    p.longitude = lon
    p.estimated_duration_minutes = duration
    p.opening_hours = hours
    return p


class TestHaversine:
    def test_same_point_is_zero(self):
        assert _haversine_distance_meters(48.8, 2.3, 48.8, 2.3) == 0.0

    def test_paris_to_london_approx(self):
        # Paris (48.8566, 2.3522) → London (51.5074, -0.1278) ≈ 340 km
        dist = _haversine_distance_meters(48.8566, 2.3522, 51.5074, -0.1278)
        assert 330_000 < dist < 350_000

    def test_symmetry(self):
        d1 = _haversine_distance_meters(48.0, 2.0, 49.0, 3.0)
        d2 = _haversine_distance_meters(49.0, 3.0, 48.0, 2.0)
        assert math.isclose(d1, d2, rel_tol=1e-9)


class TestNearestNeighbour:
    def test_single_place_returned_as_is(self):
        p = make_place(0, 0)
        assert _nearest_neighbour_sort([p]) == [p]

    def test_orders_by_proximity(self):
        # A at origin, B close to A, C far away
        a = make_place(0.0, 0.0)
        b = make_place(0.01, 0.01)   # ~1.5 km from A
        c = make_place(10.0, 10.0)   # ~1500 km from A
        result = _nearest_neighbour_sort([a, c, b])
        assert result[0] is a
        assert result[1] is b
        assert result[2] is c


class TestIsOpenOnDay:
    def test_no_hours_always_open(self):
        p = make_place(0, 0, hours=None)
        assert _is_open_on_day(p, "monday", 9) is True

    def test_always_open_flag(self):
        p = make_place(0, 0, hours={"always_open": True})
        assert _is_open_on_day(p, "sunday", 9) is True

    def test_closed_on_day(self):
        p = make_place(0, 0, hours={"monday": {"closed": True}})
        assert _is_open_on_day(p, "monday", 9) is False

    def test_open_within_window(self):
        p = make_place(0, 0, hours={"tuesday": {"open": "09:00", "close": "18:00"}})
        assert _is_open_on_day(p, "tuesday", 9) is True

    def test_opens_too_late(self):
        p = make_place(0, 0, hours={"tuesday": {"open": "14:00", "close": "22:00"}})
        assert _is_open_on_day(p, "tuesday", 9) is False


class TestMinutesToHhmm:
    def test_zero(self):
        assert _minutes_to_hhmm(0) == "00:00"

    def test_nine_thirty(self):
        assert _minutes_to_hhmm(9 * 60 + 30) == "09:30"

    def test_midnight_wrap(self):
        assert _minutes_to_hhmm(24 * 60) == "00:00"
