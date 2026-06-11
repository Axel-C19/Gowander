"""
Regression: GenerateItineraryRequest.date was declared as `Optional[date]`
where the field name `date` shadowed the type, so Pydantic resolved the type
as None and any request carrying a travel date failed with 422
("Input should be None"). Fixed by qualifying the type as `dt.date`.
"""

import datetime as dt

from app.schemas.itinerary import GenerateItineraryRequest


def test_date_field_accepts_iso_date():
    req = GenerateItineraryRequest(
        swipe_session_id="11111111-1111-1111-1111-111111111111",
        destination_id="22222222-2222-2222-2222-222222222222",
        date="2026-06-15",
    )
    assert req.date == dt.date(2026, 6, 15)


def test_date_field_still_optional():
    req = GenerateItineraryRequest(
        swipe_session_id="11111111-1111-1111-1111-111111111111",
        destination_id="22222222-2222-2222-2222-222222222222",
    )
    assert req.date is None
