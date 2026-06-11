import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { Destination, Itinerary } from '@gowander/shared-types';

export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
};

export type MainTabsParamList = {
    MyTrips: undefined;
    WhereTo: undefined;
    Profile: undefined;
};

export type AppStackParamList = {
    Preferences: undefined;
    Main: undefined; // Bottom tab navigator (MyTrips / WhereTo / Profile)
    TripDate: {
        destination: Destination;
    };
    SwipeDeck: {
        destination: Destination;
        date: string; // ISO "YYYY-MM-DD" travel date
    };
    ItinerarySummary: {
        swipeSessionId: string;
        destination: Destination;
        date: string;
    };
    MapView: {
        itinerary: Itinerary;
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