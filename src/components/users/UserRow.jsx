// src/components/users/UserRow.jsx
import React, { memo } from "react";
import { View, Image, Pressable } from "react-native";
import Card from "../Card";
import TText from "../TText";
import Button from "../Button";
import { spacing } from "../../theme/spacing";
import { useTheme } from "../../theme";

function UserRowBase({
  user,
  rightKind = "follow", // "follow" | "unblock" | "none"
  onPress,
  onFollowToggle,
  onUnblock,
}) {
  const { colors } = useTheme();
  const avatar = user?.avatar || "https://i.pravatar.cc/150?img=8";
  const name = user?.displayName || user?.name || user?.username || "User";

  return (
    <Card style={{ padding: spacing.md }}>
      <Pressable onPress={() => onPress?.(user)} style={{ flexDirection: "row", alignItems: "center" }}>
        <Image
          source={{ uri: avatar }}
          style={{ width: 44, height: 44, borderRadius: 999, marginRight: spacing.md }}
        />
        <View style={{ flex: 1 }}>
          <TText weight="medium">{name}</TText>
          {!!user?.username && <TText size="sm" dim>@{user.username}</TText>}
        </View>

        {rightKind === "follow" ? (
          <Button
            title={user?.isFollowing ? "Following" : "Follow"}
            variant={user?.isFollowing ? "outline" : "solid"}
            onPress={() => onFollowToggle?.(user)}
          />
        ) : rightKind === "unblock" ? (
          <Button title="Unblock" variant="outline" onPress={() => onUnblock?.(user)} />
        ) : null}
      </Pressable>
    </Card>
  );
}

export default memo(UserRowBase);
