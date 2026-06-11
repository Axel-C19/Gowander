import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../constants';

interface SwipeButtonsProps {
  onAccept: () => void;
  onReject: () => void;
  disabled?: boolean;
}

export function SwipeButtons({ onAccept, onReject, disabled }: SwipeButtonsProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, styles.rejectButton, disabled && styles.disabled]}
        onPress={onReject}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={[styles.icon, { color: COLORS.swipeReject }]}>✕</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.acceptButton, disabled && styles.disabled]}
        onPress={onAccept}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={[styles.icon, { color: COLORS.swipeAccept }]}>✓</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xl,
    paddingVertical: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1.5,
  },
  rejectButton: { borderColor: COLORS.swipeReject },
  acceptButton: { borderColor: COLORS.swipeAccept },
  disabled: { opacity: 0.4 },
  icon: { fontSize: FONT_SIZE.xl, fontWeight: '700' },
});
