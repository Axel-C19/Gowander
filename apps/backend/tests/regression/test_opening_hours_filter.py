"""
Regression — Defect GW-002: places with incomplete opening-hours data
(a weekday simply missing from the dict) were treated as CLOSED and silently
dropped from generated itineraries. Users saw only 3 of 5 accepted places.
Fix: a missing day means "no data → assume open"; only an explicit
`closed: true` filters a place out.
"""

from unittest.mock import MagicMock
from app.services.itinerary_engine import _is_open_on_day
from app.models.place import Place


def place_with_hours(hours):
    p = MagicMock(spec=Place)
    p.opening_hours = hours
    return p


def test_missing_day_means_open():
    # Only monday defined — Wednesday must NOT be treated as closed
    p = place_with_hours({"monday": {"open": "09:00", "close": "18:00"}})
    assert _is_open_on_day(p, "wednesday", 9) is True


def test_explicit_closed_still_filters():
    p = place_with_hours({"monday": {"closed": True}})
    assert _is_open_on_day(p, "monday", 9) is False


def test_empty_hours_means_open():
    p = place_with_hours(None)
    assert _is_open_on_day(p, "sunday", 9) is True
