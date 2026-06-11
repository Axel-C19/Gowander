import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { MainTabsParamList } from '../types/navigation';
import { SavedItinerariesScreen } from '../screens/itinerary/SavedItinerariesScreen';
import { DestinationPickerScreen } from '../screens/destination/DestinationPickerScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { COLORS, FONTS } from '../constants';

const Tabs = createBottomTabNavigator<MainTabsParamList>();

export function MainTabs() {
  return (
    <Tabs.Navigator
      initialRouteName="WhereTo"
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.text,
        headerShadowVisible: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 2,
          borderTopColor: COLORS.border,
          height: 84,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontFamily: FONTS.heavy, fontSize: 11 },
        headerTitleStyle: { fontFamily: FONTS.heavy, color: COLORS.text },
      }}
    >
      <Tabs.Screen
        name="MyTrips"
        component={SavedItinerariesScreen}
        options={{
          title: 'My trips',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="WhereTo"
        component={DestinationPickerScreen}
        options={{
          title: 'Where to?',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="airplane" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs.Navigator>
  );
}
