import React, { useState } from "react";
import { View, FlatList, TextInput, Pressable } from "react-native";
import { useTheme } from "../../theme";
import { spacing, radii } from "../../theme/spacing";
import TText from "../TText";
import Ionicons from "@expo/vector-icons/Ionicons";

function CommentRow({ item, onReply }) {
  return (
    <View style={{ paddingVertical: 8 }}>
      <TText weight="bold">{item.author}</TText>
      <TText>{item.text}</TText>
      <View style={{ flexDirection: "row", gap: 16, marginTop: 6 }}>
        <TText dim size="sm">{new Date(item.time).toLocaleString()}</TText>
        <Pressable onPress={() => onReply?.(item)}>
          <TText size="sm">Reply</TText>
        </Pressable>
      </View>

      {/* replies */}
      {(item.replies || []).map((r) => (
        <View key={r.id} style={{ marginTop: 8, paddingLeft: 14, borderLeftWidth: 1, borderLeftColor: "#ccc" }}>
          <TText weight="bold">{r.author}</TText>
          <TText>{r.text}</TText>
          <TText dim size="sm" style={{ marginTop: 4 }}>{new Date(r.time).toLocaleString()}</TText>
        </View>
      ))}
    </View>
  );
}

export default function CommentThread({ data = [], onSubmit }) {
  const { colors } = useTheme();
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit?.(trimmed, replyTo);
    setText("");
    setReplyTo(null);
  };

  return (
    <View style={{ paddingHorizontal: spacing.xl }}>
      <FlatList
        data={data}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => <CommentRow item={item} onReply={setReplyTo} />}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.border }} />}
        contentContainerStyle={{ paddingVertical: spacing.md }}
        ListEmptyComponent={() => <TText dim>No comments yet.</TText>}
      />

      {/* composer */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingVertical: spacing.sm,
        }}
      >
        <View style={{ flex: 1, backgroundColor: colors.bg.layer2, borderRadius: radii.lg, paddingHorizontal: 12, paddingVertical: 8 }}>
          {!!replyTo && (
            <TText size="xs" dim numberOfLines={1}>
              Replying to {replyTo.author} — tap send to confirm
            </TText>
          )}
          <TextInput
            placeholder="Write a comment…"
            placeholderTextColor={colors.text.muted}
            value={text}
            onChangeText={setText}
            style={{ color: colors.text.primary, paddingTop: 2 }}
            multiline
          />
        </View>
        <Pressable onPress={submit} hitSlop={8}>
          <Ionicons name="send" size={20} color={colors.accent?.primary || colors.text.primary} />
        </Pressable>
      </View>
    </View>
  );
}
