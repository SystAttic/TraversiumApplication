// src/components/trips/MomentCard.jsx
import React from "react";
import { View, Image, FlatList, Pressable } from "react-native";
import Card from "../Card";
import TText from "../TText";
import { spacing } from "../../theme/spacing";
import { useTheme } from "../../theme";

export default function MomentCard({ moment, mediaById = {}, onOpen }) {
  const { colors } = useTheme();
  const strip = (moment.mediaIds || []).slice(0, 12).map(id => mediaById[id]).filter(Boolean);

  return (
    <Card style={{ overflow: "hidden" }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm }}>
        <View style={{ flex: 1, paddingRight: spacing.md }}>
          <TText weight="bold">{moment.title}</TText>
          {!!moment.description && <TText dim size="sm">{moment.description}</TText>}
        </View>
        <Pressable
          onPress={() => onOpen?.(moment)}
          style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.border }}
        >
          <TText size="sm">Open</TText>
        </Pressable>
      </View>

      <FlatList
        horizontal
        data={strip}
        keyExtractor={(m, i) => m.id || `mm-${i}`}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item.uri }}
            style={{ width: 120, height: 90, borderRadius: 10, backgroundColor: colors.bg.layer3 }}
          />
        )}
      />

      <TText dim size="sm" style={{ marginTop: spacing.sm }}>
        {moment.mediaIds?.length || 0} items
      </TText>
    </Card>
  );
}
