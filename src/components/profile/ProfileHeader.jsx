import React from "react";
import { View, Image, Pressable } from "react-native";
import { useTheme } from "../../theme";
import TText from "../TText";
import Card from "../Card";
import Divider from "../Divider";
import { spacing, radii } from "../../theme/spacing";
import Ionicons from "@expo/vector-icons/Ionicons";

function RowAction({ icon, label, onPress }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ alignItems: "center", flex: 1 }}>
      <View
        style={{
          width: 44, height: 44, borderRadius: 999,
          backgroundColor: colors.bg.layer2, borderWidth: 1, borderColor: colors.border,
          alignItems: "center", justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={22} color={colors.text.primary} />
      </View>
      <TText size="sm" dim style={{ marginTop: 6 }}>{label}</TText>
    </Pressable>
  );
}

export default function ProfileHeader({
  cover,
  avatar,
  name,
  username,
  description,
  isOwner = false,
  isFollowing = false,
  isBlocked = false,
  onToggleFollow,
  onToggleBlock,
  onReport,
  onEdit,
}) {
  const { colors } = useTheme();

  const displayName = name || (username ? `@${username}` : "User");
  const handle = username ? `@${username}` : "";

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      {/* Cover */}
      <View style={{ width: "100%", height: 160, backgroundColor: colors.bg.layer2 }}>
        <Image
          source={cover ? { uri: cover } : require("../../../assets/cover-default.jpg")}
          style={{ width: "100%", height: "100%" }}
        />
      </View>

      {/* Avatar overlay */}
      <View style={{ alignItems: "center" }}>
        <View
          style={{
            marginTop: -40,
            width: 96, height: 96, borderRadius: 999, overflow: "hidden",
            borderWidth: 3, borderColor: colors.bg.layer1, backgroundColor: colors.bg.layer1,
          }}
        >
          <Image
            source={avatar ? { uri: avatar } : require("../../../assets/profile-default.jpg")}
            style={{ width: "100%", height: "100%" }}
          />
        </View>
      </View>

      {/* Identity */}
      <View style={{ alignItems: "center", padding: spacing.md, paddingBottom: spacing.sm }}>
        <TText weight="bold" size="lg">{displayName}</TText>
        {handle ? <TText dim>{handle}</TText> : null}
      </View>

      {/* Description block */}
      <View
        style={{
          marginHorizontal: spacing.md,
          marginBottom: spacing.md,
          backgroundColor: colors.bg.layer2,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radii.lg,
          padding: spacing.md,
        }}
      >
        <TText dim>{description || "No description yet."}</TText>
      </View>

      {/* Actions */}
      <Divider />
      <View style={{ padding: spacing.md }}>
        {isOwner ? (
          <View style={{ alignItems: "center" }}>
            <Pressable
              onPress={onEdit}
              style={{
                flexDirection: "row", gap: 8,
                backgroundColor: colors.bg.layer2, borderWidth: 1, borderColor: colors.border,
                borderRadius: radii.lg, paddingHorizontal: spacing.lg, paddingVertical: 8,
              }}
            >
              <Ionicons name="pencil" size={18} color={colors.text.primary} />
              <TText>Edit profile</TText>
            </Pressable>
          </View>
        ) : (
          <View style={{ flexDirection: "row", gap: spacing.lg }}>
            <RowAction
              icon={isFollowing ? "person-remove" : "person-add"}
              label={isFollowing ? "Unfollow" : "Follow"}
              onPress={onToggleFollow}
            />
            <RowAction
              icon={isBlocked ? "ban" : "hand-left"}
              label={isBlocked ? "Unblock" : "Block"}
              onPress={onToggleBlock}
            />
            <RowAction icon="flag" label="Report" onPress={onReport} />
          </View>
        )}
      </View>
    </Card>
  );
}
