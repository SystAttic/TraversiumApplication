import React, { useEffect, useState, useCallback } from "react";
import { View, ActivityIndicator, FlatList } from "react-native";
import TText from "../TText";
import { spacing } from "../../theme/spacing";
import { useTheme } from "../../theme";
import { fetchTripActivity } from "../../data/trips";
import Ionicons from "@expo/vector-icons/Ionicons";

function Row({ item, colors }) {
  const icon =
    item.level === "error" ? "alert-circle" :
    item.level === "warning" ? "warning" : "information-circle";

  const tint =
    item.level === "error" ? "#d9534f" :
    item.level === "warning" ? "#f0ad4e" : colors.text.muted;

  return (
    <View style={{ flexDirection: "row", gap: spacing.md, alignItems: "flex-start", paddingVertical: 8 }}>
      <Ionicons name={icon} size={18} color={tint} />
      <View style={{ flex: 1 }}>
        <TText>{item.text}</TText>
        <TText size="sm" dim style={{ marginTop: 2 }}>
          {new Date(item.time).toLocaleString()}
        </TText>
      </View>
    </View>
  );
}

export default function TripActivity({ tripId, enabled }) {
  const { colors } = useTheme();
  const [page, setPage] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(async (p) => {
    const res = await fetchTripActivity(tripId, { page: p, pageSize: 20 });
    setItems(prev => p===0 ? res.items : [...prev, ...res.items]);
    setHasMore(res.hasMore);
    setLoading(false);
    setLoadingMore(false);
  }, [tripId]);

  useEffect(() => {
    if (enabled) {
      setLoading(true);
      setPage(0);
      load(0);
    }
  }, [enabled, load]);

  if (!enabled) return null;
  if (loading) {
    return (
      <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(it) => it.id}
      contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, paddingTop: spacing.md }}
      renderItem={({ item }) => <Row item={item} colors={colors} />}
      ItemSeparatorComponent={() => (
        <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 26 }} />
      )}
      onEndReachedThreshold={0.3}
      onEndReached={() => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        const next = page + 1;
        setPage(next);
        load(next);
      }}
      ListFooterComponent={
        loadingMore ? (
          <View style={{ paddingVertical: spacing.md }}>
            <ActivityIndicator />
          </View>
        ) : null
      }
      ListEmptyComponent={() => <TText dim style={{ padding: spacing.xl }}>No activity yet.</TText>}
    />
  );
}
