// Kellerliste — Hauptscreen

import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { WineCard } from "@/components/ui/WineCard";
import { useWineStore } from "@/store/useWineStore";
import type { Wine, WineType } from "@vinotheque/core";

const TYPE_FILTERS: { value: WineType | "all"; label: string }[] = [
  { value: "all", label: "Alle" },
  { value: "rot", label: "Rot" },
  { value: "weiss", label: "Weiss" },
  { value: "rosé", label: "Rosé" },
  { value: "schaumwein", label: "Schaumwein" },
  { value: "dessert", label: "Dessert" },
];

export default function CellarScreen() {
  const { wines, loaded } = useWineStore();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<WineType | "all">("all");

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = wines.filter((wine) => {
    const matchesSearch =
      !normalizedSearch ||
      wine.name.toLowerCase().includes(normalizedSearch) ||
      wine.producer.toLowerCase().includes(normalizedSearch);
    const matchesType = typeFilter === "all" || wine.type === typeFilter;

    return matchesSearch && matchesType;
  });

  if (!loaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#8B1A1A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Wein oder Produzent suchen"
          placeholderTextColor="#9a8f8a"
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {TYPE_FILTERS.map((filter) => {
            const active = typeFilter === filter.value;
            return (
              <TouchableOpacity
                key={filter.value}
                style={[styles.filterButton, active && styles.filterButtonActive]}
                onPress={() => setTypeFilter(filter.value)}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(w) => w.id}
        renderItem={({ item }: { item: Wine }) => (
          <WineCard
            wine={item}
            onPress={() => router.push(`/wine/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {wines.length === 0 ? "Noch keine Weine im Keller." : "Keine passenden Weine gefunden."}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#faf8f5" },
  loading:   { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#faf8f5" },
  controls:  { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  searchInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e4ddd9",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: "#1a0500",
  },
  filterContent: { gap: 8, paddingTop: 12, paddingBottom: 4 },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#d8cfcb",
    backgroundColor: "#fff",
  },
  filterButtonActive: { backgroundColor: "#8B1A1A", borderColor: "#8B1A1A" },
  filterText: { fontSize: 13, fontWeight: "600", color: "#5f5550" },
  filterTextActive: { color: "#fff" },
  list:      { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  empty:     { textAlign: "center", color: "#aaa", marginTop: 60, fontSize: 15 },
});
