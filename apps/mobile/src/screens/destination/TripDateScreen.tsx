import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { TripDateRouteProp, AppScreenNavigationProp } from '../../types/navigation';
import { CalendarPicker } from '../../components/ui/CalendarPicker';
import { Button } from '../../components/ui/Button';
import { FONTS, SPACING, FONT_SIZE, BORDER_RADIUS, type ThemeColors } from '../../constants';
import { useThemeColors } from '../../hooks/useTheme';
import { useTripStore } from '../../store/slices/trip.slice';
import { useT } from '../../i18n';

function formatShort(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
}

export function TripDateScreen() {
    const COLORS = useThemeColors();
    const styles = React.useMemo(() => makeStyles(COLORS), [COLORS]);
    const t = useT();

    const route = useRoute<TripDateRouteProp>();
    const navigation = useNavigation<AppScreenNavigationProp>();
    const { destination } = route.params;

    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);
    const legs = useTripStore((s) => s.legs);
    const addLeg = useTripStore((s) => s.addLeg);
    // A new leg can't start before the previous one ends
    const minDate = legs.length ? legs[legs.length - 1].endDate : null;

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
        addLeg({ destination, startDate, endDate });
        Alert.alert(t('addAnotherTitle'), t('addAnotherMsg'), [
            {
                text: t('yesAnotherCity'),
                onPress: () => navigation.navigate('Main'),
            },
            {
                text: t('buildMyTrip'),
                style: 'cancel',
                onPress: () => navigation.navigate('SwipeDeck'),
            },
        ]);
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
                <Text style={styles.title}>{t('whenIsYourTrip')}</Text>
                <Text style={styles.subtitle}>
                    {!startDate
                        ? `${t('pickArrival')} ${destination.city}.`
                        : !endDate
                            ? t('pickDeparture')
                            : `${formatShort(startDate)} → ${formatShort(endDate)} · ${tripDays} ${tripDays > 1 ? t('days') : t('day')}`}
                </Text>
            </View>

            <CalendarPicker
                rangeStart={startDate}
                rangeEnd={endDate}
                minDate={minDate}
                onSelectDate={handleSelectDate}
            />

            {startDate && endDate && (
                <View style={styles.rangePill}>
                    <Text style={styles.rangePillText}>
                        📅 {formatShort(startDate)} – {formatShort(endDate)} · {tripDays} {tripDays > 1 ? t('days') : t('day')}
                    </Text>
                </View>
            )}

            <View style={styles.spacer} />

            <Button
                title={!startDate
                    ? t('pickArrivalBtn')
                    : !endDate
                        ? t('pickDepartureBtn')
                        : t('lockDates')}
                onPress={handleContinue}
                disabled={!startDate || !endDate}
            />
        </View>
    );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
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
