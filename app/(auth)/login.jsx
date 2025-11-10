import React, { useState } from "react";
import { View, TextInput, Pressable, ActivityIndicator } from "react-native";
import { Link, router } from "expo-router";
import { useTheme } from "../../src/theme";
import { spacing } from "../../src/theme/spacing";
import TText from "../../src/components/TText";
import AuthBackground from "../../src/components/auth/AuthBackground";
import AuthCard from "../../src/components/auth/AuthCard";
import { LinearGradient } from "expo-linear-gradient";
import {
  auth,
  signInWithEmailAndPassword,
} from "../../src/services/firebase";
import { saveFirebaseSession } from "../../src/auth/firebaseSession";

export default function LoginScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onLogin = async () => {
    setError("");
    if (!email || !password) { setError("Please enter email and password"); return; }
    try {
      setBusy(true);
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      await saveFirebaseSession(cred.user);
      router.replace("/");
    } catch (e) {
      setError(e.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthBackground source={require("../../assets/auth_header.jpg")}>
      <View style={{ alignItems: "center", marginTop: 54 }}>
        <TText weight="bold" style={{ fontSize: 28, letterSpacing: 2 }}>TRAVERSIUM</TText>
      </View>

      <AuthCard style={{ marginTop: 24 }}>
        <View style={{ flex: 1, justifyContent: "space-between" }}>
          {/* Top content */}
          <View>
            <View style={{ gap: 6, marginBottom: spacing.lg, alignItems: "center" }}>
              <TText weight="bold" style={{ fontSize: 22 }}>Welcome back</TText>
              <TText dim size="sm">Sign in to continue your journey</TText>
            </View>
          </View>

          {/* Middle content - Inputs centered */}
          <View style={{ flex: 1, justifyContent: "center", gap: spacing.md }}>
            {!!error && <TText style={{ color: colors.status.danger }} size="sm" textAlign="center">{error}</TText>}
            
            <TextInput
              placeholder="Email"
              placeholderTextColor={colors.text.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              style={{ borderWidth:1, borderColor: colors.border, borderRadius: 12, padding: 12, color: colors.text.primary }}
            />
            <TextInput
              placeholder="Password"
              placeholderTextColor={colors.text.muted}
              autoCapitalize="none"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={{ borderWidth:1, borderColor: colors.border, borderRadius: 12, padding: 12, color: colors.text.primary }}
            />
          </View>

          {/* Bottom buttons */}
          <View style={{ gap: spacing.sm }}>
            <Pressable onPress={onLogin} disabled={busy} style={{ borderRadius: 14, overflow: "hidden" }}>
              <LinearGradient
                colors={[colors.accent.primary, colors.accent.primary]}
                style={{ padding: 14, alignItems: "center" }}
              >
                {busy ? <ActivityIndicator color="#fff" /> : <TText style={{ color: "#fff" }}>Sign in</TText>}
              </LinearGradient>
            </Pressable>

            <View style={{ flexDirection: "row", justifyContent:"space-between" }}>
              <Link href="/(auth)/forgot" asChild>
                <Pressable><TText dim>Forgot password?</TText></Pressable>
              </Link>
              <Link href="/(auth)/register" asChild>
                <Pressable><TText dim>Create an account?</TText></Pressable>
              </Link>
            </View>
          </View>
        </View>
      </AuthCard>

      <View style={{ alignItems:"center", marginTop: spacing.lg }}>
        <TText dim size="sm">© {new Date().getFullYear()} Traversium</TText>
      </View>
    </AuthBackground>
  );
}
