import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { AppScreenNavigationProp } from '../../types/navigation';
import { useAuthStore } from '../../store/slices/auth.slice';
import { useUpdatePreferences } from '../../hooks/useAuth';
import { INTERESTS } from '@gowander/shared-constants';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../constants';

export function PreferencesScreen() {
    const navigation = useNavigation<AppScreenNavigationProp>();
    const user = useAuthStore((s) => s.user);
    const updatePreferences = useUpdatePreferences();

    // Pre-select existing prefs when editing from a profile section
    const [selected, setSelected] = useState<Set<string>>(
        new Set(user?.preferences ?? []),
    );

    const isOnboarding = !user?.preferences?.length;

    function toggle(id: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }

    async function handleSave() {
        try {
            await updatePreferences.mutateAsync([...selected]);
            if (isOnboarding) {
                navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
            } else {
                navigation.goBack();
            }
        } catch (err) {
            Alert.alert(
                'Could not save preferences',
                err instanceof Error ? err.message : 'Please try again.',
            );
        }
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.title}>
                    {isOnboarding ? 'What do you love when traveling?' : 'Your travel interests'}
                </Text>
                <Text style={styles.subtitle}>
                    Pick at least one — we'll use this to recommend places for you.
                </Text>
            </View>

            <View style={styles.grid}>
                {INTERESTS.map((interest) => {
                    const isActive = selected.has(interest.id);
                    return (
                        <TouchableOpacity
                            key={interest.id}
                            style={[styles.chip, isActive && styles.chipActive]}
                            onPress={() => toggle(interest.id)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.chipEmoji}>{interest.emoji}</Text>
                            <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>
                                {interest.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <TouchableOpacity
                style={[
                    styles.saveButton,
                    (selected.size === 0 || updatePreferences.isPending) && styles.saveDisabled,
                ]}
                onPress={handleSave}
                disabled={selected.size === 0 || updatePreferences.isPending}
                activeOpacity={0.8}
            >
                <Text style={styles.saveText}>
                    {updatePreferences.isPending
                        ? 'Saving...'
                        : selected.size === 0
                            ? 'Pick at least one'
                            : isOnboarding
                                ? "Let's go"
                                : 'Save changes'}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        padding: SPACING.md,
        paddingBottom: SPACING.xxl,
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
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
    },
    chipActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary,
    },
    chipEmoji: {
        fontSize: FONT_SIZE.md,
    },
    chipLabel: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.text,
    },
    chipLabelActive: {
        color: COLORS.surface,
    },
    saveButton: {
        height: 52,
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.xl,
    },
    saveDisabled: {
        opacity: 0.4,
    },
    saveText: {
        color: COLORS.surface,
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
    },
});
