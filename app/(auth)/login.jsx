import React, { useState } from "react";
import { View, Pressable } from "react-native";
import Screen from "../../src/components/Screen";
import AppHeader from "../../src/components/AppHeader";
import Card from "../../src/components/Card";
import TText from "../../src/components/TText";
import Button from "../../src/components/Button";
import Input from "../../src/components/Input";
import { spacing } from "../../src/theme/spacing";
import { useTheme } from "../../src/theme";
import { router, Link } from "expo-router";
import { signInWithPassword, signInWithGoogle } from "../../src/auth/session";
import { useLoading } from "../../src/providers/LoadingProvider";

export default function Login() {
  const { colors } = useTheme();
  const { show, hide } = useLoading();

  const [id, setId] = useState(""); // username or email
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(null);

  const onLogin = async () => {
    setErr(null);
    if (!id || !pw) {
      setErr("Please enter your username/email and password.");
      return;
    }
    show();
    try {
      await signInWithPassword({ usernameOrEmail: id, password: pw });
      router.replace("/(tabs)");
    } catch (e) {
      setErr(e?.message || "Login failed.");
    } finally {
      hide();
    }
  };

  const onGoogle = async () => {
    setErr(null);
    show();
    try {
      const { profile } = await signInWithGoogle();
      // If no username yet, redirect user to register screen to choose username/displayName
      if (!profile?.username) {
        router.replace({ pathname: "/(auth)/register", params: { from: "google" } });
      } else {
        router.replace("/(tabs)");
      }
    } catch (e) {
      setErr(e?.message || "Google sign-in failed.");
    } finally {
      hide();
    }
  };

  return (
    <Screen>
      <AppHeader title="Sign in" />
      <View style={{ padding: spacing.xl, gap: spacing.lg }}>
        <Card>
          <Input
            label="Username or Email"
            placeholder="ozbej or you@example.com"
            value={id}
            onChangeText={setId}
          />
          <Input
            label="Password"
            placeholder="Your password"
            value={pw}
            onChangeText={setPw}
            secureTextEntry
          />
          {err ? <TText style={{ color: colors?.danger || "#c33" }}>{err}</TText> : null}
          <Button title="Sign in" onPress={onLogin} style={{ marginTop: spacing.md }} />
          <Button title="Continue with Google" variant="outline" onPress={onGoogle} style={{ marginTop: spacing.sm }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md }}>
            <Link href="/(auth)/register" asChild>
              <Pressable><TText dim>Create account</TText></Pressable>
            </Link>
            <Link href="/(auth)/forgot" asChild>
              <Pressable><TText dim>Forgot password?</TText></Pressable>
            </Link>
          </View>
        </Card>
      </View>
    </Screen>
  );
}
