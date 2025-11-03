import React, { memo } from "react";
import { View, Pressable } from "react-native";
import Card from "./Card";
import TText from "./TText";
import { useTheme } from "../theme";
import { spacing, radii } from "../theme/spacing";
import Ionicons from "@expo/vector-icons/Ionicons";

function timeAgo(ts) {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

function NotificationItemBase({ item, onPress }) {
  const { colors } = useTheme();

  return (
    <Pressable onPress={() => onPress?.(item)}>
      <Card
        style={{
          padding: spacing.md,
          backgroundColor: item.read ? colors.bg.layer1 : colors.bg.layer2,
          borderColor: item.read ? colors.border : colors.accent.muted || colors.border,
        }}
      >
        <View style={{ flexDirection: "row", gap: spacing.md, alignItems: "flex-start" }}>
          <View
            style={{
              width: 36, height: 36, borderRadius: 999,
              backgroundColor: colors.bg.layer3,
              alignItems: "center", justifyContent: "center",
              borderWidth: 1, borderColor: colors.border,
            }}
          >
            <Ionicons
              name={
                item.type === "like" ? "heart" :
                item.type === "comment" ? "chatbubble-ellipses" :
                item.type === "follow" ? "person-add" : "information-circle"
              }
              size={18}
              color={colors.accent?.primary || colors.text.primary}
            />
          </View>

          <View style={{ flex: 1 }}>
            <TText weight="medium">{item.title}</TText>
            {item.body ? <TText dim style={{ marginTop: 2 }}>{item.body}</TText> : null}
            <TText size="sm" dim style={{ marginTop: 6 }}>{timeAgo(item.createdAt)}</TText>
          </View>

          {!item.read ? (
            <View
              style={{
                width: 8, height: 8, borderRadius: 999,
                backgroundColor: colors.accent?.primary || colors.text.primary,
                marginTop: 6,
              }}
            />
          ) : (
            <View style={{ width: 8 }} />
          )}
        </View>
      </Card>
    </Pressable>
  );
}

export default memo(NotificationItemBase);
