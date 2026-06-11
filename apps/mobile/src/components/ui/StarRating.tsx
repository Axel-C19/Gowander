import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, type ThemeColors } from '../../constants';
import { useThemeColors } from '../../hooks/useTheme';

interface StarRatingProps {
    /** Rating to display, 0-5. May be fractional in read-only mode. */
    rating: number;
    /** When provided the stars become tappable (1-5). */
    onRate?: (stars: number) => void;
    size?: number;
    disabled?: boolean;
}

/** Five-star row in the warning-amber accent. Read-only shows half stars. */
export function StarRating({ rating, onRate, size = 22, disabled }: StarRatingProps) {
    const COLORS = useThemeColors();
    const styles = React.useMemo(() => makeStyles(COLORS), [COLORS]);

    return (
        <View style={styles.row}>
            {[1, 2, 3, 4, 5].map((star) => {
                const name =
                    rating >= star - 0.25
                        ? 'star'
                        : rating >= star - 0.75
                            ? 'star-half'
                            : 'star-outline';
                const icon = (
                    <Ionicons
                        name={name}
                        size={size}
                        color={name === 'star-outline' ? COLORS.borderDark : COLORS.warning}
                    />
                );
                if (!onRate) {
                    return <View key={star}>{icon}</View>;
                }
                return (
                    <TouchableOpacity
                        key={star}
                        onPress={() => onRate(star)}
                        disabled={disabled}
                        hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
                    >
                        {icon}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
});
