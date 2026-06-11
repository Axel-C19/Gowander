import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { AppScreenNavigationProp } from '../../types/navigation';
import { useItineraries, useDeleteItinerary } from '../../hooks/useItinerary';
import { useShareTrip } from '../../hooks/useShareTrip';
import { FONTS, SPACING, FONT_SIZE, BORDER_RADIUS, cardStyle, type ThemeColors } from '../../constants';
import { formatDuration } from '@gowander/shared-utils';
import type { Itinerary } from '@gowander/shared-types';
import { useThemeColors } from '../../hooks/useTheme';

export function SavedItinerariesScreen() {
    const COLORS = useThemeColors();
    const styles = React.useMemo(() => makeStyles(COLORS), [COLORS]);

    const navigation = useNavigation<AppScreenNavigationProp>();
    const { data: itineraries = [], isLoading, error } = useItineraries();
    const deleteItinerary = useDeleteItinerary();
    const { shareTrip } = useShareTrip();

    function handleDelete(trip: Itinerary) {
        Alert.alert(
            'Delete trip?',
            `"${trip.title}" will be gone for good.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteItinerary.mutateAsync(String(trip.id));
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
                <Text style={styles.errorText}>Could not load your trips.</Text>
            </View>
        );
    }

    return (
        <FlatList
            style={styles.container}
            contentContainerStyle={styles.list}
            data={itineraries}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('TripDetail', { itinerary: item })}
                    activeOpacity={0.7}
                >
                    <View style={styles.cardBody}>
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.subtitle}>
                            {item.stops.length} stops · {formatDuration(item.total_duration_minutes)}
                            {item.date ? ` · ${item.date}` : ''}
                        </Text>
                        {item.is_public && (
                            <View style={styles.publicPill}>
                                <Text style={styles.publicPillText}>🌍 Public</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => shareTrip(item)}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                            <Ionicons name="share-outline" size={20} color={COLORS.secondary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleDelete(item)}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                            <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            )}
            ListEmptyComponent={
                <View style={styles.centered}>
                    <Text style={styles.emptyTitle}>No saved trips yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Generate an itinerary and tap "Save itinerary" to keep it here.
                    </Text>
                </View>
            }
        />
    );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    list: {
        padding: SPACING.md,
        gap: SPACING.sm,
        flexGrow: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
        gap: SPACING.xs,
    },
    card: {
        ...cardStyle(COLORS),
        padding: SPACING.md,
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardBody: {
        flex: 1,
    },
    title: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.lg,
        color: COLORS.text,
    },
    subtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    publicPill: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.secondaryTint,
        borderRadius: BORDER_RADIUS.full,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        marginTop: SPACING.xs,
    },
    publicPillText: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.xs,
        color: COLORS.secondaryDark,
    },
    actions: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginLeft: SPACING.sm,
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: BORDER_RADIUS.full,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.background,
    },
    errorText: {
        color: COLORS.error,
        fontSize: FONT_SIZE.md,
    },
    emptyTitle: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.lg,
        color: COLORS.text,
    },
    emptySubtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
});
