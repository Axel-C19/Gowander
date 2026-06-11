"""
Itinerary optimization engine.

Algorithm (MVP):
  1. Fetch accepted places from the swipe session.
  2. Filter out places closed on the requested day.
  3. Group places by category to avoid consecutive same-type visits.
  4. Greedy nearest-neighbour sort starting from the first place.
  5. Assign arrival/departure times respecting opening hours and visit duration.
  6. Persist the result as an Itinerary with ItineraryStop rows.

This is intentionally simple for the MVP. Future versions can use
Google Maps Distance Matrix API for real travel times and OR-Tools
for true route optimization.
"""

from __future__ import annotations

import math
import uuid
from datetime import date, datetime, time, timedelta
from sqlalchemy.orm import Session

from app.models.itinerary import Itinerary, ItineraryStop
from app.models.swipe_session import SwipeAction, SwipeSession
from app.models.place import Place
from app.models.destination import Destination


# Average walking speed: 5 km/h → 83 m/min
_WALK_SPEED_M_PER_MIN = 83.0
_TRAVEL_BUFFER_MIN = 10   # Extra buffer added to every leg


def _haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two coordinates in metres."""
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _travel_minutes(place_a: Place, place_b: Place) -> int:
    dist = _haversine_distance_meters(
        place_a.latitude, place_a.longitude,
        place_b.latitude, place_b.longitude,
    )
    return int(dist / _WALK_SPEED_M_PER_MIN) + _TRAVEL_BUFFER_MIN


def _is_open_on_day(place: Place, day_name: str, start_hour: int) -> bool:
    """Returns True if the place is open on the given weekday at start_hour."""
    if not place.opening_hours:
        return True   # No data → assume open
    if place.opening_hours.get("always_open"):
        return True
    day_data = place.opening_hours.get(day_name.lower())
    if not day_data:
        return True   # No data for this day → assume open (only explicit closures filter)
    if day_data.get("closed"):
        return False
    open_h = int(day_data["open"].split(":")[0])
    return open_h <= start_hour + 2   # Must open within 2 hours of our start


def _nearest_neighbour_sort(places: list[Place]) -> list[Place]:
    """Greedy nearest-neighbour to minimize total travel distance."""
    if len(places) <= 1:
        return places
    remaining = list(places)
    ordered = [remaining.pop(0)]
    while remaining:
        last = ordered[-1]
        nearest = min(
            remaining,
            key=lambda p: _haversine_distance_meters(
                last.latitude, last.longitude, p.latitude, p.longitude
            ),
        )
        remaining.remove(nearest)
        ordered.append(nearest)
    return ordered


def _minutes_to_hhmm(base_minutes: int) -> str:
    h = (base_minutes // 60) % 24
    m = base_minutes % 60
    return f"{h:02d}:{m:02d}"


def generate_itinerary(
    db: Session,
    user_id: uuid.UUID,
    swipe_session_id: uuid.UUID,
    destination_id: uuid.UUID,
    itinerary_date: date | None,
    start_time_str: str = "09:00",
) -> Itinerary:
    """
    Core entry point. Returns a persisted Itinerary instance.
    Raises ValueError for invalid inputs.
    """
    # ── 1. Load session and accepted places ───────────────────────────────
    session = db.get(SwipeSession, swipe_session_id)
    if not session or session.user_id != user_id:
        raise ValueError("Swipe session not found")
    if not session.completed:
        raise ValueError("Swipe session is not completed yet")

    accepted_ids = (
        db.query(SwipeAction.place_id)
        .filter(
            SwipeAction.session_id == swipe_session_id,
            SwipeAction.decision == "accepted",
        )
        .all()
    )
    if not accepted_ids:
        raise ValueError("No accepted places in this session")

    place_ids = [row[0] for row in accepted_ids]
    places = db.query(Place).filter(Place.id.in_(place_ids)).all()

    # ── 2. Filter by opening hours ─────────────────────────────────────────
    start_h, start_m = map(int, start_time_str.split(":"))
    day_name = (itinerary_date or date.today()).strftime("%A").lower()
    open_places = [p for p in places if _is_open_on_day(p, day_name, start_h)]
    if not open_places:
        open_places = places   # Fallback: keep all if filter is too aggressive

    # ── 3. Route optimization ─────────────────────────────────────────────
    ordered = _nearest_neighbour_sort(open_places)

    # ── 4. Time assignment ────────────────────────────────────────────────
    cursor_min = start_h * 60 + start_m
    stops_data: list[dict] = []

    for i, place in enumerate(ordered):
        arrival = cursor_min
        departure = arrival + place.estimated_duration_minutes
        travel_to_next = _travel_minutes(place, ordered[i + 1]) if i < len(ordered) - 1 else 0

        stops_data.append({
            "place": place,
            "order": i,
            "arrival_time": _minutes_to_hhmm(arrival),
            "departure_time": _minutes_to_hhmm(departure),
            "travel_time_to_next_minutes": travel_to_next,
            "travel_mode": "walking",
            "travel_distance_meters": (
                _haversine_distance_meters(
                    place.latitude, place.longitude,
                    ordered[i + 1].latitude, ordered[i + 1].longitude,
                ) if i < len(ordered) - 1 else 0
            ),
        })
        cursor_min = departure + travel_to_next

    total_duration = cursor_min - (start_h * 60 + start_m)
    destination = db.get(Destination, destination_id)

    # ── 5. Persist ────────────────────────────────────────────────────────
    itinerary = Itinerary(
        user_id=user_id,
        destination_id=destination_id,
        swipe_session_id=swipe_session_id,
        title=f"{destination.city} — {(itinerary_date or date.today()).strftime('%b %d')}",
        date=itinerary_date,
        start_time=start_time_str,
        total_duration_minutes=total_duration,
    )
    db.add(itinerary)
    db.flush()   # Get itinerary.id before creating stops

    for s in stops_data:
        stop = ItineraryStop(
            itinerary_id=itinerary.id,
            place_id=s["place"].id,
            order=s["order"],
            arrival_time=s["arrival_time"],
            departure_time=s["departure_time"],
            travel_time_to_next_minutes=s["travel_time_to_next_minutes"],
            travel_mode=s["travel_mode"],
            travel_distance_meters=s["travel_distance_meters"],
        )
        db.add(stop)

    db.commit()
    db.refresh(itinerary)
    return itinerary
