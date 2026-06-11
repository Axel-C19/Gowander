import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { TripDateRouteProp, AppScreenNavigationProp } from '../../types/navigation';
import { CalendarPicker } from '../../components/ui/CalendarPicker';
import { Button } from '../../components/ui/Button';
import { COLORS, FONTS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../constants';

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

            {startDate && endDate && (
                <View style={styles.rangePill}>
                    <Text style={styles.rangePillText}>
                        📅 {formatShort(startDate)} – {formatShort(endDate)} · {tripDays} day{tripDays > 1 ? 's' : ''}
                    </Text>
                </View>
            )}

            <View style={styles.spacer} />

            <Button
                title={!startDate
                    ? 'Pick your arrival day'
                    : !endDate
                        ? 'Pick your departure day'
                        : 'Lock in my dates'}
                onPress={handleContinue}
                disabled={!startDate || !endDate}
            />
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
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.xxl,
        color: COLORS.text,
    },
    subtitle: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textMuted,
        marginTop: SPACING.xs,
    },
    rangePill: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.primaryTint,
        borderRadius: BORDER_RADIUS.full,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        marginTop: SPACING.md,
    },
    rangePillText: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.sm,
        color: COLORS.primaryDark,
    },
    spacer: {
        flex: 1,
    },
});
