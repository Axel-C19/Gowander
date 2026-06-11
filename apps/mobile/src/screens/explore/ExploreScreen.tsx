import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { AppScreenNavigationProp } from '../../types/navigation';
import { usePublicTrips } from '../../hooks/useSocial';
import { StarRating } from '../../components/ui/StarRating';
import { formatDuration } from '@gowander/shared-utils';
import { FONTS, SPACING, FONT_SIZE, BORDER_RADIUS, cardStyle, type ThemeColors } from '../../constants';
import { useThemeColors } from '../../hooks/useTheme';
import { useT } from '../../i18n';

export function ExploreScreen() {
    const COLORS = useThemeColors();
    const styles = React.useMemo(() => makeStyles(COLORS), [COLORS]);
    const t = useT();

    const navigation = useNavigation<AppScreenNavigationProp>();
    const { data: trips = [], isLoading, error, refetch, isRefetching } = usePublicTrips();

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Could not load public trips.</Text>
            </View>
        );
    }

    return (
        <FlatList
            style={styles.container}
            contentContainerStyle={styles.list}
            data={trips}
            keyExtractor={(t) => String(t.itinerary.id)}
            refreshing={isRefetching}
            onRefresh={refetch}
            ListHeaderComponent={
                <Text style={styles.subtitle}>
                    {t('communityTrips')}
                </Text>
            }
            ListEmptyComponent={
                <View style={styles.centered}>
                    <Ionicons name="earth-outline" size={44} color={COLORS.textMuted} />
                    <Text style={styles.emptyTitle}>{t('noPublicTrips')}</Text>
                    <Text style={styles.emptyText}>
                        {t('noPublicTripsHint')}
                    </Text>
                </View>
            }
            renderItem={({ item }) => (
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('TripDetail', { itinerary: item.itinerary })}
                    activeOpacity={0.8}
                >
                    {item.itinerary.destination?.image_url && (
                        <Image
                            source={{ uri: item.itinerary.destination.image_url }}
                            style={styles.cardImage}
                        />
                    )}
                    <View style={styles.cardBody}>
                        <Text style={styles.cardTitle}>{item.itinerary.title}</Text>
                        <Text style={styles.cardMeta}>
                            {item.itinerary.stops.length} stops · {formatDuration(item.itinerary.total_duration_minutes)}
                        </Text>
                        <View style={styles.ratingRow}>
                            {item.itinerary.avg_rating != null ? (
                                <>
                                    <StarRating rating={item.itinerary.avg_rating} size={13} />
                                    <Text style={styles.ratingText}>
                                        {item.itinerary.avg_rating.toFixed(1)} ({item.itinerary.ratings_count})
                                    </Text>
                                </>
                            ) : (
                                <Text style={styles.noRatingText}>{t('noRatings')}</Text>
                            )}
                        </View>
                        <View style={styles.ownerRow}>
                            <Ionicons name="person-circle-outline" size={16} color={COLORS.secondary} />
                            <Text style={styles.ownerText}>{t('by')} {item.owner.full_name}</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
                </TouchableOpacity>
            )}
        />
    );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    list: { padding: SPACING.md, gap: SPACING.sm, flexGrow: 1 },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.xl,
        gap: SPACING.xs,
    },
    subtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textMuted,
        marginBottom: SPACING.xs,
    },
    card: {
        ...cardStyle(COLORS),
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.sm,
        gap: SPACING.sm,
    },
    cardImage: {
        width: 56,
        height: 56,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.border,
    },
    cardBody: { flex: 1, gap: 2 },
    cardTitle: { fontFamily: FONTS.heavy, fontSize: FONT_SIZE.md, color: COLORS.text },
    cardMeta: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
    ratingText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, fontFamily: FONTS.heavy },
    noRatingText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
    ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ownerText: { fontSize: FONT_SIZE.xs, color: COLORS.secondary, fontFamily: FONTS.heavy },
    errorText: { color: COLORS.error, fontSize: FONT_SIZE.md },
    emptyTitle: { fontFamily: FONTS.heavy, fontSize: FONT_SIZE.lg, color: COLORS.text },
    emptyText: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, textAlign: 'center' },
});
