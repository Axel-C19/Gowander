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
import { useShareTrip } from '../../hooks/useShareTrip';
import { useSwipeStore } from '../../store/slices/swipe.slice';
import { FONTS, SPACING, FONT_SIZE, type ThemeColors } from '../../constants';
import { Button } from '../../components/ui/Button';
import { ItineraryStopsList } from '../../components/itinerary/ItineraryStopsList';
import type { Itinerary } from '@gowander/shared-types';
import { formatDuration } from '@gowander/shared-utils';
import { useThemeColors } from '../../hooks/useTheme';

export function ItinerarySummaryScreen() {
    const COLORS = useThemeColors();
    const styles = React.useMemo(() => makeStyles(COLORS), [COLORS]);

    const route = useRoute<ItinerarySummaryRouteProp>();
    const navigation = useNavigation<AppScreenNavigationProp>();
    const { destination, legs, startDate, endDate } = route.params;

    const generateItinerary = useGenerateItinerary();
    const saveItinerary = useSaveItinerary();
    const resetSession = useSwipeStore((s) => s.resetSession);
    const [itinerary, setItinerary] = useState<Itinerary | null>(null);
    const { shareTrip } = useShareTrip(setItinerary);

    useEffect(() => {
        handleGenerate();
    }, []);

    async function handleGenerate() {
        try {
            const result = await generateItinerary.mutateAsync({
                legs: legs.map((l) => ({
                    swipe_session_id: l.swipeSessionId,
                    destination_id: l.destinationId,
                    start_date: l.startDate,
                    end_date: l.endDate,
                })),
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

    function handleShare() {
        if (!itinerary) return;
        shareTrip(itinerary);
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

            {/* Stops, grouped by trip day */}
            <ItineraryStopsList itinerary={itinerary} />

            {/* View on map button */}
            <Button
                title="View on map"
                onPress={() => navigation.navigate('MapView', { itinerary })}
                style={{ marginTop: SPACING.lg }}
            />

            {/* Share */}
            <Button
                title={itinerary.is_public ? '🌍 Public on Explore — Share again' : 'Share trip'}
                variant="secondary"
                onPress={handleShare}
                style={{ marginTop: SPACING.sm }}
            />

            {/* Save / plan another trip */}
            <View style={styles.actionsRow}>
                <Button
                    title="Plan another"
                    variant="quiet"
                    onPress={() => navigation.navigate('Main')}
                    style={{ flex: 1 }}
                />
                <Button
                    title={itinerary.is_saved
                        ? 'Saved ✓'
                        : saveItinerary.isPending
                            ? 'Saving...'
                            : 'Save itinerary'}
                    variant="success"
                    onPress={handleSave}
                    disabled={itinerary.is_saved || saveItinerary.isPending}
                    style={{ flex: 1 }}
                />
            </View>
        </ScrollView>
    );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
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
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.xxl,
        color: COLORS.text,
    },
    subtitle: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textMuted,
        marginTop: SPACING.xs,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginTop: SPACING.sm,
    },
});