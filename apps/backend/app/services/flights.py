"""
Flight + ground transport search between two trip destinations.

Real data comes from SerpAPI's Google Flights engine when SERPAPI_KEY is
configured. Without a key (local dev, demos, CI) a deterministic mock
generator produces realistic options — same inputs, same flights — so the
feature is fully usable offline.
"""

from __future__ import annotations

import math
import random
import datetime as dt

import httpx

from app.core.config import get_settings
from app.models.destination import Destination

SERPAPI_URL = "https://serpapi.com/search"

# IATA code + airport name for every seeded city
AIRPORTS: dict[str, tuple[str, str]] = {
    "Bangkok": ("BKK", "Suvarnabhumi"),
    "Paris": ("CDG", "Charles de Gaulle"),
    "London": ("LHR", "Heathrow"),
    "Dubai": ("DXB", "Dubai Intl"),
    "Singapore": ("SIN", "Changi"),
    "Kuala Lumpur": ("KUL", "Kuala Lumpur Intl"),
    "New York": ("JFK", "John F. Kennedy"),
    "Istanbul": ("IST", "Istanbul Airport"),
    "Tokyo": ("HND", "Haneda"),
    "Antalya": ("AYT", "Antalya"),
    "Seoul": ("ICN", "Incheon"),
    "Osaka": ("KIX", "Kansai"),
    "Makkah": ("JED", "King Abdulaziz (Jeddah)"),
    "Phuket": ("HKT", "Phuket Intl"),
    "Pattaya": ("UTP", "U-Tapao"),
    "Milan": ("MXP", "Malpensa"),
    "Barcelona": ("BCN", "El Prat"),
    "Hong Kong": ("HKG", "Hong Kong Intl"),
    "Palma de Mallorca": ("PMI", "Palma de Mallorca"),
    "Bali": ("DPS", "Ngurah Rai"),
    "Rome": ("FCO", "Fiumicino"),
    "Amsterdam": ("AMS", "Schiphol"),
    "Vienna": ("VIE", "Vienna Intl"),
    "Shanghai": ("PVG", "Pudong"),
    "Prague": ("PRG", "Václav Havel"),
    "Los Angeles": ("LAX", "Los Angeles Intl"),
    "Madrid": ("MAD", "Barajas"),
    "Munich": ("MUC", "Franz Josef Strauss"),
    "Berlin": ("BER", "Brandenburg"),
    "Cancún": ("CUN", "Cancún Intl"),
    "Mexico City": ("MEX", "Benito Juárez"),
    "Las Vegas": ("LAS", "Harry Reid"),
    "Miami": ("MIA", "Miami Intl"),
    "Orlando": ("MCO", "Orlando Intl"),
    "San Francisco": ("SFO", "San Francisco Intl"),
    "Lisbon": ("LIS", "Humberto Delgado"),
    "Venice": ("VCE", "Marco Polo"),
    "Florence": ("FLR", "Amerigo Vespucci"),
    "Athens": ("ATH", "Eleftherios Venizelos"),
    "Budapest": ("BUD", "Ferenc Liszt"),
    "Dublin": ("DUB", "Dublin Airport"),
    "Sydney": ("SYD", "Kingsford Smith"),
    "Rio de Janeiro": ("GIG", "Galeão"),
    "Buenos Aires": ("EZE", "Ezeiza"),
    "Cairo": ("CAI", "Cairo Intl"),
    "Marrakech": ("RAK", "Menara"),
    "Cape Town": ("CPT", "Cape Town Intl"),
    "Toronto": ("YYZ", "Pearson"),
    "Vancouver": ("YVR", "Vancouver Intl"),
    "Copenhagen": ("CPH", "Kastrup"),
}

# Carriers that realistically serve each city's airport. Short-haul/low-cost
# airlines carry a max range so they never appear on intercontinental routes.
# (name, IATA code, max route km — None = long-haul capable)
_Airline = tuple[str, str, int | None]

