import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
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
import {
  COLORS,
  FONTS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  CARD,
  INTEREST_COLORS,
} from '../../constants';

// Rotate destination icon circles through the pastel tint pairs
const TINTS = Object.values(INTEREST_COLORS);
const CITY_ICONS = ['earth-outline', 'map-outline', 'compass-outline', 'trail-sign-outline'] as const;

function tintFor(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return { tint: TINTS[hash % TINTS.length], icon: CITY_ICONS[hash % CITY_ICONS.length] };
}

export function DestinationPickerScreen() {
  const navigation = useNavigation<AppScreenNavigationProp>();
  const [search, setSearch] = useState('');

  const { data: destinations = [], isLoading, error } = useDestinations();

  const filtered = destinations.filter((d) =>
    `${d.name} ${d.city} ${d.country}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Where to?</Text>
        <Text style={styles.subtitle}>Pick a destination, start an adventure</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.search}
          placeholder="Search destinations..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.centered} color={COLORS.primary} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const { tint, icon } = tintFor(item.city);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
              >
                {item.image_url ? (
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.cityImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.iconCircle, { backgroundColor: tint.bg }]}>
                    <Ionicons name={icon as any} size={22} color={tint.fg} />
                  </View>
                )}
                <View style={styles.cardText}>
                  <Text style={styles.cityName}>{item.city}</Text>
                  <Text style={styles.country}>{item.country}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No destinations found</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  title: {
    fontFamily: FONTS.heavy,
    fontSize: FONT_SIZE.xxl,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  searchWrap: {
    margin: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
  },
  searchIcon: {
    marginLeft: SPACING.xs,
  },
  search: {
    flex: 1,
    height: 48,
    paddingHorizontal: SPACING.sm,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  list: { paddingHorizontal: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING.xl },
  card: {
    ...CARD,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.border,
  },
  cardText: { flex: 1 },
  cityName: {
    fontFamily: FONTS.heavy,
    fontSize: FONT_SIZE.lg,
    color: COLORS.text,
  },
  country: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginTop: 1 },
  errorText: { color: COLORS.error, fontSize: FONT_SIZE.md },
  emptyText: { textAlign: 'center', color: COLORS.textMuted, marginTop: SPACING.xl },
});
