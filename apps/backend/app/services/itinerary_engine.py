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
from datetime import date, timedelta
from sqlalchemy.orm import Session

from app.models.itinerary import Itinerary, ItineraryStop, ItineraryLeg
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


# A sightseeing day runs from start_time until this hour (packing budget)
_DAY_END_MINUTES = 20 * 60   # 20:00


def _load_accepted_places(db: Session, user_id: uuid.UUID, swipe_session_id: uuid.UUID) -> list[Place]:
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
    place_ids = [row[0] for row in accepted_ids]
    return db.query(Place).filter(Place.id.in_(place_ids)).all() if place_ids else []


def _pack_leg(
    places: list[Place],
    start_date: date,
    end_date: date,
    day_offset: int,
    order_offset: int,
    day_start_min: int,
) -> tuple[list[dict], int]:
    """Pack one leg's places into its date range, spreading them evenly
    across the available days: a 6-place, 3-day leg becomes ~2 places per
    day instead of everything crammed into day 1. Day numbers continue
    across legs via day_offset so the whole trip reads Day 1..N."""
    num_days = (end_date - start_date).days + 1
    remaining = _nearest_neighbour_sort(places)

    stops_data: list[dict] = []
    order_counter = order_offset
    total_duration = 0

    for day_index in range(num_days):
        if not remaining:
            break
        current_date = start_date + timedelta(days=day_index)
        day_name = current_date.strftime("%A").lower()
        is_last_day = day_index == num_days - 1

        # Balanced quota: split what's left over the days that remain.
        # ceil() so early days take the larger share when it doesn't divide
        # evenly (5 places / 3 days → 2, 2, 1).
        days_left = num_days - day_index
        day_quota = -(-len(remaining) // days_left)   # ceil division

        cursor_min = day_start_min
        placed_today = 0
        carry: list[Place] = []
        prev_place: Place | None = None

        for place in remaining:
            # Quota met → save the rest for the following days
            if placed_today >= day_quota and not is_last_day:
                carry.append(place)
                continue

            # Closed this weekday → try another day (unless it's the last one)
            if not _is_open_on_day(place, day_name, cursor_min // 60) and not is_last_day:
                carry.append(place)
                continue

            travel = _travel_minutes(prev_place, place) if prev_place else 0
            arrival = cursor_min + travel
            departure = arrival + place.estimated_duration_minutes

            # Day budget exhausted → defer to the next day (last day takes overflow)
            if departure > _DAY_END_MINUTES and prev_place is not None and not is_last_day:
                carry.append(place)
                continue

            if prev_place is not None and stops_data:
                stops_data[-1]["travel_time_to_next_minutes"] = travel
                stops_data[-1]["travel_distance_meters"] = _haversine_distance_meters(
                    prev_place.latitude, prev_place.longitude,
                    place.latitude, place.longitude,
                )

            stops_data.append({
                "place": place,
                "order": order_counter,
                "day": day_offset + day_index + 1,
                "arrival_time": _minutes_to_hhmm(arrival),
                "departure_time": _minutes_to_hhmm(departure),
                "travel_time_to_next_minutes": 0,
                "travel_mode": "walking",
                "travel_distance_meters": 0,
            })
            order_counter += 1
            placed_today += 1
            total_duration += departure - arrival + travel
            cursor_min = departure
            prev_place = place

        remaining = carry

    return stops_data, total_duration


def generate_multi_itinerary(
    db: Session,
    user_id: uuid.UUID,
    legs: list[dict],
    start_time_str: str = "09:00",
) -> Itinerary:
    """
    Build one itinerary spanning one or more destination legs.
    Each leg: {swipe_session_id, destination_id, start_date, end_date}.
    Legs must be in chronological order; day numbers run across the whole trip.
    """
    if not legs:
        raise ValueError("At least one destination is required")

    start_h, start_m = map(int, start_time_str.split(":"))
    day_start_min = start_h * 60 + start_m

    # ── Validate dates and ordering ────────────────────────────────────────
    normalized = []
    prev_end: date | None = None
    for leg in legs:
        leg_start = leg["start_date"] or date.today()
        leg_end = leg["end_date"] or leg_start
        if leg_end < leg_start:
            raise ValueError("End date must be on or after start date")
        if prev_end and leg_start < prev_end:
            raise ValueError("Each destination must start on or after the previous one ends")
        normalized.append({**leg, "start_date": leg_start, "end_date": leg_end})
        prev_end = leg_end

    trip_start = normalized[0]["start_date"]
    trip_end = normalized[-1]["end_date"]

    # ── Pack each leg; days are anchored to real calendar offsets ─────────
    all_stops: list[dict] = []
    total_duration = 0
    any_places = False

    for leg in normalized:
        places = _load_accepted_places(db, user_id, leg["swipe_session_id"])
        if not places:
            continue
        any_places = True
        day_offset = (leg["start_date"] - trip_start).days
        stops, duration = _pack_leg(
            places, leg["start_date"], leg["end_date"],
            day_offset, len(all_stops), day_start_min,
        )
        all_stops.extend(stops)
        total_duration += duration

    if not any_places:
        raise ValueError("No accepted places in this session")

    # ── Title: all cities + trip date range ───────────────────────────────
    cities = []
    for leg in normalized:
        destination = db.get(Destination, leg["destination_id"])
        if destination and destination.city not in cities:
            cities.append(destination.city)
    city_part = " + ".join(cities[:3]) + (f" +{len(cities) - 3}" if len(cities) > 3 else "")
    if trip_start == trip_end:
        title = f"{city_part} — {trip_start.strftime('%b %d')}"
    else:
        title = f"{city_part} — {trip_start.strftime('%b %d')}–{trip_end.strftime('%b %d')}"

    # ── Persist ────────────────────────────────────────────────────────────
    itinerary = Itinerary(
        user_id=user_id,
        destination_id=normalized[0]["destination_id"],
        swipe_session_id=normalized[0]["swipe_session_id"],
        title=title,
        date=trip_start,
        end_date=trip_end,
        start_time=start_time_str,
        total_duration_minutes=total_duration,
    )
    db.add(itinerary)
    db.flush()   # Get itinerary.id before creating stops

    # Persist legs so saved trips know their city boundaries (transfers
    # between consecutive legs are chosen by the user afterwards)
    for position, leg in enumerate(normalized):
        db.add(ItineraryLeg(
            itinerary_id=itinerary.id,
            destination_id=leg["destination_id"],
            position=position,
            start_date=leg["start_date"],
            end_date=leg["end_date"],
        ))

    for s in all_stops:
        db.add(ItineraryStop(
            itinerary_id=itinerary.id,
            place_id=s["place"].id,
            order=s["order"],
            day=s["day"],
            arrival_time=s["arrival_time"],
            departure_time=s["departure_time"],
            travel_time_to_next_minutes=s["travel_time_to_next_minutes"],
            travel_mode=s["travel_mode"],
            travel_distance_meters=s["travel_distance_meters"],
        ))

    db.commit()
    db.refresh(itinerary)
    return itinerary


def generate_itinerary(
    db: Session,
    user_id: uuid.UUID,
    swipe_session_id: uuid.UUID,
    destination_id: uuid.UUID,
    start_date: date | None,
    end_date: date | None = None,
    start_time_str: str = "09:00",
) -> Itinerary:
    """Single-destination entry point — one leg of the multi-leg engine."""
    return generate_multi_itinerary(
        db,
        user_id,
        legs=[{
            "swipe_session_id": swipe_session_id,
            "destination_id": destination_id,
            "start_date": start_date,
            "end_date": end_date,
        }],
        start_time_str=start_time_str,
    )