AIRLINES_BY_CITY: dict[str, list[_Airline]] = {
    "Bangkok": [("Thai Airways", "TG", None), ("Bangkok Airways", "PG", 3000)],
    "Paris": [("Air France", "AF", None), ("Transavia France", "TO", 3000)],
    "London": [("British Airways", "BA", None), ("Virgin Atlantic", "VS", None), ("easyJet", "U2", 3000)],
    "Dubai": [("Emirates", "EK", None), ("flydubai", "FZ", 4500)],
    "Singapore": [("Singapore Airlines", "SQ", None), ("Scoot", "TR", 6000)],
    "Kuala Lumpur": [("Malaysia Airlines", "MH", None), ("AirAsia", "AK", 4000)],
    "New York": [("Delta", "DL", None), ("United", "UA", None), ("American Airlines", "AA", None), ("JetBlue", "B6", 5000)],
    "Istanbul": [("Turkish Airlines", "TK", None), ("Pegasus", "PC", 3500)],
    "Tokyo": [("ANA", "NH", None), ("Japan Airlines", "JL", None)],
    "Antalya": [("Turkish Airlines", "TK", None), ("SunExpress", "XQ", 3500)],
    "Seoul": [("Korean Air", "KE", None), ("Asiana Airlines", "OZ", None)],
    "Osaka": [("ANA", "NH", None), ("Japan Airlines", "JL", None), ("Peach", "MM", 3000)],
    "Makkah": [("Saudia", "SV", None), ("flynas", "XY", 4000)],
    "Phuket": [("Thai Airways", "TG", None), ("Thai AirAsia", "FD", 3000)],
    "Pattaya": [("Bangkok Airways", "PG", 3000), ("Thai AirAsia", "FD", 3000)],
    "Milan": [("ITA Airways", "AZ", None), ("easyJet", "U2", 3000)],
    "Barcelona": [("Vueling", "VY", 3500), ("Iberia", "IB", None)],
    "Hong Kong": [("Cathay Pacific", "CX", None), ("HK Express", "UO", 3500)],
    "Palma de Mallorca": [("Vueling", "VY", 3500), ("Air Europa", "UX", None), ("Ryanair", "FR", 3000)],
    "Bali": [("Garuda Indonesia", "GA", None), ("Lion Air", "JT", 4000)],
    "Rome": [("ITA Airways", "AZ", None), ("Ryanair", "FR", 3000)],
    "Amsterdam": [("KLM", "KL", None), ("Transavia", "HV", 3000)],
    "Vienna": [("Austrian Airlines", "OS", None), ("Wizz Air", "W6", 3500)],
    "Shanghai": [("China Eastern", "MU", None), ("Air China", "CA", None)],
    "Prague": [("Smartwings", "QS", 4000), ("Ryanair", "FR", 3000)],
    "Los Angeles": [("Delta", "DL", None), ("United", "UA", None), ("American Airlines", "AA", None), ("Alaska Airlines", "AS", 5000)],
    "Madrid": [("Iberia", "IB", None), ("Air Europa", "UX", None)],
    "Munich": [("Lufthansa", "LH", None)],
    "Berlin": [("Lufthansa", "LH", None), ("easyJet", "U2", 3000), ("Eurowings", "EW", 4000)],
    "Cancún": [("Aeroméxico", "AM", None), ("Volaris", "Y4", 5000), ("Viva Aerobus", "VB", 4000)],
    "Mexico City": [("Aeroméxico", "AM", None), ("Volaris", "Y4", 5000)],
    "Las Vegas": [("Southwest", "WN", 4500), ("American Airlines", "AA", None), ("Delta", "DL", None)],
    "Miami": [("American Airlines", "AA", None), ("Delta", "DL", None)],
    "Orlando": [("Southwest", "WN", 4500), ("JetBlue", "B6", 5000)],
    "San Francisco": [("United", "UA", None), ("Alaska Airlines", "AS", 5000)],
    "Lisbon": [("TAP Air Portugal", "TP", None)],
    "Venice": [("ITA Airways", "AZ", None), ("easyJet", "U2", 3000)],
    "Florence": [("ITA Airways", "AZ", None), ("Vueling", "VY", 3500)],
    "Athens": [("Aegean Airlines", "A3", 4000), ("Sky Express", "GQ", 2500)],
    "Budapest": [("Wizz Air", "W6", 3500), ("Ryanair", "FR", 3000)],
    "Dublin": [("Aer Lingus", "EI", None), ("Ryanair", "FR", 3000)],
    "Sydney": [("Qantas", "QF", None), ("Virgin Australia", "VA", 6000)],
    "Rio de Janeiro": [("LATAM", "LA", None), ("GOL", "G3", 5000)],
    "Buenos Aires": [("Aerolíneas Argentinas", "AR", None), ("LATAM", "LA", None)],
    "Cairo": [("EgyptAir", "MS", None)],
    "Marrakech": [("Royal Air Maroc", "AT", None), ("Ryanair", "FR", 3000)],
    "Cape Town": [("South African Airways", "SA", None), ("FlySafair", "FA", 3000)],
    "Toronto": [("Air Canada", "AC", None), ("WestJet", "WS", 6000)],
    "Vancouver": [("Air Canada", "AC", None), ("WestJet", "WS", 6000)],
    "Copenhagen": [("SAS", "SK", None), ("Norwegian", "DY", 4500)],
}

