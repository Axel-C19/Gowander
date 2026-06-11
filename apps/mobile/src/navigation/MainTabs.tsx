import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { MainTabsParamList } from '../types/navigation';
import { SavedItinerariesScreen } from '../screens/itinerary/SavedItinerariesScreen';
import { DestinationPickerScreen } from '../screens/destination/DestinationPickerScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { SocialScreen } from '../screens/social/SocialScreen';
import { ExploreScreen } from '../screens/explore/ExploreScreen';
import { FONTS } from '../constants';
import { useThemeColors } from '../hooks/useTheme';
import { useT } from '../i18n';

const Tabs = createBottomTabNavigator<MainTabsParamList>();

export function MainTabs() {
  const COLORS = useThemeColors();
  const t = useT();
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
          title: t('tabMyTrips'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Social"
        component={SocialScreen}
        options={{
          title: t('tabSocial'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="WhereTo"
        component={DestinationPickerScreen}
        options={{
          title: t('tabWhereTo'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="airplane" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          title: t('tabExplore'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: t('tabProfile'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs.Navigator>
  );
}
