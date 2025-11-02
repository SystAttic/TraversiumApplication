import React, { useState } from "react";
import { View } from "react-native";
import Screen from "../../src/components/Screen";
import AppHeader from "../../src/components/AppHeader";
import Card from "../../src/components/Card";
import TText from "../../src/components/TText";
import Button from "../../src/components/Button";
import Input from "../../src/components/Input";
import { spacing } from "../../src/theme/spacing";
import { useTheme } from "../../src/theme";
import { router, useLocalSearchParams } from "expo-router";
import { completeGoogleSetUsername, registerUser } from "../../src/auth/session";
import { useLoading } from "../../src/providers/LoadingProvider";

const isEmail = (s) => /\S+@\S+\.\S+/.test(String(s));

export default function Register() {
  const { colors } = useTheme();
  const { from } = useLocalSearchParams(); // if we came from google
  const { show, hide } = useLoading();

  const googleFlow = String(from || "") === "google";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [dob, setDob]             = useState(""); // YYYY-MM-DD (free text for now)
  const [email, setEmail]         = useState("");
  const [username, setUsername]   = useState("");
  const [displayName, setDisplay] = useState("");
  const [pw, setPw]               = useState("");
  const [pw2, setPw2]             = useState("");
  const [err, setErr]             = useState(null);

  const onSubmit = async () => {
    setErr(null);
    // Validation (client-side basic; server will do real checks)
    if (!username) return setErr("Please choose a username.");
    if (!displayName) return setErr("Please choose a display name.");
    if (!isEmail(email) && !googleFlow) return setErr("Please enter a valid email.");
    if (!googleFlow) {
      if (!pw) return setErr("Please enter a password.");
      if (pw !== pw2) return setErr("Passwords do not match.");
    }

    show();
    try {
      if (googleFlow) {
        await completeGoogleSetUsername({ username, displayName });
        router.replace("/(tabs)");
      } else {
        await registerUser({
          firstName,
          lastName,
          dob,
          email,
          username,
          displayName,
          password: pw,
          provider: "password",
        });
        router.replace("/(tabs)");
      }
    } catch (e) {
      setErr(e?.message || "Registration failed.");
    } finally {
      hide();
    }
  };

  return (
    <Screen>
      <AppHeader title={googleFlow ? "Complete your profile" : "Create account"} />
      <View style={{ padding: spacing.xl, gap: spacing.lg }}>
        <Card>
          {!googleFlow && (
            <>
              <Input label="First name" value={firstName} onChangeText={setFirstName} />
              <Input label="Last name" value={lastName} onChangeText={setLastName} />
              <Input label="Date of birth" placeholder="YYYY-MM-DD" value={dob} onChangeText={setDob} />
              <Input label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
            </>
          )}

          <Input label="Username" placeholder="your handle" value={username} onChangeText={setUsername} autoCapitalize="none" />
          <Input label="Display name" placeholder="How others see you" value={displayName} onChangeText={setDisplay} />

          {!googleFlow && (
            <>
              <Input label="Password" value={pw} onChangeText={setPw} secureTextEntry />
              <Input label="Confirm password" value={pw2} onChangeText={setPw2} secureTextEntry />
            </>
          )}

          {err ? <TText style={{ color: colors?.danger || "#c33" }}>{err}</TText> : null}
          <Button title={googleFlow ? "Save" : "Create account"} onPress={onSubmit} style={{ marginTop: spacing.md }} />
        </Card>
      </View>
    </Screen>
  );
}
