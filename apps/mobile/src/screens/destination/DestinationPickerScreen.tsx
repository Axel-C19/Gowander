import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { Destination } from '@gowander/shared-types';
import type { AppScreenNavigationProp } from '../../types/navigation';
import { useDestinations } from '../../hooks/usePlaces';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../constants';

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
      <TextInput
        style={styles.search}
        placeholder="Search destinations..."
        placeholderTextColor={COLORS.textMuted}
        value={search}
        onChangeText={setSearch}
        clearButtonMode="while-editing"
      />

      {isLoading ? (
        <ActivityIndicator style={styles.centered} color={COLORS.primary} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => handleSelect(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.cityName}>{item.city}</Text>
              <Text style={styles.country}>{item.country}</Text>
            </TouchableOpacity>
          )}
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
  search: {
    margin: SPACING.md,
    height: 48,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  list: { paddingHorizontal: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING.xl },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cityName: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.text },
  country: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginTop: 2 },
  errorText: { color: COLORS.error, fontSize: FONT_SIZE.md },
  emptyText: { textAlign: 'center', color: COLORS.textMuted, marginTop: SPACING.xl },
});
