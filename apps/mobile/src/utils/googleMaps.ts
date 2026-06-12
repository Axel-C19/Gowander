import { Linking } from 'react-native';
import type { Itinerary, ItineraryStop } from '@gowander/shared-types';

const DIRECTIONS_URL = 'https://www.google.com/maps/dir/?api=1';

function coord(stop: ItineraryStop): string {
    return `${stop.place.latitude},${stop.place.longitude}`;
}

/**
 * Open the itinerary route in the Google Maps app (or browser fallback).
 * Google's directions URL allows at most 9 intermediate waypoints, so very
 * long routes are sampled evenly to fit.
 */
export function openRouteInGoogleMaps(itinerary: Itinerary): void {
    const stops = itinerary.stops;
    if (stops.length === 0) return;
    if (stops.length === 1) {
        const { latitude, longitude } = stops[0].place;
        Linking.openURL(
            `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
        );
        return;
    }

    const middle = stops.slice(1, -1);
    let waypoints = middle;
    if (middle.length > 9) {
        const step = middle.length / 9;
        waypoints = Array.from({ length: 9 }, (_, i) => middle[Math.floor(i * step)]);
    }

    const params = [
        `origin=${coord(stops[0])}`,
        `destination=${coord(stops[stops.length - 1])}`,
        waypoints.length
            ? `waypoints=${encodeURIComponent(waypoints.map(coord).join('|'))}`
            : '',
        'travelmode=walking',
    ].filter(Boolean);

    Linking.openURL(`${DIRECTIONS_URL}&${params.join('&')}`);
}
