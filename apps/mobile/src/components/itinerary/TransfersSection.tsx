import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { AppScreenNavigationProp } from '../../types/navigation';
import { FONTS, SPACING, FONT_SIZE, BORDER_RADIUS, cardStyle, type ThemeColors } from '../../constants';
import type { Itinerary, ItineraryTransfer, TransferMode } from '@gowander/shared-types';
import { formatDuration } from '@gowander/shared-utils';
import { useThemeColors } from '../../hooks/useTheme';
import { useT } from '../../i18n';

export const MODE_ICONS: Record<TransferMode, keyof typeof Ionicons.glyphMap> = {
    flight: 'airplane-outline',
    train: 'train-outline',
    bus: 'bus-outline',
    car: 'car-outline',
};

function transferSummary(transfer: ItineraryTransfer, modeLabel: string): string {
    const parts: string[] = [];
    if (transfer.mode === 'flight') {
        parts.push(`${transfer.airline ?? ''} ${transfer.flight_number ?? ''}`.trim() || modeLabel);
        if (transfer.departure_time && transfer.arrival_time) {
            parts.push(`${transfer.departure_time}–${transfer.arrival_time}`);
        }
    } else {
        parts.push(modeLabel);
        if (transfer.duration_minutes) parts.push(formatDuration(transfer.duration_minutes));
    }
    if (transfer.price != null) parts.push(`$${Math.round(transfer.price)}`);
    return parts.join(' · ');
}

interface TransfersSectionProps {
    itinerary: Itinerary;
    /** Hide the choose/change actions for trips the viewer doesn't own. */
    readOnly?: boolean;
}

/**
 * One row per city boundary of a multi-destination trip, showing the
 * chosen transport or a button to pick one (flights, train, bus, car).
 */
export function TransfersSection({ itinerary, readOnly }: TransfersSectionProps) {
    const COLORS = useThemeColors();
    const styles = React.useMemo(() => makeStyles(COLORS), [COLORS]);
    const navigation = useNavigation<AppScreenNavigationProp>();
    const t = useT();

    const legs = itinerary.legs ?? [];
    if (legs.length < 2) return null;

    const boundaries = legs.slice(0, -1).map((leg, i) => ({
        position: i,
        from: leg.destination,
        to: legs[i + 1].destination,
        date: legs[i + 1].start_date,
        transfer: (itinerary.transfers ?? []).find((tr) => tr.position === i),
    }));

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('transfersSection')}</Text>
            {boundaries.map((b) => (
                <View key={b.position} style={styles.card}>
                    <View style={styles.routeRow}>
                        <Text style={styles.routeText}>
                            {b.from.city} <Text style={styles.routeArrow}>→</Text> {b.to.city}
                        </Text>
                        {b.date && <Text style={styles.dateText}>{b.date}</Text>}
                    </View>

                    {b.transfer ? (
                        <View style={styles.chosenRow}>
                            <View style={styles.modeIcon}>
                                <Ionicons
                                    name={MODE_ICONS[b.transfer.mode]}
                                    size={16}
                                    color={COLORS.primaryDark}
                                />
                            </View>
                            <Text style={styles.chosenText} numberOfLines={1}>
                                {transferSummary(b.transfer, t(b.transfer.mode))}
                            </Text>
                            {!readOnly && (
                                <TouchableOpacity
                                    onPress={() =>
                                        navigation.navigate('TransferPicker', {
                                            itinerary,
                                            position: b.position,
                                        })
                                    }
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <Text style={styles.changeLink}>{t('changeTransport')}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : readOnly ? null : (
                        <TouchableOpacity
                            style={styles.chooseButton}
                            onPress={() =>
                                navigation.navigate('TransferPicker', {
                                    itinerary,
                                    position: b.position,
                                })
                            }
                            activeOpacity={0.7}
                        >
                            <Ionicons name="airplane-outline" size={16} color={COLORS.secondaryDark} />
                            <Text style={styles.chooseButtonText}>{t('chooseTransport')}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ))}
        </View>
    );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
    section: {
        marginTop: SPACING.sm,
        gap: SPACING.sm,
    },
    sectionTitle: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.md,
        color: COLORS.primary,
        marginTop: SPACING.xs,
    },
    card: {
        ...cardStyle(COLORS),
        padding: SPACING.md,
        gap: SPACING.sm,
    },
    routeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    routeText: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
    },
    routeArrow: {
        color: COLORS.primary,
    },
    dateText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textMuted,
    },
    chosenRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    modeIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.primaryTint,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chosenText: {
        flex: 1,
        fontSize: FONT_SIZE.sm,
        color: COLORS.text,
        fontFamily: FONTS.heavy,
    },
    changeLink: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.sm,
        color: COLORS.secondary,
    },
    chooseButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
        backgroundColor: COLORS.secondaryTint,
        borderRadius: BORDER_RADIUS.full,
        paddingVertical: SPACING.sm,
    },
    chooseButtonText: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.sm,
        color: COLORS.secondaryDark,
    },
});
