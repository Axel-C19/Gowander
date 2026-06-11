import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { ItinerarySummaryRouteProp, AppScreenNavigationProp } from '../../types/navigation';
import { useGenerateItinerary, useSaveItinerary } from '../../hooks/useItinerary';
import { useSwipeStore } from '../../store/slices/swipe.slice';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../constants';
import type { Itinerary } from '@gowander/shared-types';
import { formatTime, formatDuration, categoryLabel } from '@gowander/shared-utils';

export function ItinerarySummaryScreen() {
    const route = useRoute<ItinerarySummaryRouteProp>();
    const navigation = useNavigation<AppScreenNavigationProp>();
    const { destination, swipeSessionId, date } = route.params;

    const generateItinerary = useGenerateItinerary();
    const saveItinerary = useSaveItinerary();
    const resetSession = useSwipeStore((s) => s.resetSession);
    const [itinerary, setItinerary] = useState<Itinerary | null>(null);

    useEffect(() => {
        handleGenerate();
    }, []);

    async function handleGenerate() {
        try {
            const result = await generateItinerary.mutateAsync({
                swipe_session_id: swipeSessionId,
                destination_id: String(destination.id),
                date,
                start_time: '09:00',
            });
            setItinerary(result);
            resetSession(); // Clear swipe state after itinerary is generated
        } catch (err) {
            Alert.alert(
                'Could not generate itinerary',
                err instanceof Error ? err.message : 'Please try again.',
                [{ text: 'Go back', onPress: () => navigation.goBack() }],
            );
        }
    }

    async function handleSave() {
        if (!itinerary || itinerary.is_saved) return;
        try {
            const saved = await saveItinerary.mutateAsync(String(itinerary.id));
            setItinerary(saved);
        } catch (err) {
            Alert.alert(
                'Could not save itinerary',
                err instanceof Error ? err.message : 'Please try again.',
            );
        }
    }

    if (generateItinerary.isPending || !itinerary) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingTitle}>Building your itinerary</Text>
                <Text style={styles.loadingSubtitle}>
                    Optimizing route for {destination.city}...
                </Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>{itinerary.title}</Text>
                <Text style={styles.subtitle}>
                    {itinerary.stops.length} stops · {formatDuration(itinerary.total_duration_minutes)}
                </Text>
            </View>

            {/* Stops */}
            {itinerary.stops.map((stop, index) => (
                <View key={String(stop.place.id)} style={styles.stopCard}>
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
                            <View style={styles.categoryBadge}>
                                <Text style={styles.categoryText}>
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
            ))}

            {/* View on map button */}
            <TouchableOpacity
                style={styles.mapButton}
                onPress={() => navigation.navigate('MapView', { itinerary })}
                activeOpacity={0.8}
            >
                <Text style={styles.mapButtonText}>View on map</Text>
            </TouchableOpacity>

            {/* Save / plan another trip */}
            <View style={styles.actionsRow}>
                <TouchableOpacity
                    style={styles.startOverButton}
                    onPress={() => navigation.navigate('Main')}
                    activeOpacity={0.8}
                >
                    <Text style={styles.startOverText}>Plan another trip</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.saveButton, itinerary.is_saved && styles.savedButton]}
                    onPress={handleSave}
                    disabled={itinerary.is_saved || saveItinerary.isPending}
                    activeOpacity={0.8}
                >
                    <Text style={styles.saveButtonText}>
                        {itinerary.is_saved
                            ? 'Saved ✓'
                            : saveItinerary.isPending
                                ? 'Saving...'
                                : 'Save itinerary'}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        padding: SPACING.md,
        paddingBottom: SPACING.xxl,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.sm,
        padding: SPACING.xl,
        backgroundColor: COLORS.background,
    },
    loadingTitle: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '700',
        color: COLORS.text,
        textAlign: 'center',
    },
    loadingSubtitle: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    header: {
        marginBottom: SPACING.lg,
    },
    title: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: '700',
        color: COLORS.text,
    },
    subtitle: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textMuted,
        marginTop: SPACING.xs,
    },
    stopCard: {
        flexDirection: 'row',
        marginBottom: SPACING.md,
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
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
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
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.full,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
    },
    categoryText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.primary,
        fontWeight: '600',
    },
    stopName: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '600',
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
    mapButton: {
        height: 52,
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.lg,
    },
    mapButtonText: {
        color: COLORS.surface,
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
    },
    actionsRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginTop: SPACING.sm,
    },
    startOverButton: {
        flex: 1,
        height: 52,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    saveButton: {
        flex: 1,
        height: 52,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.swipeAccept,
    },
    savedButton: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: COLORS.surface,
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
    },
    startOverText: {
        color: COLORS.textMuted,
        fontSize: FONT_SIZE.md,
        fontWeight: '500',
    },
});