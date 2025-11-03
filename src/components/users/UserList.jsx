import React from "react";
import { View, FlatList } from "react-native";
import UserRow from "./UserRow";
import { spacing } from "../../theme/spacing";

export default function UserList({
  data = [],
  kind = "followers", // "followers" | "following" | "blocked"
  onItemPress,
  onFollowToggle,
  onUnblock,
  ListEmptyComponent,
}) {
  return (
    <FlatList
      data={data}
      keyExtractor={(item, i) => item?.id?.toString?.() || item?.username || `u-${i}`}
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      ListEmptyComponent={ListEmptyComponent}
      renderItem={({ item }) => (
        <UserRow
          user={item}
          onPress={() => onItemPress?.(item)}
          onFollowToggle={() => onFollowToggle?.(item)}
          onUnblock={() => onUnblock?.(item)}
          rightKind={kind === "blocked" ? "unblock" : "follow"}
        />
      )}
      contentContainerStyle={{ padding: spacing.xl, gap: spacing.sm, paddingBottom: spacing.xl }}
    />
  );
}
