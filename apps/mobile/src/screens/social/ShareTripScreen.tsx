import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { ShareTripRouteProp, AppScreenNavigationProp } from '../../types/navigation';
import { useFriends } from '../../hooks/useSocial';
import { socialService } from '../../services/social.service';
import { FONTS, SPACING, FONT_SIZE, cardStyle, type ThemeColors } from '../../constants';
import { useThemeColors } from '../../hooks/useTheme';

export function ShareTripScreen() {
    const COLORS = useThemeColors();
    const styles = React.useMemo(() => makeStyles(COLORS), [COLORS]);

    const route = useRoute<ShareTripRouteProp>();
    const navigation = useNavigation<AppScreenNavigationProp>();
    const { itineraryId, itineraryTitle } = route.params;
    const { data: friends = [] } = useFriends();

    async function shareWith(friendId: string, friendName: string) {
        try {
            await socialService.sendMessage(
                friendId,
                `Check out my trip: ${itineraryTitle}`,
                itineraryId,
            );
            Alert.alert('Trip shared!', `${friendName} can now view "${itineraryTitle}".`, [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (err) {
            Alert.alert('Could not share', err instanceof Error ? err.message : '');
        }
    }

    return (
        <FlatList
            style={styles.container}
            contentContainerStyle={styles.list}
            data={friends}
            keyExtractor={(f) => String(f.friendship_id)}
            ListHeaderComponent={
                <Text style={styles.subtitle}>
                    Share "{itineraryTitle}" privately with a friend:
                </Text>
            }
            ListEmptyComponent={
                <View style={styles.centered}>
                    <Ionicons name="people-outline" size={40} color={COLORS.textMuted} />
                    <Text style={styles.emptyTitle}>No friends yet</Text>
                    <Text style={styles.emptyText}>
                        Add friends in the Social tab to share trips privately.
                    </Text>
                </View>
            }
            renderItem={({ item }) => (
                <TouchableOpacity
                    style={styles.rowCard}
                    onPress={() => shareWith(String(item.user.id), item.user.full_name)}
                    activeOpacity={0.7}
                >
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={18} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.rowName}>{item.user.full_name}</Text>
                        <Text style={styles.rowSub}>{item.user.email}</Text>
                    </View>
                    <Ionicons name="paper-plane-outline" size={20} color={COLORS.secondary} />
                </TouchableOpacity>
            )}
        />
    );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    list: { padding: SPACING.md, gap: SPACING.sm, flexGrow: 1 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, padding: SPACING.xl },
    subtitle: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginBottom: SPACING.xs },
    rowCard: { ...cardStyle(COLORS), flexDirection: 'row', alignItems: 'center', padding: SPACING.sm, gap: SPACING.sm },
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
    emptyTitle: { fontFamily: FONTS.heavy, fontSize: FONT_SIZE.md, color: COLORS.text },
    emptyText: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, textAlign: 'center' },
});
