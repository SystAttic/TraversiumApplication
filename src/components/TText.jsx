import React from "react";
import { Text } from "react-native";
import { useTheme } from "../theme";

const sizeMap = { sm: 13, md: 15, lg: 17, xl: 22 };
const weightMap = { regular: "400", medium: "600", bold: "700" };

export default function TText({ dim, size = "md", weight = "regular", style, children, ...rest }) {
  const { colors } = useTheme();
  return (
    <Text
      {...rest}
      style={[
        {
          color: dim ? colors.text.muted : colors.text.primary,
          fontSize: sizeMap[size],
          fontWeight: weightMap[weight],
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
