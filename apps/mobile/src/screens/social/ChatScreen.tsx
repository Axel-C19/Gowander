import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { ChatRouteProp, AppScreenNavigationProp } from '../../types/navigation';
import { useConversation, useSendMessage } from '../../hooks/useSocial';
import { itineraryService } from '../../services/itinerary.service';
import { useAuthStore } from '../../store/slices/auth.slice';
import { formatDuration } from '@gowander/shared-utils';
import { FONTS, SPACING, FONT_SIZE, BORDER_RADIUS, type ThemeColors } from '../../constants';
import { useThemeColors } from '../../hooks/useTheme';

export function ChatScreen() {
    const COLORS = useThemeColors();
    const styles = React.useMemo(() => makeStyles(COLORS), [COLORS]);

    const route = useRoute<ChatRouteProp>();
    const navigation = useNavigation<AppScreenNavigationProp>();
    const { friend } = route.params;
    const myId = useAuthStore((s) => s.user?.id);
    const insets = useSafeAreaInsets();

    const { data: messages = [] } = useConversation(String(friend.id));
    const sendMessage = useSendMessage(String(friend.id));
    const [text, setText] = useState('');
    const listRef = useRef<FlatList>(null);

    useEffect(() => {
        navigation.setOptions({ title: friend.full_name });
    }, [friend.full_name]);

    async function handleSend() {
        const trimmed = text.trim();
        if (!trimmed) return;
        setText('');
        try {
            await sendMessage.mutateAsync({ text: trimmed });
        } catch (err) {
            Alert.alert('Could not send', err instanceof Error ? err.message : '');
        }
    }

    async function openSharedTrip(itineraryId: string) {
        try {
            const itinerary = await itineraryService.getById(itineraryId);
            navigation.navigate('TripDetail', { itinerary });
        } catch {
            Alert.alert('Trip unavailable', 'This trip may have been deleted.');
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={90}
        >
            <FlatList
                ref={listRef}
                data={messages}
                keyExtractor={(m) => String(m.id)}
                contentContainerStyle={styles.thread}
                onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        Say hi to {friend.full_name.split(' ')[0]} 👋
                    </Text>
                }
                renderItem={({ item }) => {
                    const mine = String(item.sender_id) === String(myId);
                    return (
                        <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
                            <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                                {item.itinerary && (
                                    <TouchableOpacity
                                        style={styles.tripAttachment}
                                        onPress={() => openSharedTrip(String(item.itinerary!.id))}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="map-outline" size={18} color={mine ? '#FFF' : COLORS.primary} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.tripTitle, mine && styles.textOnPrimary]}>
                                                {item.itinerary.title}
                                            </Text>
                                            <Text style={[styles.tripSub, mine && styles.textOnPrimaryMuted]}>
                                                {formatDuration(item.itinerary.total_duration_minutes)} · tap to view
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                                {!!item.text && (
                                    <Text style={[styles.bubbleText, mine && styles.textOnPrimary]}>
                                        {item.text}
                                    </Text>
                                )}
                            </View>
                        </View>
                    );
                }}
            />

            <View
                style={[
                    styles.inputRow,
                    // Keep the bar clear of the home indicator / screen edge
                    { paddingBottom: Math.max(insets.bottom, SPACING.sm) + SPACING.xs },
                ]}
            >
                <TextInput
                    style={styles.input}
                    placeholder="Message..."
                    placeholderTextColor={COLORS.textMuted}
                    value={text}
                    onChangeText={setText}
                    onSubmitEditing={handleSend}
                    returnKeyType="send"
                />
                <TouchableOpacity
                    style={styles.sendButton}
                    onPress={handleSend}
                    disabled={!text.trim() || sendMessage.isPending}
                >
                    <Ionicons name="send" size={18} color="#FFF" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    thread: { padding: SPACING.md, gap: SPACING.xs, flexGrow: 1 },
    emptyText: {
        textAlign: 'center',
        color: COLORS.textMuted,
        marginTop: SPACING.xl,
        fontSize: FONT_SIZE.md,
    },
    bubbleRow: { flexDirection: 'row' },
    bubbleRowMine: { justifyContent: 'flex-end' },
    bubble: {
        maxWidth: '80%',
        borderRadius: BORDER_RADIUS.lg,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        gap: 4,
    },
    bubbleMine: {
        backgroundColor: COLORS.primary,
        borderBottomRightRadius: 4,
    },
    bubbleTheirs: {
        backgroundColor: COLORS.surface,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderBottomLeftRadius: 4,
    },
    bubbleText: { fontSize: FONT_SIZE.md, color: COLORS.text },
    textOnPrimary: { color: '#FFFFFF' },
    textOnPrimaryMuted: { color: 'rgba(255,255,255,0.8)' },
    tripAttachment: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        paddingVertical: 4,
    },
    tripTitle: { fontFamily: FONTS.heavy, fontSize: FONT_SIZE.sm, color: COLORS.text },
    tripSub: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.sm,
        gap: SPACING.xs,
        backgroundColor: COLORS.surface,
        borderTopWidth: 2,
        borderTopColor: COLORS.border,
    },
    input: {
        flex: 1,
        height: 42,
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.full,
        paddingHorizontal: SPACING.md,
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
    },
    sendButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
