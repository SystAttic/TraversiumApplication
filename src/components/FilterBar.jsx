import React from "react";
import { View, Pressable, ScrollView } from "react-native";
import { useTheme } from "../theme";
import { spacing } from "../theme/spacing";
import TText from "./TText";

export default function FilterBar({ filters, activeFilter, onFilterChange, horizontal = true }) {
  const { colors } = useTheme();

  const FilterItem = ({ filter }) => {
    const isActive = activeFilter === filter.key;
    return (
      <Pressable onPress={() => onFilterChange(filter.key)}>
        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.xs,
            borderRadius: 999,
            backgroundColor: isActive ? colors.accent.primary : colors.bg.layer2,
            borderWidth: 1,
            borderColor: isActive ? colors.accent.primary : colors.border,
            marginRight: spacing.sm,
          }}
        >
          <TText
            weight="medium"
            size="sm"
            style={{ color: isActive ? "#fff" : colors.text.primary }}
          >
            {filter.label}
          </TText>
        </View>
      </Pressable>
    );
  };

  if (horizontal) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: spacing.xl }}
      >
        <View style={{ flexDirection: "row" }}>
          {filters.map((filter, idx) => (
            <View key={filter.key} style={{ marginLeft: idx > 0 ? spacing.sm : 0 }}>
              <FilterItem filter={filter} />
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
      {filters.map((filter, idx) => (
        <View key={filter.key} style={{ marginRight: spacing.sm, marginBottom: spacing.sm }}>
          <FilterItem filter={filter} />
        </View>
      ))}
    </View>
  );
}

