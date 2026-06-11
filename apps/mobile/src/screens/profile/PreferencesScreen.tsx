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
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { COLORS, FONTS, SPACING, FONT_SIZE, BORDER_RADIUS, INTEREST_COLORS, INTEREST_ICONS } from '../../constants';

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
                    const tint = INTEREST_COLORS[interest.id] ?? { bg: COLORS.primaryTint, fg: COLORS.primaryDark };
                    return (
                        <TouchableOpacity
                            key={interest.id}
                            style={[
                                styles.chip,
                                { backgroundColor: isActive ? tint.bg : COLORS.surface,
                                  borderColor: isActive ? tint.fg : COLORS.border },
                            ]}
                            onPress={() => toggle(interest.id)}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={(INTEREST_ICONS[interest.id] ?? 'star-outline') as any}
                                size={16}
                                color={isActive ? tint.fg : COLORS.textMuted}
                            />
                            <Text style={[styles.chipLabel, { color: isActive ? tint.fg : COLORS.text }]}>
                                {interest.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <Button
                title={updatePreferences.isPending
                    ? 'Saving...'
                    : selected.size === 0
                        ? 'Pick at least one'
                        : isOnboarding
                            ? "Let's go!"
                            : 'Save changes'}
                onPress={handleSave}
                disabled={selected.size === 0 || updatePreferences.isPending}
                style={{ marginTop: SPACING.xl }}
            />
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
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.xxl,
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
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 2,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
    },
    chipLabel: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.md,
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
