import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    ActivityIndicator,
    Image,
} from 'react-native';
import { showAlert } from '../../components/ui/AppDialog';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { Destination } from '@gowander/shared-types';
import type { AppScreenNavigationProp } from '../../types/navigation';
import { useDestinations } from '../../hooks/usePlaces';
import { useTripStore } from '../../store/slices/trip.slice';
import {
    FONTS,
    SPACING,
    FONT_SIZE,
    BORDER_RADIUS,
    cardStyle,
    type ThemeColors,
} from '../../constants';
import { useThemeColors } from '../../hooks/useTheme';
import { useT } from '../../i18n';

/**
 * Locked-flow city picker for adding legs to a trip in progress.
 * Lives in the stack (no tab bar), back navigation disabled — the only
 * exits are picking a city, starting the swipe, or cancelling the trip.
 */
export function AddCityScreen() {
    const COLORS = useThemeColors();
    const styles = React.useMemo(() => makeStyles(COLORS), [COLORS]);
    const t = useT();

    const navigation = useNavigation<AppScreenNavigationProp>();
    const [search, setSearch] = useState('');
    const legs = useTripStore((s) => s.legs);
    const resetTrip = useTripStore((s) => s.resetTrip);

    const { data: destinations = [], isLoading } = useDestinations();

    function handleCancelTrip() {
        showAlert(t('cancelTripTitle'), t('cancelTripMsg'), [
            { text: t('keepGoing'), style: 'cancel' },
            {
                text: t('cancelTrip'),
                style: 'destructive',
                onPress: () => {
                    resetTrip();
                    navigation.popToTop();
                },
            },
        ]);
    }

    // Header: no back, explicit cancel on the right
    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={handleCancelTrip} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close" size={24} color={COLORS.error} />
                </TouchableOpacity>
            ),
        });
    }, [COLORS]);

    // Cities already in the trip can't be added twice in a row
    const usedLast = legs.length ? String(legs[legs.length - 1].destination.id) : null;

    const filtered = destinations.filter(
        (d) =>
            String(d.id) !== usedLast &&
            `${d.name} ${d.city} ${d.country}`.toLowerCase().includes(search.toLowerCase()),
    );

    function handleSelect(destination: Destination) {
        navigation.replace('TripDate', { destination });
    }

    return (
        <View style={styles.container}>
            {/* Trip so far */}
            <View style={styles.tripBanner}>
                <Text style={styles.tripBannerTitle}>{t('tripSoFar')}</Text>
                {legs.map((leg, i) => (
                    <Text key={i} style={styles.tripBannerLeg}>
                        {i + 1}. {leg.destination.city} · {leg.startDate} → {leg.endDate}
                    </Text>
                ))}
                <TouchableOpacity
                    style={styles.swipeNowButton}
                    onPress={() => navigation.replace('SwipeDeck')}
                    activeOpacity={0.8}
                >
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                    <Text style={styles.swipeNowText}>{t('startSwiping')}</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>{t('nextCityLabel')}</Text>

            <View style={styles.searchWrap}>
                <Ionicons name="search" size={18} color={COLORS.textMuted} />
                <TextInput
                    style={styles.search}
                    placeholder={t('searchDestinations')}
                    placeholderTextColor={COLORS.textMuted}
                    value={search}
                    onChangeText={setSearch}
                    clearButtonMode="while-editing"
                />
            </View>

            {isLoading ? (
                <ActivityIndicator style={{ marginTop: SPACING.xl }} color={COLORS.primary} />
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.rowCard}
                            onPress={() => handleSelect(item)}
                            activeOpacity={0.7}
                        >
                            <Image source={{ uri: item.image_url }} style={styles.rowImage} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.rowCity}>{item.city}</Text>
                                <Text style={styles.rowCountry}>{item.country}</Text>
                            </View>
                            <Ionicons name="add-circle-outline" size={22} color={COLORS.primary} />
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>{t('noDestinations')}</Text>
                    }
                />
            )}
        </View>
    );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    tripBanner: {
        margin: SPACING.md,
        marginBottom: 0,
        backgroundColor: COLORS.primaryTint,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        gap: 4,
    },
    tripBannerTitle: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.sm,
        color: COLORS.primaryDark,
    },
    tripBannerLeg: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
    },
    swipeNowButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 6,
        backgroundColor: COLORS.success,
        borderRadius: BORDER_RADIUS.full,
        paddingHorizontal: SPACING.md,
        paddingVertical: 8,
        marginTop: SPACING.xs,
    },
    swipeNowText: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.sm,
        color: '#FFFFFF',
    },
    sectionLabel: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.xs,
        color: COLORS.textMuted,
        letterSpacing: 1.2,
        paddingHorizontal: SPACING.md,
        marginTop: SPACING.lg,
        textTransform: 'uppercase',
    },
    searchWrap: {
        marginHorizontal: SPACING.md,
        marginTop: SPACING.sm,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 2,
        borderColor: COLORS.border,
        paddingHorizontal: SPACING.sm,
        gap: SPACING.xs,
    },
    search: {
        flex: 1,
        height: 46,
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
    },
    list: {
        padding: SPACING.md,
        gap: SPACING.sm,
        paddingBottom: SPACING.xxl,
    },
    rowCard: {
        ...cardStyle(COLORS),
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.sm,
        gap: SPACING.sm,
    },
    rowImage: {
        width: 48,
        height: 48,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.border,
    },
    rowCity: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
    },
    rowCountry: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textMuted,
    },
    emptyText: {
        textAlign: 'center',
        color: COLORS.textMuted,
        marginTop: SPACING.md,
    },
});
