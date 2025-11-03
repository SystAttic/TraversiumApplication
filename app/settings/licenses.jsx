import React from "react";
import { View } from "react-native";
import Screen from "../../src/components/Screen";
import AppHeader from "../../src/components/AppHeader";
import TText from "../../src/components/TText";
import { spacing } from "../../src/theme/spacing";
import Accordion from "../../src/components/Accordion";
import { useTranslation } from "react-i18next";

export default function LicensesScreen() {
  const { t } = useTranslation();

  const items = [
    {
      title: "Traversium Core License",
      content: "Placeholder license text for Traversium core modules. Replace with your actual license content.",
    },
    {
      title: "Third-party Packages",
      content: "A list of OSS dependencies and their licenses will appear here. (MIT, Apache-2.0, etc.)",
    },
    {
      title: "Media & Icons",
      content: "Attribution for images and icons used inside the application.",
    },
  ];

  return (
    <Screen>
      <AppHeader title={t("licenses", { defaultValue: "Licenses" })} />
      <View style={{ padding: spacing.xl }}>
        <TText dim style={{ marginBottom: spacing.lg }}>
          {t("licensesIntro", { defaultValue: "Review app and third-party licenses." })}
        </TText>
        <Accordion items={items} />
      </View>
    </Screen>
  );
}
