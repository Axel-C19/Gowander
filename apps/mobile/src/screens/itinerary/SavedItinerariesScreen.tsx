import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { AppScreenNavigationProp } from '../../types/navigation';
import { useItineraries } from '../../hooks/useItinerary';
import { COLORS, FONTS, SPACING, FONT_SIZE, BORDER_RADIUS, CARD } from '../../constants';
import { formatDuration } from '@gowander/shared-utils';

export function SavedItinerariesScreen() {
    const navigation = useNavigation<AppScreenNavigationProp>();
    const { data: itineraries = [], isLoading, error } = useItineraries();

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
                    onPress={() => navigation.navigate('MapView', { itinerary: item })}
                    activeOpacity={0.7}
                >
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.subtitle}>
                        {item.stops.length} stops · {formatDuration(item.total_duration_minutes)}
                        {item.date ? ` · ${item.date}` : ''}
                    </Text>
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

const styles = StyleSheet.create({
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
        ...CARD,
        padding: SPACING.md,
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
