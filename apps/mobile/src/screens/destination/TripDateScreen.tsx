import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { TripDateRouteProp, AppScreenNavigationProp } from '../../types/navigation';
import { CalendarPicker } from '../../components/ui/CalendarPicker';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../constants';

export function TripDateScreen() {
    const route = useRoute<TripDateRouteProp>();
    const navigation = useNavigation<AppScreenNavigationProp>();
    const { destination } = route.params;

    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    function handleContinue() {
        if (!selectedDate) return;
        navigation.navigate('SwipeDeck', { destination, date: selectedDate });
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>When are you visiting?</Text>
                <Text style={styles.subtitle}>
                    We'll flag places in {destination.city} that are closed on your travel date.
                </Text>
            </View>

            <CalendarPicker
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
            />

            <TouchableOpacity
                style={[styles.continueButton, !selectedDate && styles.continueDisabled]}
                onPress={handleContinue}
                disabled={!selectedDate}
                activeOpacity={0.8}
            >
                <Text style={styles.continueText}>
                    {selectedDate ? 'Continue' : 'Pick a date'}
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
