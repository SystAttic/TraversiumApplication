import React, { useState } from "react";
import { View, TextInput, Pressable, ActivityIndicator } from "react-native";
import { router, Link } from "expo-router";
import { useTheme } from "../../src/theme";
import { spacing } from "../../src/theme/spacing";
import TText from "../../src/components/TText";
import AuthBackground from "../../src/components/auth/AuthBackground";
import AuthCard from "../../src/components/auth/AuthCard";
import { auth, sendPasswordResetEmail } from "../../src/services/firebase";
import { LinearGradient } from "expo-linear-gradient";

export default function ForgotScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const onSend = async () => {
    setError(""); setMsg("");
    if (!email) { setError("Enter your email first"); return; }
    try {
      setBusy(true);
      await sendPasswordResetEmail(auth, email.trim());
      setMsg("Reset link sent. Check your inbox.");
    } catch (e) {
      setError(e.message || "Failed to send reset email");
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
              <TText weight="bold" style={{ fontSize: 22 }}>Reset your password</TText>
              <TText dim size="sm">We'll email you a link to reset it</TText>
            </View>
          </View>

          {/* Middle content - Email input centered */}
          <View style={{ flex: 1, justifyContent: "center", gap: spacing.md }}>
            {!!msg && <TText style={{ color: colors.status.success }} size="sm" textAlign="center">{msg}</TText>}
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

            <Pressable onPress={onSend} disabled={busy} style={{ borderRadius: 14, overflow: "hidden" }}>
              <LinearGradient
                colors={[colors.accent.primary, colors.accent.primary]}
                style={{ padding: 14, alignItems: "center" }}
              >
                {busy ? <ActivityIndicator color="#fff" /> : <TText style={{ color: "#fff" }}>Send reset link</TText>}
              </LinearGradient>
            </Pressable>
          </View>

          {/* Bottom buttons */}
          <View style={{ gap: spacing.sm }}>
            <Pressable onPress={() => router.back()} style={{ alignItems:"center" }}>
              <TText dim>Back to login</TText>
            </Pressable>

            <Link href="/(auth)/register" asChild>
              <Pressable style={{ alignItems:"center", marginTop: spacing.xs }}>
                <TText dim>Create an account</TText>
              </Pressable>
            </Link>
          </View>
        </View>
      </AuthCard>

      <View style={{ alignItems:"center", marginTop: spacing.lg }}>
        <TText dim size="sm">© {new Date().getFullYear()} Traversium</TText>
      </View>
    </AuthBackground>
  );
}
