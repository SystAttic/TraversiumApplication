import React, { useState } from "react";
import { View } from "react-native";
import Screen from "../../src/components/Screen";
import AppHeader from "../../src/components/AppHeader";
import Card from "../../src/components/Card";
import TText from "../../src/components/TText";
import Button from "../../src/components/Button";
import Input from "../../src/components/Input";
import StatusPill from "../../src/components/StatusPill";
import { spacing } from "../../src/theme/spacing";
import { useTheme } from "../../src/theme";
import { requestPasswordReset } from "../../src/auth/session";
import { useLoading } from "../../src/providers/LoadingProvider";

export default function Forgot() {
  const { colors } = useTheme();
  const { show, hide } = useLoading();

  const [email, setEmail] = useState("");
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);

  const submit = async () => {
    setErr(null);
    setResult(null);
    if (!email) {
      setErr("Please enter your email.");
      return;
    }
    show();
    try {
      const r = await requestPasswordReset(email);
      setResult(r);
    } catch (e) {
      setErr(e?.message || "Something went wrong.");
    } finally {
      hide();
    }
  };

  const hint = result?.strategy === "oauth"
    ? "This email is linked to a Google account. Please sign in with Google."
    : result?.strategy === "email"
    ? "If this email exists, we’ve sent reset instructions."
    : "If this email exists, we’ve sent instructions (or try Google sign-in).";

  return (
    <Screen>
      <AppHeader title="Forgot password" />
      <View style={{ padding: spacing.xl }}>
        <Card>
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          {err ? <TText style={{ color: colors?.danger || "#c33" }}>{err}</TText> : null}
          {result ? (
            <View style={{ marginTop: spacing.md }}>
              <StatusPill type="info" label="Request received" />
              <TText dim style={{ marginTop: spacing.sm }}>{hint}</TText>
            </View>
          ) : null}
          <Button title="Request reset" onPress={submit} style={{ marginTop: spacing.md }} />
        </Card>
      </View>
    </Screen>
  );
}
