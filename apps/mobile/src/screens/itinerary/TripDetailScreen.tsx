import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { TripDetailRouteProp, AppScreenNavigationProp } from '../../types/navigation';
import { useItinerary, useDeleteItinerary, useRateItinerary } from '../../hooks/useItinerary';
import { useShareTrip } from '../../hooks/useShareTrip';
import { useAuthStore } from '../../store/slices/auth.slice';
import { ItineraryStopsList } from '../../components/itinerary/ItineraryStopsList';
import { Button } from '../../components/ui/Button';
import { StarRating } from '../../components/ui/StarRating';
import { FONTS, SPACING, FONT_SIZE, BORDER_RADIUS, cardStyle, type ThemeColors } from '../../constants';
import { formatDuration } from '@gowander/shared-utils';
import { useThemeColors } from '../../hooks/useTheme';

export function TripDetailScreen() {
    const COLORS = useThemeColors();
    const styles = React.useMemo(() => makeStyles(COLORS), [COLORS]);

    const route = useRoute<TripDetailRouteProp>();
    const navigation = useNavigation<AppScreenNavigationProp>();

    // The query cache is refreshed by publish/unpublish mutations, so prefer
    // it over the (possibly stale) navigation param.
    const { data } = useItinerary(String(route.params.itinerary.id));
    const itinerary = data ?? route.params.itinerary;

    const deleteItinerary = useDeleteItinerary();
    const rateItinerary = useRateItinerary();
    const { shareTrip } = useShareTrip();

    const myId = useAuthStore((s) => s.user?.id);
    // Stale cached itineraries may predate user_id; assume owner then (legacy
    // entry points were all owner-only) until the refetch fills it in.
    const isOwner = !itinerary.user_id || String(itinerary.user_id) === String(myId);

    function handleRate(stars: number) {
        rateItinerary.mutate(
            { id: String(itinerary.id), stars },
            {
                onError: (err) =>
                    Alert.alert(
                        'Could not save rating',
                        err instanceof Error ? err.message : 'Please try again.',
                    ),
            },
        );
    }

    function handleDelete() {
        Alert.alert(
            'Delete trip?',
            `"${itinerary.title}" will be gone for good.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteItinerary.mutateAsync(String(itinerary.id));
                            navigation.goBack();
                        } catch (err) {
                            Alert.alert(
                                'Could not delete',
                                err instanceof Error ? err.message : 'Please try again.',
                            );
                        }
                    },
                },
            ],
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>{itinerary.title}</Text>
                <Text style={styles.subtitle}>
                    {itinerary.stops.length} stops · {formatDuration(itinerary.total_duration_minutes)}
                    {itinerary.date ? ` · ${itinerary.date}` : ''}
                </Text>
                {itinerary.is_public && (
                    <View style={styles.publicRow}>
                        <View style={styles.publicPill}>
                            <Text style={styles.publicPillText}>🌍 Public on Explore</Text>
                        </View>
                        {itinerary.avg_rating != null && (
                            <View style={styles.avgRow}>
                                <StarRating rating={itinerary.avg_rating} size={16} />
                                <Text style={styles.avgText}>
                                    {itinerary.avg_rating.toFixed(1)} ({itinerary.ratings_count})
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </View>

            {/* Stops, same list layout as the post-creation summary */}
            <ItineraryStopsList itinerary={itinerary} />

            <Button
                title="View on map"
                onPress={() => navigation.navigate('MapView', { itinerary })}
                style={{ marginTop: SPACING.lg }}
            />

            {isOwner ? (
                <>
                    <Button
                        title="Share trip"
                        variant="secondary"
                        onPress={() => shareTrip(itinerary)}
                        style={{ marginTop: SPACING.sm }}
                    />
                    <Button
                        title={deleteItinerary.isPending ? 'Deleting...' : 'Delete trip'}
                        variant="danger"
                        onPress={handleDelete}
                        disabled={deleteItinerary.isPending}
                        style={{ marginTop: SPACING.sm }}
                    />
                </>
            ) : (
                itinerary.is_public && (
                    <View style={styles.rateCard}>
                        <Text style={styles.rateTitle}>
                            {itinerary.my_rating ? 'Your rating' : 'Rate this trip'}
                        </Text>
                        <StarRating
                            rating={itinerary.my_rating ?? 0}
                            onRate={handleRate}
                            size={32}
                            disabled={rateItinerary.isPending}
                        />
                        <Text style={styles.rateHint}>
                            Top-rated trips get featured first on Explore.
                        </Text>
                    </View>
                )
            )}
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
    publicRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        marginTop: SPACING.sm,
    },
    avgRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    avgText: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.sm,
        color: COLORS.textMuted,
    },
    rateCard: {
        ...cardStyle(COLORS),
        alignItems: 'center',
        gap: SPACING.sm,
        padding: SPACING.md,
        marginTop: SPACING.sm,
    },
    rateTitle: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
    },
    rateHint: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    publicPill: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.secondaryTint,
        borderRadius: BORDER_RADIUS.full,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
    },
    publicPillText: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.sm,
        color: COLORS.secondaryDark,
    },
});
