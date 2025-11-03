import React from "react";
import { View } from "react-native";
import Screen from "../../src/components/Screen";
import AppHeader from "../../src/components/AppHeader";
import Card from "../../src/components/Card";
import TText from "../../src/components/TText";
import Button from "../../src/components/Button";
import { spacing } from "../../src/theme/spacing";
import { useTranslation } from "react-i18next";

export default function Payments() {
  const { t } = useTranslation();
  const hasMethod = true; // mock
  const tier = "Pro";     // mock

  return (
    <Screen>
      <AppHeader title={t("settings.payments", { defaultValue: "Payments and Subscriptions" })} />
      <View style={{ padding: spacing.xl, gap: spacing.lg }}>
        <Card>
          <TText weight="bold">{t("paymentMethod", { defaultValue: "Payment Method" })}</TText>
          <TText dim style={{ marginTop: 6 }}>
            {hasMethod ? t("cardOnFile", { defaultValue: "Visa •••• 4242" }) : t("noPayment", { defaultValue: "No payment method connected" })}
          </TText>
          <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
            <Button title={hasMethod ? t("update", { defaultValue: "Update" }) : t("add", { defaultValue: "Add" })} />
            {hasMethod ? <Button title={t("remove", { defaultValue: "Remove" })} variant="outline" /> : null}
          </View>
        </Card>

        <Card>
          <TText weight="bold">{t("subscription", { defaultValue: "Subscription" })}</TText>
          <TText dim style={{ marginTop: 6 }}>
            {t("currentTier", { defaultValue: "Current tier" })}: {tier}
          </TText>
          <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
            <Button title={t("manage", { defaultValue: "Manage" })} />
            <Button title={t("upgrade", { defaultValue: "Upgrade" })} variant="outline" />
          </View>
        </Card>
      </View>
    </Screen>
  );
}
