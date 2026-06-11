import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { AppScreenNavigationProp } from '../../types/navigation';
import { useAuthStore } from '../../store/slices/auth.slice';
import { useLogout } from '../../hooks/useAuth';
import { useItineraries } from '../../hooks/useItinerary';
import { INTERESTS } from '@gowander/shared-constants';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../constants';

export function ProfileScreen() {
    const navigation = useNavigation<AppScreenNavigationProp>();
    const user = useAuthStore((s) => s.user);
    const logout = useLogout();
    const { data: itineraries = [] } = useItineraries();

    const memberSince = user?.created_at
        ? new Date(user.created_at).toLocaleDateString(undefined, {
              month: 'long',
              year: 'numeric',
          })
        : null;

    const userInterests = INTERESTS.filter((i) =>
        user?.preferences?.includes(i.id),
    );

    function handleLogout() {
        Alert.alert('Log out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log out', style: 'destructive', onPress: () => logout.mutate() },
        ]);
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Avatar + identity */}
            <View style={styles.identity}>
                <View style={styles.avatar}>
                    <Ionicons name="person" size={40} color={COLORS.primary} />
                </View>
                <Text style={styles.name}>{user?.full_name}</Text>
                <Text style={styles.email}>{user?.email}</Text>
                {memberSince && (
                    <Text style={styles.memberSince}>Member since {memberSince}</Text>
                )}
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{itineraries.length}</Text>
                    <Text style={styles.statLabel}>Saved trips</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{userInterests.length}</Text>
                    <Text style={styles.statLabel}>Interests</Text>
                </View>
            </View>

            {/* Travel interests */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Travel interests</Text>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Preferences')}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Text style={styles.editLink}>Edit</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.chipRow}>
                    {userInterests.length > 0 ? (
                        userInterests.map((interest) => (
                            <View key={interest.id} style={styles.chip}>
                                <Text style={styles.chipText}>
                                    {interest.emoji} {interest.label}
                                </Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No interests selected yet.</Text>
                    )}
                </View>
            </View>

            {/* Log out */}
            <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.8}
            >
                <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
                <Text style={styles.logoutText}>Log out</Text>
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
    identity: {
        alignItems: 'center',
        paddingVertical: SPACING.lg,
    },
    avatar: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: COLORS.surface,
        borderWidth: 2,
        borderColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.sm,
    },
    name: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '700',
        color: COLORS.text,
    },
    email: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    memberSince: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textMuted,
        marginTop: SPACING.xs,
    },
    statsRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginBottom: SPACING.lg,
    },
    statBox: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        paddingVertical: SPACING.md,
    },
    statNumber: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: '700',
        color: COLORS.primary,
    },
    statLabel: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    section: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: COLORS.text,
    },
    editLink: {
        color: COLORS.primary,
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.xs,
    },
    chip: {
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.full,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
    },
    chipText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text,
        fontWeight: '500',
    },
    emptyText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textMuted,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
        height: 52,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.error,
    },
    logoutText: {
        color: COLORS.error,
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
    },
});
