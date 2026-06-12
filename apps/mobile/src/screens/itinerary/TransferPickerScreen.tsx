import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { showAlert } from '../../components/ui/AppDialog';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { TransferPickerRouteProp, AppScreenNavigationProp } from '../../types/navigation';
import { useItinerary, useSelectTransfer } from '../../hooks/useItinerary';
import { useTransferSearch } from '../../hooks/useFlights';
import { MODE_ICONS } from '../../components/itinerary/TransfersSection';
import { FONTS, SPACING, FONT_SIZE, BORDER_RADIUS, cardStyle, type ThemeColors } from '../../constants';
import type { FlightOption, GroundOption } from '@gowander/shared-types';
import { formatDuration } from '@gowander/shared-utils';
import { useThemeColors } from '../../hooks/useTheme';
import { openFlightInGoogleFlights } from '../../utils/googleFlights';
import { useT } from '../../i18n';

export function TransferPickerScreen() {
    const COLORS = useThemeColors();
    const styles = React.useMemo(() => makeStyles(COLORS), [COLORS]);
    const t = useT();

    const route = useRoute<TransferPickerRouteProp>();
    const navigation = useNavigation<AppScreenNavigationProp>();
    const { position } = route.params;

    // Prefer the live cache: a previous selection may have updated transfers
    const { data: live } = useItinerary(String(route.params.itinerary.id));
    const itinerary = live ?? route.params.itinerary;

    const fromLeg = itinerary.legs[position];
    const toLeg = itinerary.legs[position + 1];
    const travelDate = toLeg?.start_date ?? itinerary.date ?? '';

    const search = useTransferSearch(
        String(fromLeg?.destination.id ?? ''),
        String(toLeg?.destination.id ?? ''),
        travelDate,
    );
    const selectTransfer = useSelectTransfer();
    const [pendingKey, setPendingKey] = useState<string | null>(null);

    const current = (itinerary.transfers ?? []).find((tr) => tr.position === position);

    async function choose(key: string, payload: Parameters<typeof selectTransfer.mutateAsync>[0]['payload']) {
        setPendingKey(key);
        try {
            await selectTransfer.mutateAsync({ id: String(itinerary.id), payload });
            // Flights continue to Google Flights so the user can book the
            // option they picked; ground choices just return to the trip.
            if (payload.mode === 'flight') {
                openFlightInGoogleFlights({
                    fromAirport: payload.from_airport,
                    toAirport: payload.to_airport,
                    fromCity: fromLeg.destination.city,
                    toCity: toLeg.destination.city,
                    date: travelDate,
                });
            }
            navigation.goBack();
        } catch (err) {
            showAlert(
                t('flightsUnavailable'),
                err instanceof Error ? err.message : '',
            );
        } finally {
            setPendingKey(null);
        }
    }

    function chooseFlight(f: FlightOption) {
        choose(`flight-${f.flight_number}`, {
            position,
            mode: 'flight',
            airline: f.airline,
            flight_number: f.flight_number,
            departure_time: f.departure_time,
            arrival_time: f.arrival_time,
            duration_minutes: f.duration_minutes,
            price: f.price,
            from_airport: f.from_airport,
            to_airport: f.to_airport,
            flight_stops: f.stops,
        });
    }

    function chooseGround(g: GroundOption) {
        choose(`ground-${g.mode}`, {
            position,
            mode: g.mode,
            duration_minutes: g.duration_minutes,
            price: g.price,
        });
    }

    if (!fromLeg || !toLeg) return null;

    const data = search.data;
    const recommendationKey =
        data?.recommended_mode === 'flight'
            ? 'recommendedFlight'
            : data?.recommended_mode === 'car'
                ? 'recommendedCar'
                : 'recommendedTrain';

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Route header */}
            <View style={styles.header}>
                <Text style={styles.routeTitle}>
                    {fromLeg.destination.city} <Text style={styles.routeArrow}>→</Text> {toLeg.destination.city}
                </Text>
                <Text style={styles.routeMeta}>
                    {travelDate}
                    {data ? ` · ${Math.round(data.distance_km)} km` : ''}
                </Text>
            </View>

            {search.isLoading && (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>{t('searchingFlights')}</Text>
                </View>
            )}

            {search.isError && (
                <Text style={styles.errorText}>{t('flightsUnavailable')}</Text>
            )}

            {data && (
                <>
                    {/* Recommendation banner */}
                    <View style={styles.banner}>
                        <Text style={styles.bannerText}>{t(recommendationKey)}</Text>
                    </View>

                    {/* Flights */}
                    {data.flights.length > 0 && (
                        <>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>{t('flightsHeader')}</Text>
                                <Text style={styles.sourceNote}>
                                    {data.flights_source === 'google_flights'
                                        ? t('viaGoogleFlights')
                                        : t('estimatedPrices')}
                                </Text>
                            </View>
                            {data.flights.map((f) => {
                                const key = `flight-${f.flight_number}`;
                                const isCurrent =
                                    current?.mode === 'flight' &&
                                    current.flight_number === f.flight_number;
                                return (
                                    <TouchableOpacity
                                        key={key}
                                        style={[styles.optionCard, isCurrent && styles.optionCardSelected]}
                                        onPress={() => chooseFlight(f)}
                                        disabled={pendingKey !== null}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.optionLeft}>
                                            <Text style={styles.airline}>{f.airline}</Text>
                                            <Text style={styles.flightMeta}>
                                                {f.flight_number} · {f.stops === 0
                                                    ? t('nonstop')
                                                    : `${f.stops} ${f.stops === 1 ? t('stopLabel') : t('stopsLabel')}`}
                                            </Text>
                                            <Text style={styles.flightTimes}>
                                                {f.departure_time}–{f.arrival_time}
                                                {f.duration_minutes ? ` · ${formatDuration(f.duration_minutes)}` : ''}
                                            </Text>
                                        </View>
                                        <View style={styles.optionRight}>
                                            {pendingKey === key ? (
                                                <ActivityIndicator color={COLORS.primary} />
                                            ) : isCurrent ? (
                                                <Text style={styles.selectedText}>{t('selectedCheck')}</Text>
                                            ) : (
                                                <Text style={styles.price}>
                                                    {f.price != null ? `$${Math.round(f.price)}` : '—'}
                                                </Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </>
                    )}

                    {/* Ground options */}
                    {data.ground.length > 0 && (
                        <>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>{t('groundHeader')}</Text>
                                <Text style={styles.sourceNote}>{t('estimatedPrices')}</Text>
                            </View>
                            {data.ground.map((g) => {
                                const key = `ground-${g.mode}`;
                                const isCurrent = current?.mode === g.mode;
                                return (
                                    <TouchableOpacity
                                        key={key}
                                        style={[styles.optionCard, isCurrent && styles.optionCardSelected]}
                                        onPress={() => chooseGround(g)}
                                        disabled={pendingKey !== null}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.groundIcon}>
                                            <Ionicons
                                                name={MODE_ICONS[g.mode]}
                                                size={20}
                                                color={COLORS.primaryDark}
                                            />
                                        </View>
                                        <View style={styles.optionLeft}>
                                            <Text style={styles.airline}>{t(g.mode)}</Text>
                                            <Text style={styles.flightMeta}>
                                                {formatDuration(g.duration_minutes)} · {t('estimateTag')}
                                            </Text>
                                        </View>
                                        <View style={styles.optionRight}>
                                            {pendingKey === key ? (
                                                <ActivityIndicator color={COLORS.primary} />
                                            ) : isCurrent ? (
                                                <Text style={styles.selectedText}>{t('selectedCheck')}</Text>
                                            ) : (
                                                <Text style={styles.price}>~${Math.round(g.price)}</Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </>
                    )}
                </>
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
        gap: SPACING.sm,
    },
    centered: {
        alignItems: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.xl,
    },
    loadingText: {
        color: COLORS.textMuted,
        fontSize: FONT_SIZE.md,
    },
    errorText: {
        color: COLORS.error,
        fontSize: FONT_SIZE.md,
        textAlign: 'center',
        marginTop: SPACING.lg,
    },
    header: {
        marginBottom: SPACING.xs,
    },
    routeTitle: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.xl,
        color: COLORS.text,
    },
    routeArrow: {
        color: COLORS.primary,
    },
    routeMeta: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    banner: {
        backgroundColor: COLORS.primaryTint,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.sm,
    },
    bannerText: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.sm,
        color: COLORS.primaryDark,
    },
    sectionHeader: {
        marginTop: SPACING.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: SPACING.sm,
    },
    sectionTitle: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
    },
    sourceNote: {
        flexShrink: 1,
        fontSize: FONT_SIZE.xs,
        color: COLORS.textMuted,
        textAlign: 'right',
    },
    optionCard: {
        ...cardStyle(COLORS),
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        gap: SPACING.sm,
    },
    optionCardSelected: {
        borderColor: COLORS.primary,
        borderBottomColor: COLORS.primaryDark,
    },
    optionLeft: {
        flex: 1,
        gap: 2,
    },
    optionRight: {
        alignItems: 'flex-end',
        minWidth: 64,
    },
    airline: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
    },
    flightMeta: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textMuted,
    },
    flightTimes: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text,
    },
    price: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.lg,
        color: COLORS.primary,
    },
    selectedText: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.sm,
        color: COLORS.success,
    },
    groundIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primaryTint,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
