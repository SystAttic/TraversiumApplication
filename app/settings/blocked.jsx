import React, { useEffect, useState } from "react";
import Screen from "../../src/components/Screen";
import AppHeader from "../../src/components/AppHeader";
import UserList from "../../src/components/users/UserList";
import TText from "../../src/components/TText";
import ModalConfirm from "../../src/components/ModalConfirm";
import { spacing } from "../../src/theme/spacing";
import { fetchBlocked, unblockUser } from "../../src/data/social";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";

export default function BlockedScreen() {
  const { t } = useTranslation();
  const [list, setList] = useState(null);
  const [confirm, setConfirm] = useState(null); // user pending unblock

  useEffect(() => {
    let on = true;
    fetchBlocked().then((x) => on && setList(x));
    return () => (on = false);
  }, []);

  return (
    <Screen>
      <AppHeader title={t("settings.blocked", { defaultValue: "Blocked user list" })} />
      <UserList
        data={list || []}
        kind="blocked"
        onItemPress={(u) => router.push(`/users/${u.username}`)}
        onUnblock={(u) => setConfirm(u)}
        ListEmptyComponent={() => (
          <TText dim style={{ padding: spacing.xl }}>{t("emptyBlocked", { defaultValue: "No blocked users." })}</TText>
        )}
      />

      <ModalConfirm
        visible={!!confirm}
        title={t("confirmUnblockTitle", { defaultValue: "Unblock user?" })}
        message={t("confirmUnblockMsg", { defaultValue: "They will be able to interact with you again." })}
        confirmText={t("unblock", { defaultValue: "Unblock" })}
        cancelText={t("cancel", { defaultValue: "Cancel" })}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          if (confirm) {
            await unblockUser(confirm);
            setList((prev) => (prev || []).filter((u) => u.username !== confirm.username));
            setConfirm(null);
          }
        }}
      />
    </Screen>
  );
}
