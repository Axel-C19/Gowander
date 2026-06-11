import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { TripDateRouteProp, AppScreenNavigationProp } from '../../types/navigation';
import { CalendarPicker } from '../../components/ui/CalendarPicker';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../constants';

function formatShort(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
}

export function TripDateScreen() {
    const route = useRoute<TripDateRouteProp>();
    const navigation = useNavigation<AppScreenNavigationProp>();
    const { destination } = route.params;

    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);

    function handleSelectDate(iso: string) {
        if (!startDate || (startDate && endDate)) {
            // First tap, or restarting after a complete range
            setStartDate(iso);
            setEndDate(null);
        } else if (iso < startDate) {
            // Tapped before the start → treat as new start
            setStartDate(iso);
            setEndDate(null);
        } else {
            // Same day tapped twice = one-day trip
            setEndDate(iso);
        }
    }

    function handleContinue() {
        if (!startDate || !endDate) return;
        navigation.navigate('SwipeDeck', { destination, startDate, endDate });
    }

    const tripDays =
        startDate && endDate
            ? Math.round(
                  (new Date(endDate).getTime() - new Date(startDate).getTime()) /
                      86_400_000,
              ) + 1
            : 0;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>When is your trip?</Text>
                <Text style={styles.subtitle}>
                    {!startDate
                        ? `Pick your arrival day in ${destination.city}.`
                        : !endDate
                            ? 'Now pick your departure day (tap the same day for a one-day trip).'
                            : `${formatShort(startDate)} → ${formatShort(endDate)} · ${tripDays} day${tripDays > 1 ? 's' : ''}`}
                </Text>
            </View>

            <CalendarPicker
                rangeStart={startDate}
                rangeEnd={endDate}
                onSelectDate={handleSelectDate}
            />

            <TouchableOpacity
                style={[styles.continueButton, (!startDate || !endDate) && styles.continueDisabled]}
                onPress={handleContinue}
                disabled={!startDate || !endDate}
                activeOpacity={0.8}
            >
                <Text style={styles.continueText}>
                    {!startDate
                        ? 'Pick your arrival day'
                        : !endDate
                            ? 'Pick your departure day'
                            : 'Continue'}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: SPACING.md,
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
    continueButton: {
        height: 52,
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.lg,
    },
    continueDisabled: {
        opacity: 0.4,
    },
    continueText: {
        color: COLORS.surface,
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
    },
});
