import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, BORDER_RADIUS, type ThemeColors } from '../../constants';
import { useThemeColors } from '../../hooks/useTheme';

interface SwipeButtonsProps {
  onAccept: () => void;
  onReject: () => void;
  disabled?: boolean;
}

const EDGE = 4;
const EDGE_PRESSED = 1;

function VerdictButton({
  onPress,
  disabled,
  color,
  edgeColor,
  icon,
}: {
  onPress: () => void;
  disabled?: boolean;
  color: string;
  edgeColor: string;
  icon: 'close' | 'checkmark';
}) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          borderColor: color,
          borderBottomColor: edgeColor,
          borderBottomWidth: pressed && !disabled ? EDGE_PRESSED : EDGE,
          marginTop: pressed && !disabled ? EDGE - EDGE_PRESSED : 0,
          opacity: disabled ? 0.4 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={32} color={color} />
    </Pressable>
  );
}

export function SwipeButtons({ onAccept, onReject, disabled }: SwipeButtonsProps) {
  const COLORS = useThemeColors();
  const styles = useStyles();
  return (
    <View style={styles.container}>
      <VerdictButton
        onPress={onReject}
        disabled={disabled}
        color={COLORS.swipeReject}
        edgeColor={COLORS.errorDark}
        icon="close"
      />
      <VerdictButton
        onPress={onAccept}
        disabled={disabled}
        color={COLORS.swipeAccept}
        edgeColor={COLORS.successDark}
        icon="checkmark"
      />
    </View>
  );
}

function useStyles() {
  const COLORS = useThemeColors();
  return React.useMemo(() => makeStyles(COLORS), [COLORS]);
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xl,
    paddingVertical: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  button: {
    width: 68,
    height: 68,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
  },
});
