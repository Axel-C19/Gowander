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
import { COLORS, FONTS } from '../constants';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppStack() {
  // Onboarding gate: a user without saved preferences is asked once,
  // right after registering or on first login. Editable later via profile.
  const user = useAuthStore((s) => s.user);
  const needsOnboarding = !user?.preferences?.length;

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
        options={{ title: 'Travel interests' }}
      />
      <Stack.Screen
        name="Main"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TripDate"
        component={TripDateScreen}
        options={{ title: 'Travel date' }}
      />
      <Stack.Screen
        name="SwipeDeck"
        component={SwipeDeckScreen}
        options={{ title: 'Pick your spots' }}
      />
      <Stack.Screen
        name="ItinerarySummary"
        component={ItinerarySummaryScreen}
        options={{ title: 'Your itinerary' }}
      />
      <Stack.Screen
        name="MapView"
        component={MapViewScreen}
        options={{ title: 'Route map', headerTransparent: true }}
      />
    </Stack.Navigator>
  );
}
