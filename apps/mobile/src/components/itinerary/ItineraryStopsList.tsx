import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FONTS, SPACING, FONT_SIZE, BORDER_RADIUS, CATEGORY_COLORS, cardStyle, type ThemeColors } from '../../constants';
import type { Itinerary } from '@gowander/shared-types';
import { formatTime, formatDuration, categoryLabel } from '@gowander/shared-utils';
import { useThemeColors } from '../../hooks/useTheme';

interface ItineraryStopsListProps {
    itinerary: Itinerary;
}

/**
 * Day-grouped timeline of itinerary stops. Shared between the
 * post-creation summary and the saved-trip detail screens so a trip
 * always reads the same way. Renders plain views — host screens
 * provide the ScrollView.
 */
export function ItineraryStopsList({ itinerary }: ItineraryStopsListProps) {
    const COLORS = useThemeColors();
    const styles = React.useMemo(() => makeStyles(COLORS), [COLORS]);

    return (
        <>
            {itinerary.stops.map((stop, index) => (
                <View key={`${stop.place.id}-${index}`}>
                    {(index === 0 || stop.day !== itinerary.stops[index - 1].day) && (
                        <Text style={styles.dayHeader}>
                            Day {stop.day}
                            {itinerary.date
                                ? ` — ${new Date(
                                      new Date(itinerary.date + 'T00:00:00').getTime() +
                                          (stop.day - 1) * 86_400_000,
                                  ).toLocaleDateString(undefined, {
                                      weekday: 'long',
                                      month: 'short',
                                      day: 'numeric',
                                  })}`
                                : ''}
                        </Text>
                    )}
                    <View style={styles.stopCard}>
                        {/* Timeline dot */}
                        <View style={styles.timeline}>
                            <View style={styles.timelineDot} />
                            {index < itinerary.stops.length - 1 && (
                                <View style={styles.timelineLine} />
                            )}
                        </View>

                        {/* Stop content */}
                        <View style={styles.stopContent}>
                            <View style={styles.stopHeader}>
                                <Text style={styles.stopTime}>
                                    {stop.arrival_time ? formatTime(stop.arrival_time) : '--:--'}
                                </Text>
                                <View
                                    style={[
                                        styles.categoryBadge,
                                        { backgroundColor: (CATEGORY_COLORS[stop.place.category] ?? CATEGORY_COLORS.other).bg },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.categoryText,
                                            { color: (CATEGORY_COLORS[stop.place.category] ?? CATEGORY_COLORS.other).fg },
                                        ]}
                                    >
                                        {categoryLabel(stop.place.category)}
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.stopName}>{stop.place.name}</Text>
                            <Text style={styles.stopDescription} numberOfLines={2}>
                                {stop.place.description}
                            </Text>
                            <Text style={styles.stopDuration}>
                                ~{formatDuration(stop.place.estimated_duration_minutes)} visit
                            </Text>

                            {/* Travel to next */}
                            {stop.travel_time_to_next_minutes > 0 && (
                                <View style={styles.travelInfo}>
                                    <Text style={styles.travelText}>
                                        🚶 {stop.travel_time_to_next_minutes} min walk to next stop
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            ))}
        </>
    );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
    stopCard: {
        flexDirection: 'row',
        marginBottom: SPACING.md,
    },
    dayHeader: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.md,
        color: COLORS.primary,
        marginBottom: SPACING.sm,
        marginTop: SPACING.xs,
    },
    timeline: {
        width: 24,
        alignItems: 'center',
        marginRight: SPACING.sm,
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.primary,
        marginTop: 4,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: COLORS.border,
        marginTop: 4,
        marginBottom: -SPACING.md,
    },
    stopContent: {
        flex: 1,
        ...cardStyle(COLORS),
        padding: SPACING.md,
        gap: SPACING.xs,
    },
    stopHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    stopTime: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '700',
        color: COLORS.primary,
    },
    categoryBadge: {
        borderRadius: BORDER_RADIUS.full,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
    },
    categoryText: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.xs,
    },
    stopName: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.lg,
        color: COLORS.text,
    },
    stopDescription: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textMuted,
        lineHeight: 20,
    },
    stopDuration: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textMuted,
    },
    travelInfo: {
        marginTop: SPACING.xs,
        paddingTop: SPACING.xs,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    travelText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textMuted,
    },
});
