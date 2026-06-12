// ─── GoWander design tokens — "travel journal" Duolingo-style system ───────
// Orange = adventure anchor; sky blue = complementary travel accent.
// Green/red are RESERVED for swipe verdict + destructive actions only.

const LIGHT_COLORS = {
  primary: '#FF7A00',        // Sunset orange
  primaryDark: '#CC5F00',    // 3D button bottom edge
  primaryTint: '#FFE8D1',    // Pastel orange fill (chips, icon circles)
  secondary: '#1CB0F6',      // Macaw sky
  secondaryDark: '#1899D6',
  secondaryTint: '#DDF4FF',
  background: '#FFF8F0',     // Sandstone cream
  surface: '#FFFFFF',
  text: '#3D3329',           // Espresso
  textMuted: '#9E8C7C',      // Warm muted brown
  border: '#EFE3D5',
  borderDark: '#E0D2C0',     // Card bottom edges
  success: '#58CC02',
  successDark: '#46A302',
  successTint: '#E5F8D4',
  error: '#FF4B4B',
  errorDark: '#D63B3B',
  errorTint: '#FFE3E3',
  warning: '#FFC800',        // Bee amber
  warningTint: '#FFF4D1',
  swipeAccept: '#58CC02',
  swipeReject: '#FF4B4B',
  cardShadow: 'rgba(61, 51, 41, 0.08)',
};

// Warm "midnight journal" dark counterpart of the light palette
const DARK_COLORS: typeof LIGHT_COLORS = {
  primary: '#FF8A1F',
  primaryDark: '#C96A00',
  primaryTint: '#4A2F14',
  secondary: '#3DBDF8',
  secondaryDark: '#1899D6',
  secondaryTint: '#103A4F',
  background: '#1A140E',
  surface: '#262019',
  text: '#F5EDE3',
  textMuted: '#A89A8A',
  border: '#3A3128',
  borderDark: '#141008',
  success: '#6EDC1A',
  successDark: '#46A302',
  successTint: '#1F3310',
  error: '#FF5C5C',
  errorDark: '#D63B3B',
  errorTint: '#402020',
  warning: '#FFC800',
  warningTint: '#3D3417',
  swipeAccept: '#6EDC1A',
  swipeReject: '#FF5C5C',
  cardShadow: 'rgba(0, 0, 0, 0.4)',
};

export type ThemeColors = typeof LIGHT_COLORS;
export const THEMES: Record<'light' | 'dark', ThemeColors> = {
  light: LIGHT_COLORS,
  dark: DARK_COLORS,
};

// Static export kept for non-component modules; components should use
// useThemeColors() so they react to the appearance setting.
export const COLORS = LIGHT_COLORS;

export const FONTS = {
  body: 'Nunito_700Bold',
  heavy: 'Nunito_800ExtraBold',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 22,
  xxl: 28,
  hero: 36,
} as const;

export const BORDER_RADIUS = {
  sm: 10,
  md: 14,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

// Game-tile card chrome: chunky border + thicker bottom edge, no shadows
export const cardStyle = (c: ThemeColors) => ({
  borderWidth: 2,
  borderBottomWidth: 4,
  borderColor: c.border,
  borderBottomColor: c.borderDark,
  backgroundColor: c.surface,
  borderRadius: BORDER_RADIUS.lg,
} as const);

export const CARD = cardStyle(LIGHT_COLORS);

// Per-interest tint pairs: pastel fill + dark same-hue text (never black-on-pastel)
export const INTEREST_COLORS: Record<string, { bg: string; fg: string }> = {
  culture: { bg: '#FFE8D1', fg: '#B35400' },
  gastronomy: { bg: '#FFE3E3', fg: '#C03535' },
  history: { bg: '#FFF4D1', fg: '#9C7A00' },
  nature: { bg: '#E5F8D4', fg: '#3F9302' },
  nightlife: { bg: '#EFE4FF', fg: '#7C4DCC' },
  art: { bg: '#DDF4FF', fg: '#1175A8' },
  extreme: { bg: '#FFE8D1', fg: '#B35400' },
  shopping: { bg: '#FFE3F1', fg: '#C0398A' },
  architecture: { bg: '#FFF4D1', fg: '#9C7A00' },
};

// Place-category tints for card badges
export const CATEGORY_COLORS: Record<string, { bg: string; fg: string }> = {
  museum: { bg: '#DDF4FF', fg: '#1175A8' },
  restaurant: { bg: '#FFE3E3', fg: '#C03535' },
  landmark: { bg: '#FFE8D1', fg: '#B35400' },
  park: { bg: '#E5F8D4', fg: '#3F9302' },
  shopping: { bg: '#FFE3F1', fg: '#C0398A' },
  entertainment: { bg: '#EFE4FF', fg: '#7C4DCC' },
  religious: { bg: '#FFF4D1', fg: '#9C7A00' },
  viewpoint: { bg: '#DDF4FF', fg: '#1175A8' },
  beach: { bg: '#DDF4FF', fg: '#1175A8' },
  other: { bg: '#EFE3D5', fg: '#6B5A48' },
};

// Ionicons name per interest (replaces emoji for the tinted-chip look)
export const INTEREST_ICONS: Record<string, string> = {
  culture: 'color-palette-outline',
  gastronomy: 'restaurant-outline',
  history: 'library-outline',
  nature: 'leaf-outline',
  nightlife: 'moon-outline',
  art: 'brush-outline',
  extreme: 'flash-outline',
  shopping: 'bag-handle-outline',
  architecture: 'business-outline',
};

// Ionicons name per place category (swipe card + itinerary badges)
export const CATEGORY_ICONS: Record<string, string> = {
  museum: 'color-palette-outline',
  restaurant: 'restaurant-outline',
  landmark: 'location-outline',
  park: 'leaf-outline',
  shopping: 'bag-handle-outline',
  entertainment: 'sparkles-outline',
  religious: 'flower-outline',
  viewpoint: 'telescope-outline',
  beach: 'sunny-outline',
  other: 'compass-outline',
};