# Global hub carriers that connect almost any city pair with one stop
CONNECTOR_AIRLINES: list[_Airline] = [
    ("Turkish Airlines", "TK", None),
    ("Emirates", "EK", None),
    ("Qatar Airways", "QR", None),
    ("Lufthansa", "LH", None),
    ("KLM", "KL", None),
    ("Air France", "AF", None),
]

_LONG_HAUL_KM = 3500   # Beyond this, expect stops unless a flag carrier flies it


def _route_airlines(from_city: str, to_city: str, km: float) -> tuple[list[_Airline], set[str]]:
    """
    Carriers plausible for this route: airlines based at either endpoint
    whose range covers the distance, plus global connectors on long hauls.
    Returns (pool, local_names) — `local_names` may fly nonstop on long hauls.
    """
    local = [
        a for a in AIRLINES_BY_CITY.get(from_city, []) + AIRLINES_BY_CITY.get(to_city, [])
        if a[2] is None or a[2] >= km
    ]
    # Dedupe by code, preserving order
    seen: set[str] = set()
    local = [a for a in local if not (a[1] in seen or seen.add(a[1]))]
    local_names = {a[0] for a in local}

    pool = list(local)
    if km > _LONG_HAUL_KM or not pool:
        for c in CONNECTOR_AIRLINES:
            if c[1] not in seen:
                seen.add(c[1])
                pool.append(c)
    return pool, local_names

# Boundaries for the recommendation: under GROUND_ONLY_KM flying makes no
# sense; above FLIGHT_KM ground travel is impractical.
GROUND_ONLY_KM = 150
FLIGHT_RECOMMENDED_KM = 500
GROUND_MAX_KM = 900   # No train/bus/car options beyond this


def distance_km(a: Destination, b: Destination) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(a.latitude), math.radians(b.latitude)
    dphi = math.radians(b.latitude - a.latitude)
    dlam = math.radians(b.longitude - a.longitude)
    h = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(h), math.sqrt(1 - h))


def _hhmm(minutes: int) -> str:
    return f"{(minutes // 60) % 24:02d}:{minutes % 60:02d}"


def _mock_flights(from_city: str, to_city: str, km: float, travel_date: dt.date) -> list[dict]:
    """Deterministic, realistic flight options (same inputs → same flights).
    Airlines are limited to carriers that plausibly serve the route."""
    from_iata = AIRPORTS.get(from_city, ("???", ""))[0]
    to_iata = AIRPORTS.get(to_city, ("???", ""))[0]
    rng = random.Random(f"{from_iata}-{to_iata}-{travel_date.isoformat()}")

    pool, local_names = _route_airlines(from_city, to_city, km)

    count = rng.randint(4, 7)
    base_duration = int(km / 13.3) + 45            # ~800 km/h + taxi/climb time
    base_price = 50 + km * 0.085

    # Departures spread across the day, earliest first
    departures = sorted(rng.sample(range(6 * 60, 21 * 60 + 30, 15), count))

    flights = []
    for dep in departures:
        airline, code, _max_km = rng.choice(pool)
        if km <= _LONG_HAUL_KM:
            stops = 0
        elif airline in local_names:
            # Endpoint flag carriers may fly the route nonstop
            stops = rng.choice([0, 0, 1])
        else:
            # Connector carriers route through their hub
            stops = 1
        duration = base_duration + rng.randint(-10, 25) + (stops * rng.randint(70, 140))
        # Early-morning and late-evening flights run cheaper
        peak = 1.0 + 0.25 * math.sin(math.pi * (dep - 6 * 60) / (15.5 * 60))
        price = round(base_price * peak * rng.uniform(0.75, 1.25))
        flights.append({
            "airline": airline,
            "flight_number": f"{code}{rng.randint(100, 1999)}",
            "departure_time": _hhmm(dep),
            "arrival_time": _hhmm(dep + duration),
            "duration_minutes": duration,
            "price": float(price),
            "stops": stops,
            "from_airport": from_iata,
            "to_airport": to_iata,
        })
    flights.sort(key=lambda f: f["price"])
    return flights


