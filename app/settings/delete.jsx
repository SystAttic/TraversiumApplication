import React, { useState } from "react";
import Screen from "../../src/components/Screen";
import AppHeader from "../../src/components/AppHeader";
import Card from "../../src/components/Card";
import TText from "../../src/components/TText";
import Button from "../../src/components/Button";
import { spacing } from "../../src/theme/spacing";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

export default function DeleteAccountScreen() {
  const { t } = useTranslation();
  const [disabled] = useState(true);

  return (
    <Screen>
      <AppHeader title={t("deleteAccount", { defaultValue: "Delete account" })} />
      <Card style={{ margin: spacing.xl }}>
        <TText weight="bold">{t("notAvailable", { defaultValue: "Not available yet" })}</TText>
        <TText dim style={{ marginTop: spacing.sm }}>
          {t("deleteDisabledMsg", {
            defaultValue:
              "Account deletion is currently disabled. Please contact support if you have questions.",
          })}
        </TText>
        <Button
          title={t("okay", { defaultValue: "Okay" })}
          style={{ marginTop: spacing.md }}
          onPress={() => Alert.alert(t("noted", { defaultValue: "Noted" }))}
        />
      </Card>
    </Screen>
  );
}
