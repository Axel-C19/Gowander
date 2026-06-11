import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import {
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import type { PlaceCard } from '@gowander/shared-types';
import type { SwipeDecision } from '@gowander/shared-types';
import { FONTS, SPACING, FONT_SIZE, BORDER_RADIUS, CATEGORY_COLORS, CATEGORY_ICONS, type ThemeColors } from '../../constants';
import { SWIPE } from '@gowander/shared-constants';
import { useThemeColors } from '../../hooks/useTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - SPACING.xl * 2;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

interface SwipeCardProps {
  place: PlaceCard;
  isTop: boolean;
  stackIndex: number;
  onSwipe?: (decision: SwipeDecision) => void;
  gestureDisabled?: boolean;
  /** Closed on the traveler's selected date — shown faded, can only be skipped. */
  unavailable?: boolean;
}

export function SwipeCard({
  place,
  isTop,
  stackIndex,
  onSwipe,
  gestureDisabled = false,
  unavailable = false,
}: SwipeCardProps) {
    const COLORS = useThemeColors();
    const styles = React.useMemo(() => makeStyles(COLORS), [COLORS]);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const [imageFailed, setImageFailed] = useState(false);
  const categoryTint = CATEGORY_COLORS[place.category] ?? CATEGORY_COLORS.other;

  function handleSwipeComplete(decision: SwipeDecision) {
    onSwipe?.(decision);
    translateX.value = 0;
    translateY.value = 0;
  }

  const pan = Gesture.Pan()
    .enabled(isTop && !gestureDisabled)
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.3;
    })
    .onEnd((e) => {
      const swipedRight = e.translationX > SWIPE.SWIPE_THRESHOLD;
      const swipedLeft = e.translationX < -SWIPE.SWIPE_THRESHOLD;

      if (swipedRight) {
        if (unavailable) {
          // Closed on the travel date — bounce back; screen shows the explanation
          translateX.value = withSpring(0);
          translateY.value = withSpring(0);
          if (onSwipe) runOnJS(onSwipe)('accepted');
        } else {
          translateX.value = withSpring(SCREEN_WIDTH * 1.5);
          runOnJS(handleSwipeComplete)('accepted');
        }
      } else if (swipedLeft) {
        translateX.value = withSpring(-SCREEN_WIDTH * 1.5);
        runOnJS(handleSwipeComplete)('rejected');
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-SWIPE.ROTATION_ANGLE, 0, SWIPE.ROTATION_ANGLE],
    );

    // Stack visual offset for cards behind top
    const scale = isTop ? 1 : 1 - stackIndex * 0.04;
    const yOffset = isTop ? 0 : stackIndex * -8;

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value + yOffset },
        { rotate: isTop ? `${rotation}deg` : '0deg' },
        { scale },
      ],
      zIndex: 10 - stackIndex,
    };
  });

  const acceptOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE.SWIPE_THRESHOLD], [0, 1]),
  }));

  const rejectOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, -SWIPE.SWIPE_THRESHOLD], [0, 1]),
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, unavailable && styles.cardUnavailable, animatedStyle]}>
        {place.image_url && !imageFailed ? (
          <Image
            source={{ uri: place.image_url }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          // Never show an empty card: tinted placeholder with the category icon
          <View style={[styles.image, styles.imageFallback, { backgroundColor: categoryTint.bg }]}>
            <Ionicons
              name={(CATEGORY_ICONS[place.category] ?? 'compass-outline') as any}
              size={72}
              color={categoryTint.fg}
            />
          </View>
        )}

        {/* Grayscale scrim — card stays opaque so the next card never shows through */}
        {unavailable && <View style={styles.grayscaleScrim} pointerEvents="none" />}

        {/* Unavailable banner */}
        {unavailable && (
          <View style={styles.unavailableBanner}>
            <Text style={styles.unavailableText}>
              Not available on your selected date
            </Text>
          </View>
        )}

        {/* Accept indicator (hidden for unavailable places) */}
        {!unavailable && (
          <Animated.View style={[styles.overlay, styles.acceptOverlay, acceptOverlayStyle]}>
            <Text style={styles.overlayText}>YES</Text>
          </Animated.View>
        )}

        {/* Reject indicator */}
        <Animated.View style={[styles.overlay, styles.rejectOverlay, rejectOverlayStyle]}>
          <Text style={styles.overlayText}>SKIP</Text>
        </Animated.View>

        <View style={styles.info}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: (CATEGORY_COLORS[place.category] ?? CATEGORY_COLORS.other).bg },
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                { color: (CATEGORY_COLORS[place.category] ?? CATEGORY_COLORS.other).fg },
              ]}
            >
              {place.category}
            </Text>
          </View>
          <Text style={[styles.placeName, unavailable && styles.textGray]} numberOfLines={2}>
            {place.name}
          </Text>
          <Text style={styles.placeDescription} numberOfLines={3}>
            {place.description}
          </Text>
          <Text style={[styles.duration, unavailable && styles.textGray]}>
            ~{place.estimated_duration_minutes} min visit
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: COLORS.border,
    borderBottomColor: COLORS.borderDark,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '60%',
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardUnavailable: {
    backgroundColor: '#E8E8E8',
  },
  grayscaleScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',   // Covers the image area
    backgroundColor: 'rgba(130, 130, 130, 0.75)',
  },
  unavailableBanner: {
    position: 'absolute',
    top: '52%',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingVertical: SPACING.xs,
    alignItems: 'center',
  },
  textGray: {
    color: '#9A9A9A',
  },
  unavailableText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  overlay: {
    position: 'absolute',
    top: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 3,
  },
  acceptOverlay: {
    left: SPACING.md,
    borderColor: COLORS.swipeAccept,
    backgroundColor: 'transparent',
  },
  rejectOverlay: {
    right: SPACING.md,
    borderColor: COLORS.swipeReject,
    backgroundColor: 'transparent',
  },
  overlayText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.swipeAccept,
  },
  info: {
    flex: 1,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  categoryText: {
    fontFamily: FONTS.heavy,
    fontSize: FONT_SIZE.xs,
    textTransform: 'capitalize',
  },
  placeName: {
    fontFamily: FONTS.heavy,
    fontSize: FONT_SIZE.xl,
    color: COLORS.text,
  },
  placeDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  duration: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: '500',
    marginTop: 'auto' as any,
  },
});
