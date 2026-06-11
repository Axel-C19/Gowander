import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../types/navigation';
import { MainTabs } from './MainTabs';
import { TripDateScreen } from '../screens/destination/TripDateScreen';
import { PreferencesScreen } from '../screens/profile/PreferencesScreen';
import { useAuthStore } from '../store/slices/auth.slice';
import { SwipeDeckScreen } from '../screens/swipe/SwipeDeckScreen';
import { ItinerarySummaryScreen } from '../screens/itinerary/ItinerarySummaryScreen';
import { MapViewScreen } from '../screens/itinerary/MapViewScreen';
import { TripDetailScreen } from '../screens/itinerary/TripDetailScreen';
import { ChatScreen } from '../screens/social/ChatScreen';
import { ShareTripScreen } from '../screens/social/ShareTripScreen';
import { FONTS } from '../constants';
import { useThemeColors } from '../hooks/useTheme';
import { useT } from '../i18n';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppStack() {
  // Onboarding gate: a user without saved preferences is asked once,
  // right after registering or on first login. Editable later via profile.
  const user = useAuthStore((s) => s.user);
  const needsOnboarding = !user?.preferences?.length;
  const COLORS = useThemeColors();
  const t = useT();

  return (
    <Stack.Navigator
      initialRouteName={needsOnboarding ? 'Preferences' : 'Main'}
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.background },
        headerTintColor: COLORS.primary,
        headerTitleStyle: { fontFamily: FONTS.heavy, color: COLORS.text },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="Preferences"
        component={PreferencesScreen}
        options={{ title: t('titleInterests') }}
      />
      <Stack.Screen
        name="Main"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TripDate"
        component={TripDateScreen}
        options={{ title: t('titleTravelDate') }}
      />
      <Stack.Screen
        name="SwipeDeck"
        component={SwipeDeckScreen}
        options={{ title: t('titlePickSpots') }}
      />
      <Stack.Screen
        name="ItinerarySummary"
        component={ItinerarySummaryScreen}
        options={{ title: t('titleYourItinerary') }}
      />
      <Stack.Screen
        name="MapView"
        component={MapViewScreen}
        options={{ title: t('titleRouteMap'), headerTransparent: true }}
      />
      <Stack.Screen
        name="TripDetail"
        component={TripDetailScreen}
        options={{ title: 'Trip details' }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: t('titleChat') }}
      />
      <Stack.Screen
        name="ShareTrip"
        component={ShareTripScreen}
        options={{ title: t('titleShareTrip') }}
      />
    </Stack.Navigator>
  );
}
