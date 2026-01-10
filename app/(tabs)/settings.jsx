// app/(tabs)/settings.jsx
import React, {useState} from "react";
import { View, Pressable, Platform, ScrollView } from "react-native";
import Screen from "../../src/components/Screen";
import AppHeader from "../../src/components/AppHeader";
import Card from "../../src/components/Card";
import TText from "../../src/components/TText";
import Button from "../../src/components/Button";
import { useTheme } from "../../src/theme";
import { spacing, radii } from "../../src/theme/spacing";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import Constants from "expo-constants";
import { useTranslation } from "react-i18next";
import { useLocale } from "../../src/providers/LocaleProvider";
import ModalConfirm from "../../src/components/ModalConfirm";

// --- small helpers ---
function getAppVersion() {
  // Defensive: try multiple places depending on build/dev
  const cfg = Constants?.expoConfig || {};
  return cfg.version || cfg.runtimeVersion || Constants?.nativeAppVersion || "dev";
}

function Row({ icon, title, subtitle, onPress, right }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          paddingVertical: spacing.md,
        }}
      >
        {icon ? (
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.bg.layer2,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name={icon} size={18} color={colors.text.primary} />
          </View>
        ) : null}

        <View style={{ flex: 1 }}>
          <TText weight="medium">{title}</TText>
          {subtitle ? <TText size="sm" dim style={{ marginTop: 2 }}>{subtitle}</TText> : null}
        </View>

        {right ? right : <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />}
      </View>
    </Pressable>
  );
}

function Segmented({ options, value, onChange }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.bg.layer2,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 4,
      }}
    >
      {options.map((opt, i) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange?.(opt.value)}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: radii.lg,
              alignItems: "center",
              backgroundColor: active ? colors.bg.layer1 : "transparent",
              borderWidth: active ? 1 : 0,
              borderColor: active ? colors.accent.primary : "transparent",
              marginLeft: i === 0 ? 0 : 4,
            }}
          >
            <TText weight={active ? "bold" : "regular"}>{opt.label}</TText>
          </Pressable>
        );
      })}
    </View>
  );
}

// --- main screen ---
export default function SettingsScreen() {
  const { t } = useTranslation();
  const { colors, mode, setMode, isDark } = useTheme();
  const { lang, setLang } = useLocale();
  const [signOutVisible, setSignOutVisible] = useState(false);

  return (
    <Screen>
      <AppHeader title={t("tabs.settings")} />
      <ScrollView>
        <View style={{ padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xl }}>
          {/* Profile Settings */}
          <Card>
            <TText weight="bold" size="lg" style={{ marginBottom: spacing.sm }}>
              {t("profileSettings", { defaultValue: "Profile Settings" })}
            </TText>

            <Row
              icon="person-circle"
              title={t("settings.editProfile", { defaultValue: "Edit Profile Information" })}
              onPress={() => router.push("/settings/edit-profile")}
            />
            <Row
              icon="qr-code"
              title={t("settings.myQRCode", { defaultValue: "Show My QR Code" })}
              onPress={() => router.push("/settings/my-qr-code")}
            />
            <Row
              icon="card"
              title={t("settings.payments", { defaultValue: "Payments and Subscriptions" })}
              onPress={() => router.push("/settings/payments")}
            />
            <Row
              icon="people"
              title={t("settings.followers", { defaultValue: "Followers user list" })}
              onPress={() => router.push("/settings/followers")}
            />
            <Row
              icon="person-add"
              title={t("settings.following", { defaultValue: "Following user list" })}
              onPress={() => router.push("/settings/following")}
            />
            <Row
              icon="ban"
              title={t("settings.blocked", { defaultValue: "Blocked user list" })}
              onPress={() => router.push("/settings/blocked")}
            />
          </Card>

          {/* App Settings */}
          <Card>
            <TText weight="bold" size="lg" style={{ marginBottom: spacing.md }}>
              {t("appSettings", { defaultValue: "App Settings" })}
            </TText>

            {/* Theme */}
            <TText dim style={{ marginBottom: spacing.sm }}>
              {t("settings.theme", { defaultValue: "Change the theme" })} · {t("current", { defaultValue: "Current" })}: {mode.toUpperCase()} ({isDark ? "dark" : "light"})
            </TText>
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { label: t("system", { defaultValue: "System" }), value: "system" },
                { label: t("light", { defaultValue: "Light" }), value: "light" },
                { label: t("dark", { defaultValue: "Dark" }), value: "dark" },
              ]}
            />

            {/* Language */}
            <View style={{ height: spacing.md }} />
            <TText dim style={{ marginBottom: spacing.sm }}>
              {t("settings.language", { defaultValue: "Change language" })} · {t("current", { defaultValue: "Current" })}: {lang.toUpperCase()}
            </TText>
            <Segmented
              value={lang}
              onChange={setLang}
              options={[
                { label: t("settings.english", { defaultValue: "English" }), value: "en" },
                { label: t("settings.slovene", { defaultValue: "Slovenian" }), value: "sl" },
              ]}
            />

            {/* (Optional) Notifications placeholder you can wire later */}
            <View style={{ height: spacing.md }} />
            <Row
              icon="notifications"
              title={t("settings.notifications", { defaultValue: "Notifications" })}
              subtitle={t("comingSoon", { defaultValue: "Coming soon" })}
              onPress={() => {}}
              right={<Ionicons name="lock-closed" size={16} color={colors.text.muted} />}
            />
          </Card>

          {/* App Information */}
          <Card inset>
            <TText weight="bold" size="lg">{t("appInformation", { defaultValue: "App information" })}</TText>
            <TText dim style={{ marginTop: 6 }}>
              {t("version", { defaultValue: "Current version of app" })}: {getAppVersion()}
            </TText>

            {/* Extra useful quick actions */}
            <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
              <Button
                title={t("rateApp", { defaultValue: "Rate app" })}
                variant="outline"
                onPress={() => {
                  // TODO: deep link to store page later
                }}
              />
              <Button
                title={t("licenses", { defaultValue: "Licenses" })}
                variant="outline"
                onPress={() => router.push("/settings/licenses")}
              />
            </View>
          </Card>

          {/* Account section (nice to have) */}
          <Card>
            <TText weight="bold" size="lg" style={{ marginBottom: spacing.sm }}>
              {t("account", { defaultValue: "Account" })}
            </TText>
            <Row
              icon="exit-outline"
              title={t("signOut", { defaultValue: "Sign out" })}
              onPress={() => setSignOutVisible(true)}
            />
            <Row
              icon="trash-outline"
              title={t("deleteAccount", { defaultValue: "Delete account" })}
              subtitle={t("irreversible", { defaultValue: "This action is irreversible" })}
              onPress={() => router.push("/settings/delete")}
            />
          </Card>
        </View>
      </ScrollView>
      <ModalConfirm
        visible={signOutVisible}
        title={t("confirmSignOutTitle", { defaultValue: "Sign out?" })}
        message={t("confirmSignOutMsg", { defaultValue: "You will need to log in again to access your account." })}
        confirmText={t("signOut", { defaultValue: "Sign out" })}
        cancelText={t("cancel", { defaultValue: "Cancel" })}
        onCancel={() => setSignOutVisible(false)}
        onConfirm={async () => {
          try {
            const { signOut: fbSignOut } = await import("../../src/services/firebase");
            const { clearSavedSession } = await import("../../src/auth/firebaseSession");
            await fbSignOut((await import("../../src/services/firebase")).auth);
            await clearSavedSession();
          } finally {
            setSignOutVisible(false);
            router.replace("/(auth)/welcome"); // go to welcome
          }
        }}
      />
    </Screen>
  );
}
