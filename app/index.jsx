import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Image } from "react-native";
import { router } from "expo-router";
import Screen from "../src/components/Screen";
import { useTheme } from "../src/theme";
import TText from "../src/components/TText";
import { spacing } from "../src/theme/spacing";
import { getSession } from "../src/auth/session";
import { auth, onAuthStateChanged } from "../src/services/firebase";
import { saveFirebaseSession, clearSavedSession } from "../src/auth/firebaseSession";

export default function Gate() {
  const { colors } = useTheme();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let unsub = null;
    let mounted = true;
    // Prefer Firebase auth state; also keep SecureStore token in sync for other consumers
    unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!mounted) return;
        if (user) {
          await saveFirebaseSession(user);
          router.replace("/(tabs)");
        } else {
          await clearSavedSession();
          // No active session → go to Welcome
          router.replace("/(auth)/welcome");
        }
      } finally {
        if (mounted) setChecking(false);
      }
    });
    return () => {
      mounted = false;
      if (unsub) unsub();
    };
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