def _serpapi_flights(from_city: str, to_city: str, travel_date: dt.date, api_key: str) -> list[dict] | None:
    """Live Google Flights results via SerpAPI. Returns None on any failure."""
    from_airport = AIRPORTS.get(from_city)
    to_airport = AIRPORTS.get(to_city)
    if not from_airport or not to_airport:
        return None
    try:
        resp = httpx.get(
            SERPAPI_URL,
            params={
                "engine": "google_flights",
                "departure_id": from_airport[0],
                "arrival_id": to_airport[0],
                "outbound_date": travel_date.isoformat(),
                "type": "2",            # one-way
                "currency": "USD",
                "api_key": api_key,
            },
            timeout=20,
        )
        if resp.status_code != 200:
            return None
        data = resp.json()
        raw = (data.get("best_flights") or []) + (data.get("other_flights") or [])
        flights = []
        seen: set[tuple] = set()
        for option in raw:
            segments = option.get("flights") or []
            if not segments:
                continue
            first, last = segments[0], segments[-1]
            dep = (first.get("departure_airport") or {}).get("time", "")
            arr = (last.get("arrival_airport") or {}).get("time", "")
            flight = {
                "airline": first.get("airline", "—"),
                "flight_number": first.get("flight_number", "").replace(" ", ""),
                "departure_time": dep.split(" ")[-1][:5] if dep else None,
                "arrival_time": arr.split(" ")[-1][:5] if arr else None,
                "duration_minutes": option.get("total_duration"),
                "price": float(option["price"]) if option.get("price") else None,
                "stops": max(len(segments) - 1, 0),
                "from_airport": from_airport[0],
                "to_airport": to_airport[0],
            }
            # The same itinerary can appear in both best_flights and
            # other_flights — keep one copy of each
            key = (
                flight["flight_number"], flight["departure_time"],
                flight["arrival_time"], flight["price"], flight["stops"],
            )
            if key in seen:
                continue
            seen.add(key)
            flights.append(flight)
        flights.sort(key=lambda f: f["price"] if f["price"] is not None else float("inf"))
        return flights[:10] or None
    except (httpx.HTTPError, KeyError, ValueError, TypeError):
        return None


def _ground_options(km: float) -> list[dict]:
    """Train/bus/car estimates; empty when the hop is too long to drive."""
    if km > GROUND_MAX_KM:
        return []
    return [
        {
            "mode": "train",
            "duration_minutes": int(km / 110 * 60) + 30,
            "price": round(15 + km * 0.10),
        },
        {
            "mode": "bus",
            "duration_minutes": int(km / 70 * 60) + 40,
            "price": round(8 + km * 0.05),
        },
        {
            "mode": "car",
            "duration_minutes": int(km / 85 * 60) + 20,
            "price": round(km * 0.13),
        },
    ]


def search_transfer_options(
    from_dest: Destination,
    to_dest: Destination,
    travel_date: dt.date,
) -> dict:
    """All ways to get from one trip city to the next, plus a recommendation."""
    km = distance_km(from_dest, to_dest)

    recommended = (
        "flight" if km > FLIGHT_RECOMMENDED_KM
        else "car" if km < GROUND_ONLY_KM
        else "train"
    )

    flights: list[dict] = []
    flights_source = "none"
    if km >= GROUND_ONLY_KM:
        api_key = get_settings().SERPAPI_KEY
        if api_key:
            live = _serpapi_flights(from_dest.city, to_dest.city, travel_date, api_key)
            if live:
                flights, flights_source = live, "google_flights"
        if not flights:
            flights = _mock_flights(from_dest.city, to_dest.city, km, travel_date)
            flights_source = "estimated"

    from_airport = AIRPORTS.get(from_dest.city)
    to_airport = AIRPORTS.get(to_dest.city)

    return {
        "distance_km": round(km, 1),
        "recommended_mode": recommended,
        "from_airport": from_airport[0] if from_airport else None,
        "to_airport": to_airport[0] if to_airport else None,
        "flights_source": flights_source,
        "flights": flights,
        "ground": _ground_options(km),
    }
