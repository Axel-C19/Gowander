import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { showAlert } from '../../components/ui/AppDialog';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { AppScreenNavigationProp } from '../../types/navigation';
import { useAuthStore } from '../../store/slices/auth.slice';
import { useLogout, useUploadAvatar, useUpdateProfile } from '../../hooks/useAuth';
import { useItineraries } from '../../hooks/useItinerary';
import { toAbsoluteUrl } from '../../services/api';
import { INTERESTS } from '@gowander/shared-constants';
import { FONTS, SPACING, FONT_SIZE, BORDER_RADIUS, INTEREST_COLORS, INTEREST_ICONS, cardStyle, type ThemeColors } from '../../constants';
import { Button } from '../../components/ui/Button';
import { useThemeColors } from '../../hooks/useTheme';
import { useSettingsStore, type ThemeMode } from '../../store/slices/settings.slice';
import { useT, LANGUAGES } from '../../i18n';

export function ProfileScreen() {
    const COLORS = useThemeColors();
    const styles = React.useMemo(() => makeStyles(COLORS), [COLORS]);

    const navigation = useNavigation<AppScreenNavigationProp>();
    const user = useAuthStore((s) => s.user);
    const logout = useLogout();
    const uploadAvatar = useUploadAvatar();
    const updateProfile = useUpdateProfile();
    const { data: itineraries = [] } = useItineraries();

    const [editingBio, setEditingBio] = useState(false);
    const [bioDraft, setBioDraft] = useState('');

    const t = useT();
    const themeMode = useSettingsStore((s) => s.themeMode);
    const setThemeMode = useSettingsStore((s) => s.setThemeMode);
    const language = useSettingsStore((s) => s.language);
    const setLanguage = useSettingsStore((s) => s.setLanguage);

    const THEME_OPTIONS: { id: ThemeMode; label: string; icon: string }[] = [
        { id: 'system', label: t('themeSystem'), icon: 'phone-portrait-outline' },
        { id: 'light', label: t('themeLight'), icon: 'sunny-outline' },
        { id: 'dark', label: t('themeDark'), icon: 'moon-outline' },
    ];

    const avatarUri = toAbsoluteUrl(user?.avatar_url);

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
        showAlert(t('logOut'), t('logOutConfirm'), [
            { text: t('cancel'), style: 'cancel' },
            { text: t('logOut'), style: 'destructive', onPress: () => logout.mutate() },
        ]);
    }

    async function handlePickAvatar() {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            showAlert(
                'Permission needed',
                'Allow photo library access to set a profile picture.',
            );
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });
        const asset = result.assets?.[0];
        if (result.canceled || !asset) return;
        try {
            await uploadAvatar.mutateAsync({
                uri: asset.uri,
                mimeType: asset.mimeType ?? 'image/jpeg',
            });
        } catch (err) {
            showAlert(
                'Could not update photo',
                err instanceof Error ? err.message : 'Please try again.',
            );
        }
    }

    function startEditingBio() {
        setBioDraft(user?.bio ?? '');
        setEditingBio(true);
    }

    async function handleSaveBio() {
        try {
            await updateProfile.mutateAsync({ bio: bioDraft.trim() });
            setEditingBio(false);
        } catch (err) {
            showAlert(
                'Could not save',
                err instanceof Error ? err.message : 'Please try again.',
            );
        }
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Avatar + identity */}
            <View style={styles.identity}>
                <TouchableOpacity
                    onPress={handlePickAvatar}
                    activeOpacity={0.8}
                    disabled={uploadAvatar.isPending}
                >
                    <View style={styles.avatar}>
                        {uploadAvatar.isPending ? (
                            <ActivityIndicator color={COLORS.primary} />
                        ) : avatarUri ? (
                            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                        ) : (
                            <Ionicons name="person" size={40} color={COLORS.primary} />
                        )}
                    </View>
                    <View style={styles.cameraBadge}>
                        <Ionicons name="camera" size={14} color="#FFF" />
                    </View>
                </TouchableOpacity>
                <Text style={styles.name}>{user?.full_name}</Text>
                <Text style={styles.email}>{user?.email}</Text>
                {memberSince && (
                    <Text style={styles.memberSince}>{t('memberSince')} {memberSince}</Text>
                )}
            </View>

            {/* About me */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>About me</Text>
                    {!editingBio && (
                        <TouchableOpacity
                            onPress={startEditingBio}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Text style={styles.editLink}>{user?.bio ? 'Edit' : 'Add'}</Text>
                        </TouchableOpacity>
                    )}
                </View>
                {editingBio ? (
                    <>
                        <TextInput
                            style={styles.bioInput}
                            value={bioDraft}
                            onChangeText={setBioDraft}
                            placeholder="Tell other travellers about yourself..."
                            placeholderTextColor={COLORS.textMuted}
                            multiline
                            maxLength={500}
                            autoFocus
                        />
                        <Text style={styles.bioCount}>{bioDraft.length}/500</Text>
                        <View style={styles.bioActions}>
                            <Button
                                title="Cancel"
                                variant="quiet"
                                onPress={() => setEditingBio(false)}
                                style={{ flex: 1 }}
                            />
                            <Button
                                title={updateProfile.isPending ? 'Saving...' : 'Save'}
                                onPress={handleSaveBio}
                                disabled={updateProfile.isPending}
                                style={{ flex: 1 }}
                            />
                        </View>
                    </>
                ) : (
                    <Text style={user?.bio ? styles.bioText : styles.emptyText}>
                        {user?.bio ?? 'Nothing here yet — add a few words about yourself.'}
                    </Text>
                )}
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{itineraries.length}</Text>
                    <Text style={styles.statLabel}>{t('savedTrips')}</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{userInterests.length}</Text>
                    <Text style={styles.statLabel}>{t('interests')}</Text>
                </View>
            </View>

            {/* Travel interests */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{t('titleInterests')}</Text>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Preferences')}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Text style={styles.editLink}>{t('edit')}</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.chipRow}>
                    {userInterests.length > 0 ? (
                        userInterests.map((interest) => {
                            const tint = INTEREST_COLORS[interest.id] ?? { bg: COLORS.primaryTint, fg: COLORS.primaryDark };
                            return (
                                <View key={interest.id} style={[styles.chip, { backgroundColor: tint.bg }]}>
                                    <Ionicons
                                        name={(INTEREST_ICONS[interest.id] ?? 'star-outline') as any}
                                        size={14}
                                        color={tint.fg}
                                    />
                                    <Text style={[styles.chipText, { color: tint.fg }]}>
                                        {interest.label}
                                    </Text>
                                </View>
                            );
                        })
                    ) : (
                        <Text style={styles.emptyText}>{t('noInterests')}</Text>
                    )}
                </View>
            </View>

            {/* Quick settings */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { marginBottom: SPACING.sm }]}>
                    {t('quickSettings')}
                </Text>

                {/* Appearance */}
                <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>{t('appearance')}</Text>
                </View>
                <View style={styles.segmented}>
                    {THEME_OPTIONS.map((opt) => {
                        const active = themeMode === opt.id;
                        return (
                            <TouchableOpacity
                                key={opt.id}
                                style={[styles.segment, active && styles.segmentActive]}
                                onPress={() => setThemeMode(opt.id)}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={opt.icon as any}
                                    size={15}
                                    color={active ? '#FFFFFF' : COLORS.textMuted}
                                />
                                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                                    {opt.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Language */}
                <View style={[styles.settingRow, { marginTop: SPACING.md }]}>
                    <Text style={styles.settingLabel}>{t('language')}</Text>
                </View>
                <View style={styles.segmented}>
                    {LANGUAGES.map((lang) => {
                        const active = language === lang.id;
                        return (
                            <TouchableOpacity
                                key={lang.id}
                                style={[styles.segment, active && styles.segmentActive]}
                                onPress={() => setLanguage(lang.id)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.segmentFlag}>{lang.flag}</Text>
                                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                                    {lang.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Log out */}
            <Button title={t('logOut')} variant="danger" onPress={handleLogout} />
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
    },
    identity: {
        alignItems: 'center',
        paddingVertical: SPACING.lg,
    },
    avatar: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: COLORS.primaryTint,
        borderWidth: 2,
        borderColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.sm,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    cameraBadge: {
        position: 'absolute',
        right: 0,
        bottom: SPACING.sm,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: COLORS.secondary,
        borderWidth: 2,
        borderColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bioText: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
        lineHeight: 22,
    },
    bioInput: {
        minHeight: 90,
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        padding: SPACING.sm,
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
        textAlignVertical: 'top',
    },
    bioCount: {
        alignSelf: 'flex-end',
        fontSize: FONT_SIZE.xs,
        color: COLORS.textMuted,
        marginTop: SPACING.xs,
    },
    bioActions: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginTop: SPACING.sm,
    },
    name: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.xl,
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
        ...cardStyle(COLORS),
        alignItems: 'center',
        paddingVertical: SPACING.md,
    },
    statNumber: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.xxl,
        color: COLORS.primary,
    },
    statLabel: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    section: {
        ...cardStyle(COLORS),
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
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
    },
    editLink: {
        fontFamily: FONTS.heavy,
        color: COLORS.secondary,
        fontSize: FONT_SIZE.md,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.xs,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        borderRadius: BORDER_RADIUS.full,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 5,
    },
    chipText: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.sm,
    },
    emptyText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textMuted,
    },
    settingRow: {
        marginBottom: SPACING.xs,
    },
    settingLabel: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.sm,
        color: COLORS.text,
    },
    segmented: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.xs,
    },
    segment: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 7,
    },
    segmentActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    segmentText: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.sm,
        color: COLORS.textMuted,
    },
    segmentTextActive: {
        color: '#FFFFFF',
    },
    segmentFlag: {
        fontSize: FONT_SIZE.sm,
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
