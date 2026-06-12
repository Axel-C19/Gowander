import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { FONTS, SPACING, FONT_SIZE, cardStyle, type ThemeColors } from '../../constants';
import { useThemeColors } from '../../hooks/useTheme';
import { Button } from './Button';

export interface AppDialogButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

interface DialogRequest {
    title: string;
    message?: string;
    buttons: AppDialogButton[];
}

// Imperative API with the same shape as Alert.alert, so call sites are
// drop-in. Dialogs raised before the host mounts are queued.
let enqueue: ((d: DialogRequest) => void) | null = null;
const preMountQueue: DialogRequest[] = [];

export function showAlert(
    title: string,
    message?: string,
    buttons?: AppDialogButton[],
): void {
    const dialog: DialogRequest = {
        title,
        message: message || undefined,
        buttons: buttons?.length ? buttons : [{ text: 'OK' }],
    };
    if (enqueue) {
        enqueue(dialog);
    } else {
        preMountQueue.push(dialog);
    }
}

/**
 * Themed replacement for the native alert popup: game-tile card, Nunito
 * type and 3D buttons, in both light and dark mode. Mounted once in App.
 */
export function AppDialogHost() {
    const COLORS = useThemeColors();
    const styles = React.useMemo(() => makeStyles(COLORS), [COLORS]);
    const [queue, setQueue] = useState<DialogRequest[]>([]);

    useEffect(() => {
        enqueue = (d) => setQueue((q) => [...q, d]);
        if (preMountQueue.length) {
            const drained = [...preMountQueue];
            preMountQueue.length = 0;
            setQueue((q) => [...q, ...drained]);
        }
        return () => {
            enqueue = null;
        };
    }, []);

    const current = queue[0];

    function close(button: AppDialogButton) {
        setQueue((q) => q.slice(1));
        button.onPress?.();
    }

    // Backdrop / hardware-back triggers the cancel action when one exists
    const cancelButton = current?.buttons.find((b) => b.style === 'cancel');

    return (
        <Modal
            visible={!!current}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={() => cancelButton && close(cancelButton)}
        >
            {current && (
                <Pressable
                    style={styles.backdrop}
                    onPress={() => cancelButton && close(cancelButton)}
                >
                    <Pressable style={styles.card} onPress={() => undefined}>
                        <Text style={styles.title}>{current.title}</Text>
                        {!!current.message && (
                            <Text style={styles.message}>{current.message}</Text>
                        )}
                        <View
                            style={
                                current.buttons.length === 2
                                    ? styles.buttonRow
                                    : styles.buttonStack
                            }
                        >
                            {current.buttons.map((b, i) => (
                                <Button
                                    key={`${b.text}-${i}`}
                                    title={b.text}
                                    variant={
                                        b.style === 'destructive'
                                            ? 'danger'
                                            : b.style === 'cancel'
                                                ? 'quiet'
                                                : 'primary'
                                    }
                                    onPress={() => close(b)}
                                    style={current.buttons.length === 2 ? { flex: 1 } : undefined}
                                />
                            ))}
                        </View>
                    </Pressable>
                </Pressable>
            )}
        </Modal>
    );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(20, 12, 4, 0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.lg,
    },
    card: {
        ...cardStyle(COLORS),
        width: '100%',
        maxWidth: 360,
        padding: SPACING.lg,
        gap: SPACING.sm,
    },
    title: {
        fontFamily: FONTS.heavy,
        fontSize: FONT_SIZE.lg,
        color: COLORS.text,
        textAlign: 'center',
    },
    message: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textMuted,
        textAlign: 'center',
        lineHeight: 21,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginTop: SPACING.sm,
    },
    buttonStack: {
        gap: SPACING.sm,
        marginTop: SPACING.sm,
    },
});
