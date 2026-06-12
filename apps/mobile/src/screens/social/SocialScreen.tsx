import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
} from 'react-native';
import { showAlert } from '../../components/ui/AppDialog';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { AppScreenNavigationProp } from '../../types/navigation';
import {
    useFriends,
    useFriendRequests,
    useSendFriendRequest,
    useAcceptRequest,
    useDeclineRequest,
} from '../../hooks/useSocial';
import { socialService } from '../../services/social.service';
import type { UserPublic } from '@gowander/shared-types';
import { FONTS, SPACING, FONT_SIZE, BORDER_RADIUS, cardStyle, type ThemeColors } from '../../constants';
import { useThemeColors } from '../../hooks/useTheme';
import { useT } from '../../i18n';

export function SocialScreen() {
    const COLORS = useThemeColors();
    const styles = React.useMemo(() => makeStyles(COLORS), [COLORS]);
    const t = useT();

    const navigation = useNavigation<AppScreenNavigationProp>();
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<UserPublic[]>([]);
    const [searching, setSearching] = useState(false);

    const { data: friends = [] } = useFriends();
    const { data: requests = [] } = useFriendRequests();
    const sendRequest = useSendFriendRequest();
    const acceptRequest = useAcceptRequest();
    const declineRequest = useDeclineRequest();

    async function handleSearch(text: string) {
        setSearch(text);
        if (text.trim().length < 2) {
            setResults([]);
            return;
        }
        setSearching(true);
        try {
            setResults(await socialService.searchUsers(text.trim()));
        } catch {
            setResults([]);
        } finally {
            setSearching(false);
        }
    }

    async function handleAdd(user: UserPublic) {
        try {
            await sendRequest.mutateAsync(String(user.id));
            showAlert('Request sent', `${user.full_name} will see your friend request.`);
            setResults(results.filter((r) => r.id !== user.id));
        } catch (err) {
            showAlert('Could not send request', err instanceof Error ? err.message : '');
        }
    }

    const friendIds = new Set(friends.map((f) => String(f.user.id)));

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
        >
            {/* Add friends */}
            <View style={styles.searchWrap}>
                <Ionicons name="person-add-outline" size={18} color={COLORS.textMuted} />
                <TextInput
                    style={styles.search}
                    placeholder={t('findFriends')}
                    placeholderTextColor={COLORS.textMuted}
                    value={search}
                    onChangeText={handleSearch}
                    autoCapitalize="none"
                />
            </View>

            {search.trim().length >= 2 && (
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>
                        {searching ? '...' : t('people')}
                    </Text>
                    {results.length === 0 && !searching && (
                        <Text style={styles.emptyText}>No users found</Text>
                    )}
                    {results.map((user) => (
                        <View key={String(user.id)} style={styles.rowCard}>
                            <View style={styles.avatar}>
                                <Ionicons name="person" size={18} color={COLORS.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.rowName}>{user.full_name}</Text>
                                <Text style={styles.rowSub}>{user.email}</Text>
                            </View>
                            {friendIds.has(String(user.id)) ? (
                                <Text style={styles.alreadyFriend}>Friends ✓</Text>
                            ) : (
                                <TouchableOpacity
                                    style={styles.addButton}
                                    onPress={() => handleAdd(user)}
                                >
                                    <Text style={styles.addButtonText}>{t('add')}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                </View>
            )}

            {/* Pending requests */}
            {requests.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>{t('friendRequests')}</Text>
                    {requests.map((req) => (
                        <View key={String(req.id)} style={styles.rowCard}>
                            <View style={[styles.avatar, { backgroundColor: COLORS.warningTint }]}>
                                <Ionicons name="person" size={18} color={COLORS.warning} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.rowName}>{req.requester.full_name}</Text>
                                <Text style={styles.rowSub}>wants to be your friend</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.acceptButton}
                                onPress={() => acceptRequest.mutate(String(req.id))}
                            >
                                <Ionicons name="checkmark" size={18} color="#FFF" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.declineButton}
                                onPress={() => declineRequest.mutate(String(req.id))}
                            >
                                <Ionicons name="close" size={18} color={COLORS.error} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}

            {/* Friends */}
            <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t('friends')}</Text>
                {friends.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={40} color={COLORS.textMuted} />
                        <Text style={styles.emptyTitle}>{t('noFriends')}</Text>
                        <Text style={styles.emptyText}>
                            {t('noFriendsHint')}
                        </Text>
                    </View>
                )}
                {friends.map((friend) => (
                    <TouchableOpacity
                        key={String(friend.friendship_id)}
                        style={styles.rowCard}
                        onPress={() => navigation.navigate('Chat', { friend: friend.user })}
                        activeOpacity={0.7}
                    >
                        <View style={styles.avatar}>
                            <Ionicons name="person" size={18} color={COLORS.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rowName}>{friend.user.full_name}</Text>
                            <Text style={styles.rowSub}>{t('tapToChat')}</Text>
                        </View>
                        <Ionicons name="chatbubble-outline" size={20} color={COLORS.secondary} />
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 2,
        borderColor: COLORS.border,
        paddingHorizontal: SPACING.sm,
        gap: SPACING.xs,
    },
    search: { flex: 1, height: 46, fontSize: FONT_SIZE.md, color: COLORS.text },
    section: { marginTop: SPACING.lg, gap: SPACING.sm },
    sectionLabel: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.xs,
        color: COLORS.textMuted,
        letterSpacing: 1.2,
    },
    rowCard: {
        ...cardStyle(COLORS),
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.sm,
        gap: SPACING.sm,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primaryTint,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowName: { fontFamily: FONTS.heavy, fontSize: FONT_SIZE.md, color: COLORS.text },
    rowSub: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
    addButton: {
        backgroundColor: COLORS.secondary,
        borderRadius: BORDER_RADIUS.full,
        paddingHorizontal: SPACING.md,
        paddingVertical: 6,
    },
    addButtonText: { fontFamily: FONTS.heavy, color: '#FFF', fontSize: FONT_SIZE.sm },
    alreadyFriend: { fontFamily: FONTS.heavy, color: COLORS.success, fontSize: FONT_SIZE.sm },
    acceptButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: COLORS.success,
        alignItems: 'center',
        justifyContent: 'center',
    },
    declineButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 2,
        borderColor: COLORS.errorTint,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyState: { alignItems: 'center', paddingVertical: SPACING.xl, gap: SPACING.xs },
    emptyTitle: { fontFamily: FONTS.heavy, fontSize: FONT_SIZE.md, color: COLORS.text },
    emptyText: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, textAlign: 'center' },
});
