import React from 'react';
import { Pressable, Text, StyleSheet, type ViewStyle } from 'react-native';
import { COLORS, FONTS, FONT_SIZE, BORDER_RADIUS, SPACING } from '../../constants';

type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'quiet';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
}

const VARIANTS: Record<Variant, { bg: string; edge: string; fg: string; border?: string }> = {
  primary: { bg: COLORS.primary, edge: COLORS.primaryDark, fg: '#FFFFFF' },
  secondary: { bg: COLORS.secondary, edge: COLORS.secondaryDark, fg: '#FFFFFF' },
  success: { bg: COLORS.success, edge: COLORS.successDark, fg: '#FFFFFF' },
  danger: { bg: COLORS.surface, edge: COLORS.errorTint, fg: COLORS.error, border: COLORS.errorTint },
  quiet: { bg: COLORS.surface, edge: COLORS.borderDark, fg: COLORS.primary, border: COLORS.border },
};

const EDGE = 4;        // Resting bottom edge depth
const EDGE_PRESSED = 1;

/**
 * Duolingo-style 3D button: flat fill with a darker bottom edge.
 * On press the button translates down and the edge shrinks — a physical click.
 * Total height stays constant so layouts never jump.
 */
export function Button({ title, onPress, variant = 'primary', disabled, style }: ButtonProps) {
  const v = VARIANTS[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: disabled ? COLORS.primaryTint : v.bg,
          borderBottomColor: disabled ? COLORS.primaryTint : v.edge,
          borderBottomWidth: pressed && !disabled ? EDGE_PRESSED : EDGE,
          marginTop: pressed && !disabled ? EDGE - EDGE_PRESSED : 0,
          ...(v.border
            ? { borderWidth: 2, borderColor: disabled ? COLORS.border : v.border }
            : {}),
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: disabled ? '#FFFFFF' : v.fg },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  label: {
    fontFamily: FONTS.heavy,
    fontSize: FONT_SIZE.md,
    letterSpacing: 0.3,
  },
});
