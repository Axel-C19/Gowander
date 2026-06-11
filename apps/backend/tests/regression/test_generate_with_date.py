"""
Regression: date fields on GenerateItineraryRequest were once declared with the
bare `date` type while a field was named "date" — the name shadowed the type and
Pydantic resolved it as None, so any request carrying a travel date failed with
422 ("Input should be None"). Fixed by qualifying types as `dt.date`.
Now also covers the start_date/end_date pair introduced for multi-day trips.
"""

import datetime as dt

from app.schemas.itinerary import GenerateItineraryRequest

IDS = {
    "swipe_session_id": "11111111-1111-1111-1111-111111111111",
    "destination_id": "22222222-2222-2222-2222-222222222222",
}


def test_date_fields_accept_iso_dates():
    req = GenerateItineraryRequest(**IDS, start_date="2026-06-15", end_date="2026-06-18")
    assert req.start_date == dt.date(2026, 6, 15)
    assert req.end_date == dt.date(2026, 6, 18)


def test_date_fields_still_optional():
    req = GenerateItineraryRequest(**IDS)
    assert req.start_date is None
    assert req.end_date is None
