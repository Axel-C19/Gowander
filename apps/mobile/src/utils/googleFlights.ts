import { Linking } from 'react-native';

/**
 * Open Google Flights on the chosen route and date so the user can book
 * the flight they just selected. Airport codes give the most precise
 * results; city names are the fallback.
 */
export function openFlightInGoogleFlights(options: {
    fromAirport?: string | null;
    toAirport?: string | null;
    fromCity: string;
    toCity: string;
    date?: string | null; // ISO "YYYY-MM-DD"
}): void {
    const from = options.fromAirport ?? options.fromCity;
    const to = options.toAirport ?? options.toCity;
    const query = `one way flights from ${from} to ${to}${options.date ? ` on ${options.date}` : ''}`;
    Linking.openURL(`https://www.google.com/travel/flights?q=${encodeURIComponent(query)}`);
}
