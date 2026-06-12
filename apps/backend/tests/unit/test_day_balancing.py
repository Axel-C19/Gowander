"""Structural tests — balanced day packing: itineraries stretch to fill the
trip's days instead of cramming everything into days 1-2 (and still contract
to fewer days on short trips)."""

from datetime import date
from unittest.mock import MagicMock
from collections import Counter

from app.services.itinerary_engine import _pack_leg
from app.models.place import Place


def make_places(n, duration=60):
    out = []
    for i in range(n):
        p = MagicMock(spec=Place)
        p.latitude = 48.85 + i * 0.002
        p.longitude = 2.30 + i * 0.002
        p.estimated_duration_minutes = duration
        p.opening_hours = {"always_open": True}
        p.id = i
        out.append(p)
    return out


DAY_START = 9 * 60


def days_used(stops):
    return Counter(s["day"] for s in stops)


class TestStretch:
    def test_six_places_three_days_spread_two_per_day(self):
        stops, _ = _pack_leg(make_places(6), date(2026, 6, 15), date(2026, 6, 17), 0, 0, DAY_START)
        assert days_used(stops) == {1: 2, 2: 2, 3: 2}

    def test_five_places_five_days_one_per_day(self):
        stops, _ = _pack_leg(make_places(5), date(2026, 6, 15), date(2026, 6, 19), 0, 0, DAY_START)
        assert days_used(stops) == {1: 1, 2: 1, 3: 1, 4: 1, 5: 1}

    def test_uneven_split_front_loads_remainder(self):
        # 5 places / 3 days → 2, 2, 1
        stops, _ = _pack_leg(make_places(5), date(2026, 6, 15), date(2026, 6, 17), 0, 0, DAY_START)
        assert days_used(stops) == {1: 2, 2: 2, 3: 1}

    def test_no_place_is_ever_dropped(self):
        stops, _ = _pack_leg(make_places(7), date(2026, 6, 15), date(2026, 6, 21), 0, 0, DAY_START)
        assert len(stops) == 7


class TestContract:
    def test_single_day_trip_takes_everything(self):
        stops, _ = _pack_leg(make_places(5), date(2026, 6, 15), date(2026, 6, 15), 0, 0, DAY_START)
        assert days_used(stops) == {1: 5}

    def test_more_days_than_places_uses_first_days(self):
        # 2 places / 5 days → one on day 1, one on day 2, rest of trip free
        stops, _ = _pack_leg(make_places(2), date(2026, 6, 15), date(2026, 6, 19), 0, 0, DAY_START)
        assert days_used(stops) == {1: 1, 2: 1}


class TestConstraintsStillHold:
    def test_time_budget_still_caps_long_visits(self):
        # 4 places of 6h each can't share one day even if the quota allows it
        stops, _ = _pack_leg(make_places(4, duration=360), date(2026, 6, 15), date(2026, 6, 18), 0, 0, DAY_START)
        assert max(days_used(stops).values()) <= 2

    def test_closed_day_still_defers(self):
        places = make_places(2)
        # Second place closed on Monday (trip starts Monday 2026-06-15)
        places[1].opening_hours = {"monday": {"closed": True}, "tuesday": {"open": "09:00", "close": "18:00"}}
        stops, _ = _pack_leg(places, date(2026, 6, 15), date(2026, 6, 16), 0, 0, DAY_START)
        closed_stop = next(s for s in stops if s["place"].id == 1)
        assert closed_stop["day"] == 2
