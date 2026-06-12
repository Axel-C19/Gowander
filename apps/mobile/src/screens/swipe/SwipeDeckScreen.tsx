import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { showAlert } from '../../components/ui/AppDialog';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { AppScreenNavigationProp } from '../../types/navigation';
import { usePlacesByDestination } from '../../hooks/usePlaces';
import { useSwipeSession } from '../../hooks/useSwipe';
import { useSwipeStore } from '../../store/slices/swipe.slice';
import { useTripStore } from '../../store/slices/trip.slice';
import { SwipeCard } from '../../components/swipe/SwipeCard';
import { SwipeButtons } from '../../components/swipe/SwipeButtons';
import { FONTS, SPACING, FONT_SIZE, BORDER_RADIUS, type ThemeColors } from '../../constants';
import type { SwipeDecision } from '@gowander/shared-types';
import { isPlaceOpenInRange } from '@gowander/shared-utils';
import { INTERESTS } from '@gowander/shared-constants';
import { useAuthStore } from '../../store/slices/auth.slice';
import { useThemeColors } from '../../hooks/useTheme';
import { useT } from '../../i18n';

interface CompletedLeg {
    swipeSessionId: string;
    destinationId: string;
    startDate: string;
    endDate: string;
}

export function SwipeDeckScreen() {
    const COLORS = useThemeColors();
    const styles = React.useMemo(() => makeStyles(COLORS), [COLORS]);

    const navigation = useNavigation<AppScreenNavigationProp>();
    const legs = useTripStore((s) => s.legs);
    const resetTrip = useTripStore((s) => s.resetTrip);

    // Which leg's deck is currently being swiped
    const [legIndex, setLegIndex] = useState(0);
    const completedLegs = useRef<CompletedLeg[]>([]);

    const leg = legs[legIndex];
    const destination = leg?.destination;
    const destinationId = String(destination?.id ?? '');
    const startDate = leg?.startDate ?? '';
    const endDate = leg?.endDate ?? '';

    const { data: placesData, isLoading: placesLoading, error: placesError } =
        usePlacesByDestination(destinationId);

    const { sessionId, cards, currentIndex, setSession, resetSession, isSessionComplete } =
        useSwipeStore();

    const { createSession, swipe, finish } = useSwipeSession(destinationId);
    const preferences = useAuthStore((s) => s.user?.preferences);
    // Guard prevents a second swipe from firing before the first resolves.
    // Without this, fast gestures produce a stale-closure race that skips cards.
    const isProcessingSwipe = useRef(false);

    const t = useT();

    // Header shows which city is being swiped; back is locked, so the only
    // way out mid-swipe is the explicit cancel-trip button.
    useEffect(() => {
        if (!destination) return;
        navigation.setOptions({
            title: legs.length > 1
                ? `${destination.city} (${legIndex + 1}/${legs.length})`
                : destination.city,
            headerRight: () => (
                <TouchableOpacity
                    onPress={() => {
                        showAlert(t('cancelTripTitle'), t('cancelTripMsg'), [
                            { text: t('keepGoing'), style: 'cancel' },
                            {
                                text: t('cancelTrip'),
                                style: 'destructive',
                                onPress: () => {
                                    resetSession();
                                    resetTrip();
                                    navigation.popToTop();
                                },
                            },
                        ]);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons name="close" size={24} color={COLORS.error} />
                </TouchableOpacity>
            ),
        });
    }, [destination?.city, legIndex, legs.length, COLORS]);

    // Reset the swipe session whenever the current leg changes
    useEffect(() => {
        resetSession();
    }, [destinationId]);

    // Once places load, create a session and populate the deck
    useEffect(() => {
        if (!placesData?.items?.length) return;
        if (sessionId) return;

        // Recommendation ordering: places matching the user's interests come first
        const preferredCategories = new Set(
            INTERESTS
                .filter((i) => preferences?.includes(i.id))
                .flatMap((i) => i.categories),
        );
        const orderedCards = preferredCategories.size
            ? [...placesData.items].sort(
                  (a, b) =>
                      Number(preferredCategories.has(b.category)) -
                      Number(preferredCategories.has(a.category)),
              )
            : placesData.items;

        createSession.mutate(undefined, {
            onSuccess: (session) => {
                setSession(String(session.id), orderedCards);
            },
            onError: () => {
                showAlert('Error', 'Could not start swipe session. Please go back and try again.');
            },
        });
    }, [placesData?.items?.length, sessionId]);

    // Leg deck finished → next leg, or generate the trip
    useEffect(() => {
        if (!isSessionComplete || !sessionId || !leg) return;

        completedLegs.current.push({
            swipeSessionId: sessionId,
            destinationId: String(destination.id),
            startDate,
            endDate,
        });

        if (legIndex < legs.length - 1) {
            resetSession();
            setLegIndex(legIndex + 1);
        } else {
            const allLegs = [...completedLegs.current];
            const first = legs[0];
            const last = legs[legs.length - 1];
            resetTrip();
            navigation.replace('ItinerarySummary', {
                legs: allLegs,
                destination: first.destination,
                startDate: first.startDate,
                endDate: last.endDate,
            });
        }
    }, [isSessionComplete, sessionId]);

    async function handleSwipe(decision: SwipeDecision) {
        if (isProcessingSwipe.current) return;
        const card = cards[currentIndex];
        if (!card) return;

        // Places closed during this leg's dates can't be accepted — only dismissed
        if (decision === 'accepted' && !isPlaceOpenInRange(card.opening_hours, startDate, endDate)) {
            showAlert(
                'Not available',
                `${card.name} is closed during your trip dates. You can only skip it.`,
            );
            return;
        }

        isProcessingSwipe.current = true;
        try {
            await swipe.mutateAsync({ place: card, decision });
        } catch {
            // Swipe recorded locally in onError — don't block UX
        } finally {
            isProcessingSwipe.current = false;
        }

        const isLast = currentIndex >= cards.length - 1;
        if (isLast) {
            try {
                await finish.mutateAsync();
            } catch {
                showAlert('Error', 'Could not save selections. Please try again.');
            }
        }
    }

    // ── Render states ─────────────────────────────────────────────────────
    if (!leg) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>No destinations selected.</Text>
            </View>
        );
    }

    if (placesLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.statusText}>Loading places...</Text>
            </View>
        );
    }

    if (placesError) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Failed to load places.</Text>
                <Text style={styles.statusText}>{String(placesError)}</Text>
            </View>
        );
    }

    if (!placesData?.items?.length) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>No places found for {destination.city}.</Text>
            </View>
        );
    }

    if (createSession.isPending || cards.length === 0) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.statusText}>Preparing your deck...</Text>
            </View>
        );
    }

    const currentCard = cards[currentIndex];

    if (!currentCard) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.statusText}>Building your itinerary...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${((currentIndex + 1) / cards.length) * 100}%` },
                        ]}
                    />
                </View>
                <Text style={styles.progress}>
                    {currentIndex + 1} / {cards.length}
                </Text>
            </View>

            {legs.length > 1 && (
                <Text style={styles.legBanner}>
                    📍 {destination.city} · {legIndex + 1} of {legs.length} cities
                </Text>
            )}

            <View style={styles.deckArea}>
                {cards.slice(currentIndex, currentIndex + 3).map((card, i) => (
                    <SwipeCard
                        key={String(card.id)}
                        place={card}
                        isTop={i === 0}
                        stackIndex={i}
                        onSwipe={i === 0 ? handleSwipe : undefined}
                        gestureDisabled={swipe.isPending || finish.isPending}
                        unavailable={!isPlaceOpenInRange(card.opening_hours, startDate, endDate)}
                    />
                ))}
            </View>

            <SwipeButtons
                onAccept={() => handleSwipe('accepted')}
                onReject={() => handleSwipe('rejected')}
                disabled={swipe.isPending || finish.isPending}
            />
        </View>
    );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.sm,
        padding: SPACING.xl,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        paddingHorizontal: SPACING.md,
        marginTop: SPACING.sm,
    },
    progressTrack: {
        flex: 1,
        height: 12,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.border,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.primary,
    },
    progress: {
        fontFamily: FONTS.heavy,
        color: COLORS.textMuted,
        fontSize: FONT_SIZE.sm,
    },
    legBanner: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.sm,
        color: COLORS.primary,
        textAlign: 'center',
        marginTop: SPACING.xs,
    },
    deckArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusText: {
        color: COLORS.textMuted,
        fontSize: FONT_SIZE.md,
        textAlign: 'center',
    },
    errorText: {
        color: COLORS.error,
        fontSize: FONT_SIZE.md,
        textAlign: 'center',
        fontWeight: '600',
    },
});
