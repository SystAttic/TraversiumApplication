import React from "react";
import { View, Image, Dimensions } from "react-native";
import { useTheme } from "../../theme";
import { LinearGradient } from "expo-linear-gradient";

export default function AuthBackground({ source, children }) {
  const { colors } = useTheme();
  const H = Math.round(Dimensions.get("window").height * 0.4);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.layer1 }}>
      {/* Top hero image */}
      <View style={{ height: H, overflow: "hidden" }}>
        <Image
          source={source}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
        {/* Smooth fade into background */}
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(0,0,0,0)", colors.bg.layer1]}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: -1,
            height: Math.max(80, Math.round(H * 0.45)),
          }}
        />
      </View>

      {/* Bottom solid color (auto) */}
      <View style={{ flex: 1 }} />

      {/* Overlay content */}
      <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}>
        {children}
      </View>
    </View>
  );
}
