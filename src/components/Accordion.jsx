import React, { useState } from "react";
import { View, Pressable } from "react-native";
import Card from "./Card";
import TText from "./TText";
import Ionicons from "@expo/vector-icons/Ionicons";
import { spacing } from "../theme/spacing";
import { useTheme } from "../theme";

export default function Accordion({ items = [] }) {
  const [open, setOpen] = useState({});
  const { colors } = useTheme();

  return (
    <View style={{ gap: spacing.sm }}>
      {items.map((it, idx) => {
        const isOpen = !!open[idx];
        return (
          <Card key={idx}>
            <Pressable
              onPress={() => setOpen((o) => ({ ...o, [idx]: !o[idx] }))}
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
            >
              <TText weight="medium">{it.title}</TText>
              <Ionicons
                name={isOpen ? "chevron-up" : "chevron-down"}
                size={18}
                color={colors.text.muted}
              />
            </Pressable>
            {isOpen ? <TText dim style={{ marginTop: spacing.sm }}>{it.content}</TText> : null}
          </Card>
        );
      })}
    </View>
  );
}
