import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useRoute } from '@react-navigation/native';
import type { MapViewRouteProp } from '../../types/navigation';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../constants';
import { formatTime } from '@gowander/shared-utils';

export function MapViewScreen() {
  const route = useRoute<MapViewRouteProp>();
  const { itinerary } = route.params;
  const mapRef = useRef<MapView>(null);

  const coordinates = itinerary.stops.map((stop) => ({
    latitude: stop.place.latitude,
    longitude: stop.place.longitude,
  }));

  // Fit the whole route on screen once the map is laid out
  useEffect(() => {
    if (coordinates.length === 0) return;
    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: { top: 120, right: 60, bottom: 80, left: 60 },
        animated: true,
      });
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: coordinates[0]?.latitude ?? itinerary.destination.latitude,
          longitude: coordinates[0]?.longitude ?? itinerary.destination.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Route line connecting stops in visit order */}
        <Polyline
          coordinates={coordinates}
          strokeColor={COLORS.primary}
          strokeWidth={3}
          lineDashPattern={[8, 4]}
        />

        {/* Numbered marker per stop */}
        {itinerary.stops.map((stop, index) => (
          <Marker
            key={`${stop.place.id}-${index}`}
            coordinate={{
              latitude: stop.place.latitude,
              longitude: stop.place.longitude,
            }}
            title={`${index + 1}. ${stop.place.name}`}
            description={
              stop.arrival_time
                ? `Arrive ${formatTime(stop.arrival_time)} · ~${stop.place.estimated_duration_minutes} min`
                : undefined
            }
          >
            <View style={styles.markerBubble}>
              <Text style={styles.markerText}>{index + 1}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Route summary footer */}
      <View style={styles.footer}>
        <Text style={styles.footerTitle}>{itinerary.title}</Text>
        <Text style={styles.footerSubtitle}>
          {itinerary.stops.length} stops · start {itinerary.start_time ? formatTime(itinerary.start_time) : '--'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  markerBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  markerText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: FONT_SIZE.sm,
  },
  footer: {
    position: 'absolute',
    bottom: SPACING.xl,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  footerTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  footerSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
