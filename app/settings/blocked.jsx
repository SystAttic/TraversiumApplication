import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
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
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null); // user pending unblock

  const loadBlocked = async () => {
    try {
      setLoading(true);
      const blocked = await fetchBlocked();
      setList(blocked);
    } catch (error) {
      console.error("Error loading blocked users:", error);
      Alert.alert("Error", "Failed to load blocked users list. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let on = true;
    loadBlocked();
    return () => (on = false);
  }, []);

  const handleUnblock = async () => {
    if (!confirm || !confirm.username) return;

    const userToUnblock = confirm;
    setConfirm(null);

    // Optimistically update UI
    const previousList = list;
    setList((prev) => (prev || []).filter((u) => u.username !== userToUnblock.username));

    try {
      await unblockUser(userToUnblock);
    } catch (error) {
      // Revert on error
      setList(previousList);
      console.error("Error unblocking user:", error);
      Alert.alert("Error", "Failed to unblock user. Please try again.");
    }
  };

  return (
    <Screen>
      <AppHeader title={t("settings.blocked", { defaultValue: "Blocked user list" })} />
      <UserList
        data={list || []}
        kind="blocked"
        onItemPress={(u) => router.push(`/users/${u.username}`)}
        onUnblock={(u) => setConfirm(u)}
        ListEmptyComponent={() => (
          <TText dim style={{ padding: spacing.xl }}>
            {loading
              ? t("loading", { defaultValue: "Loading..." })
              : t("emptyBlocked", { defaultValue: "No blocked users." })}
          </TText>
        )}
      />

      <ModalConfirm
        visible={!!confirm}
        title={t("confirmUnblockTitle", { defaultValue: "Unblock user?" })}
        message={t("confirmUnblockMsg", { defaultValue: "They will be able to interact with you again." })}
        confirmText={t("unblock", { defaultValue: "Unblock" })}
        cancelText={t("cancel", { defaultValue: "Cancel" })}
        onCancel={() => setConfirm(null)}
        onConfirm={handleUnblock}
      />
    </Screen>
  );
}
