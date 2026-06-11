import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { SwipeDeckRouteProp, AppScreenNavigationProp } from '../../types/navigation';
import { usePlacesByDestination } from '../../hooks/usePlaces';
import { useSwipeSession } from '../../hooks/useSwipe';
import { useSwipeStore } from '../../store/slices/swipe.slice';
import { SwipeCard } from '../../components/swipe/SwipeCard';
import { SwipeButtons } from '../../components/swipe/SwipeButtons';
import { COLORS, SPACING, FONT_SIZE } from '../../constants';
import type { SwipeDecision } from '@gowander/shared-types';
import { isPlaceOpenInRange } from '@gowander/shared-utils';
import { INTERESTS } from '@gowander/shared-constants';
import { useAuthStore } from '../../store/slices/auth.slice';

export function SwipeDeckScreen() {

    const route = useRoute<SwipeDeckRouteProp>();
    const navigation = useNavigation<AppScreenNavigationProp>();
    const { destination, startDate, endDate } = route.params;

    const destinationId = String(destination.id);

    const { data: placesData, isLoading: placesLoading, error: placesError } =
        usePlacesByDestination(destinationId);

    const { sessionId, cards, currentIndex, setSession, resetSession, isSessionComplete } =
        useSwipeStore();

    const { createSession, swipe, finish } = useSwipeSession(destinationId);
    const preferences = useAuthStore((s) => s.user?.preferences);
    // Guard prevents a second swipe from firing before the first resolves.
    // Without this, fast gestures produce a stale-closure race that skips cards.
    const isProcessingSwipe = useRef(false);
    // Reset any previous session when entering this screen
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
                Alert.alert('Error', 'Could not start swipe session. Please go back and try again.');
            },
        });
    }, [placesData?.items?.length, sessionId]);

    // Navigate when all cards are swiped
    useEffect(() => {
        if (isSessionComplete && sessionId) {
            navigation.replace('ItinerarySummary', {
                swipeSessionId: sessionId,
                destination,
                startDate,
                endDate,
            });
        }
    }, [isSessionComplete, sessionId]);

    async function handleSwipe(decision: SwipeDecision) {
        if (isProcessingSwipe.current) return;
        const card = cards[currentIndex];
        if (!card) return;

        // Places closed on the travel date can't be accepted — only dismissed
        if (decision === 'accepted' && !isPlaceOpenInRange(card.opening_hours, startDate, endDate)) {
            Alert.alert(
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
                Alert.alert('Error', 'Could not save selections. Please try again.');
            }
        }
    }

    // ── Render states ─────────────────────────────────────────────────────
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
            <Text style={styles.progress}>
                {currentIndex + 1} / {cards.length}
            </Text>

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

const styles = StyleSheet.create({
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
    progress: {
        textAlign: 'center',
        color: COLORS.textMuted,
        fontSize: FONT_SIZE.sm,
        marginTop: SPACING.sm,
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