// app/notifications.jsx
import React, { useEffect, useState, useCallback } from "react";
import { View, ActivityIndicator, FlatList, Alert } from "react-native";
import Screen from "../src/components/Screen";
import AppHeader from "../src/components/AppHeader";
import TText from "../src/components/TText";
import Button from "../src/components/Button";
import NotificationItem from "../src/components/NotificationItem";
import { spacing } from "../src/theme/spacing";
import { useTheme } from "../src/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  fetchNotifications,
  clearAllNotifications,
} from "../src/data/notifications";
import { useNotifications } from "../src/contexts/NotificationContext";

const PAGE_SIZE = 10;
const FOOTER_HEIGHT = 64; // visual height of the bottom bar (excluding safe-area)

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { refreshCount } = useNotifications();

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Load a specific page explicitly to avoid race conditions & duplicate keys
  const loadPage = useCallback(async (targetPage) => {
    const isFirst = targetPage === 0;
    if (isFirst) {
      setLoading(true);
    }
    const res = await fetchNotifications({ page: targetPage, pageSize: PAGE_SIZE });
    setItems((prev) => (isFirst ? res.items : [...prev, ...res.items]));
    setHasMore(res.hasMore);
    setPage(targetPage);
    setLoading(false);
    setLoadingMore(false);
    
    // Refresh count after loading notifications (especially after page 0 which marks them as seen)
    if (isFirst) {
      refreshCount().catch(() => {});
    }
  }, [refreshCount]);

  useEffect(() => {
    loadPage(0);
  }, [loadPage]);

  const onEndReached = async () => {
    if (!hasMore || loading || loadingMore) return;
    setLoadingMore(true);
    const next = page + 1;
    await loadPage(next); // <-- pass the explicit next page
  };

  const onPressItem = (n) => {
    if (n?.route) router.push(n.route);
  };

  const clearAll = () => {
    Alert.alert("Clear notifications?", "This will remove all notifications.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          await clearAllNotifications();
          setItems([]);
          setHasMore(false);
          router.back();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <Screen>
        <AppHeader title="Notifications" showBell={false} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
          <TText dim style={{ marginTop: spacing.md }}>Loading…</TText>
        </View>
      </Screen>
    );
  }

  if (!items?.length) {
    return (
      <Screen>
        <AppHeader title="Notifications" showBell={false} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
          <TText dim>You have no notifications.</TText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="Notifications" showBell={false} />

      {/* Scrollable list area */}
      <View style={{ flex: 1 }}>
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id)}  // ✅ stable unique key
          renderItem={({ item }) => <NotificationItem item={item} onPress={onPressItem} />}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          contentContainerStyle={{
            padding: spacing.xl,
            // add bottom gap so last item doesn't sit under the fixed footer
            paddingBottom: FOOTER_HEIGHT + insets.bottom + spacing.md,
          }}
          onEndReachedThreshold={0.3}
          onEndReached={onEndReached}
          ListFooterComponent={
            loadingMore && hasMore ? (
              <View style={{ paddingVertical: spacing.md }}>
                <ActivityIndicator />
              </View>
            ) : null
          }
        />
      </View>

      {/* Fixed footer with safe-area padding */}
      <View
        style={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom + spacing.sm, // ✅ safe bottom
          height: FOOTER_HEIGHT + insets.bottom,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.bg.layer1,
          justifyContent: "center",
        }}
      >
        <Button title="Clear notifications" variant="outline" onPress={clearAll} />
      </View>
    </Screen>
  );
}
