import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { Destination } from '@gowander/shared-types';
import type { AppScreenNavigationProp } from '../../types/navigation';
import { useDestinations } from '../../hooks/usePlaces';
import { useAuthStore } from '../../store/slices/auth.slice';
import { FONTS, SPACING, FONT_SIZE, BORDER_RADIUS, cardStyle, type ThemeColors } from '../../constants';
import { useThemeColors } from '../../hooks/useTheme';
import { useT } from '../../i18n';

// Curated "popular" set shown as big photo cards; the rest live in the list
const POPULAR_CITIES = ['Paris', 'Tokyo', 'Athens', 'Bali', 'Rome', 'New York', 'Cancún', 'Barcelona'];

function greetingKey(): 'goodMorning' | 'goodAfternoon' | 'goodEvening' {
  const h = new Date().getHours();
  if (h < 12) return 'goodMorning';
  if (h < 19) return 'goodAfternoon';
  return 'goodEvening';
}

export function DestinationPickerScreen() {
    const COLORS = useThemeColors();
    const styles = React.useMemo(() => makeStyles(COLORS), [COLORS]);
    const t = useT();

  const navigation = useNavigation<AppScreenNavigationProp>();
  const [search, setSearch] = useState('');
  const user = useAuthStore((s) => s.user);

  const { data: destinations = [], isLoading, error } = useDestinations();

  const filtered = destinations.filter((d) =>
    `${d.name} ${d.city} ${d.country}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const popular = POPULAR_CITIES
    .map((city) => destinations.find((d) => d.city === city))
    .filter(Boolean) as Destination[];

  function handleSelect(destination: Destination) {
    navigation.navigate('TripDate', { destination });
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load destinations</Text>
      </View>
    );
  }

  const firstName = user?.full_name?.split(' ')[0] ?? 'traveler';
  const isSearching = search.trim().length > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Greeting + hero */}
      <View style={styles.hero}>
        <Text style={styles.greeting}>{t(greetingKey())}, {firstName} 👋</Text>
        <Text style={styles.heroTitle}>
          {t('heroLine1')}{'\n'}{t('heroLine2')} <Text style={styles.heroAccent}>{t('heroAccent')}</Text>
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} />
        <TextInput
          style={styles.search}
          placeholder={t('searchDestinations')}
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: SPACING.xl }} color={COLORS.primary} />
      ) : isSearching ? (
        /* ── Search results ── */
        <View style={styles.listSection}>
          <Text style={styles.sectionLabel}>{t('results')}</Text>
          {filtered.length === 0 && (
            <Text style={styles.emptyText}>{t('noDestinations')}</Text>
          )}
          {filtered.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.rowCard}
              onPress={() => handleSelect(item)}
              activeOpacity={0.7}
            >
              <Image source={{ uri: item.image_url }} style={styles.rowImage} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowCity}>{item.city}</Text>
                <Text style={styles.rowCountry}>{item.country}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <>
          {/* ── Popular destinations: big photo cards ── */}
          <Text style={styles.sectionLabel}>{t('popularDestinations')}</Text>
          <FlatList
            horizontal
            data={popular}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.popularScroll}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={styles.popularCard}
                onPress={() => handleSelect(item)}
                activeOpacity={0.85}
              >
                <Image source={{ uri: item.image_url }} style={styles.popularImage} />
                <View style={styles.popularGradient} />
                {index === 0 && (
                  <View style={styles.hotBadge}>
                    <Text style={styles.hotBadgeText}>HOT</Text>
                  </View>
                )}
                <View style={styles.popularBody}>
                  <Text style={styles.popularCity}>{item.city}</Text>
                  <Text style={styles.popularCountry}>{item.country}</Text>
                </View>
              </TouchableOpacity>
            )}
          />

          {/* ── All destinations ── */}
          <View style={styles.listSection}>
            <Text style={styles.sectionLabel}>{t('allDestinations')}</Text>
            {destinations.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.rowCard}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
              >
                <Image source={{ uri: item.image_url }} style={styles.rowImage} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowCity}>{item.city}</Text>
                  <Text style={styles.rowCountry}>{item.country}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const makeStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: SPACING.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  greeting: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },
  heroTitle: {
    fontFamily: FONTS.heavy,
    fontSize: FONT_SIZE.xxl,
    color: COLORS.text,
    lineHeight: 34,
    marginTop: 2,
  },
  heroAccent: {
    fontFamily: FONTS.heavy,
    color: COLORS.primary,
  },
  searchWrap: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    gap: SPACING.xs,
  },
  search: {
    flex: 1,
    height: 46,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  sectionLabel: {
    fontFamily: FONTS.heavy,
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  popularScroll: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  popularCard: {
    width: 140,
    height: 160,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    backgroundColor: COLORS.borderDark,
  },
  popularImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  popularGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '45%',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  hotBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  hotBadgeText: {
    fontFamily: FONTS.heavy,
    fontSize: 9,
    color: '#FFFFFF',
  },
  popularBody: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 10,
  },
  popularCity: {
    fontFamily: FONTS.heavy,
    fontSize: FONT_SIZE.md,
    color: '#FFFFFF',
  },
  popularCountry: {
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255,255,255,0.8)',
  },
  listSection: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  rowCard: {
    ...cardStyle(COLORS),
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  rowImage: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.border,
  },
  rowCity: {
    fontFamily: FONTS.heavy,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  rowCountry: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },
  errorText: { color: COLORS.error, fontSize: FONT_SIZE.md },
  emptyText: { textAlign: 'center', color: COLORS.textMuted, marginTop: SPACING.md },
});
