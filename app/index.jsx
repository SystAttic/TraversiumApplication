import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Image } from "react-native";
import { router } from "expo-router";
import Screen from "../src/components/Screen";
import { useTheme } from "../src/theme";
import TText from "../src/components/TText";
import { spacing } from "../src/theme/spacing";
import { getSession } from "../src/auth/session";

export default function Gate() {
  const { colors } = useTheme();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let m = true;
    (async () => {
      try {
        const session = await getSession();
        //await new Promise((res) => setTimeout(res, 1000));
        if (!m) return;
        if (session?.token) {
          router.replace("/(tabs)");      // go to app
        } else {
          router.replace("/(auth)/login"); // go to auth
        }
      } finally {
        if (m) setChecking(false);
      }
    })();
    return () => (m = false);
  }, []);

  // Branded splash
  return (
    <Screen>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.lg }}>
        <Image source={require("../assets/icon.png")} style={{ width: 96, height: 96, borderRadius: 22 }} />
        <TText weight="bold" size="lg">Traversium</TText>
        <ActivityIndicator />
        <TText dim>Preparing your world…</TText>
      </View>
    </Screen>
  );
}
