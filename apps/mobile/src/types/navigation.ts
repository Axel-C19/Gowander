import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { Destination, Itinerary, UserPublic } from '@gowander/shared-types';

export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
};

export type MainTabsParamList = {
    MyTrips: undefined;
    Social: undefined;
    WhereTo: undefined;
    Explore: undefined;
    Profile: undefined;
};

export type AppStackParamList = {
    Preferences: undefined;
    Main: undefined; // Bottom tab navigator (MyTrips / WhereTo / Profile)
    TripDate: {
        destination: Destination;
    };
    SwipeDeck: undefined; // Legs come from the trip store
    ItinerarySummary: {
        legs: {
            swipeSessionId: string;
            destinationId: string;
            startDate: string;
            endDate: string;
        }[];
        destination: Destination; // First leg's destination (display)
        startDate: string;        // Trip start
        endDate: string;          // Trip end
    };
    MapView: {
        itinerary: Itinerary;
    };
    TripDetail: {
        itinerary: Itinerary;
    };
    Chat: {
        friend: UserPublic;
    };
    ShareTrip: {
        itineraryId: string;
        itineraryTitle: string;
    };
};

export type RootStackParamList = {
    Auth: undefined;
    App: undefined;
};

export type AuthScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList>;
export type AppScreenNavigationProp = NativeStackNavigationProp<AppStackParamList>;

export type TripDateRouteProp = RouteProp<AppStackParamList, 'TripDate'>;
export type SwipeDeckRouteProp = RouteProp<AppStackParamList, 'SwipeDeck'>;
export type ItinerarySummaryRouteProp = RouteProp<AppStackParamList, 'ItinerarySummary'>;
export type MapViewRouteProp = RouteProp<AppStackParamList, 'MapView'>;
export type TripDetailRouteProp = RouteProp<AppStackParamList, 'TripDetail'>;
export type ChatRouteProp = RouteProp<AppStackParamList, 'Chat'>;
export type ShareTripRouteProp = RouteProp<AppStackParamList, 'ShareTrip'>;