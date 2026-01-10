import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import Screen from "../../src/components/Screen";
import AppHeader from "../../src/components/AppHeader";
import UserList from "../../src/components/users/UserList";
import TText from "../../src/components/TText";
import ModalConfirm from "../../src/components/ModalConfirm";
import { spacing } from "../../src/theme/spacing";
import { fetchFollowing } from "../../src/data/social";
import { unfollowUser } from "../../src/services/userApi";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";

export default function FollowingScreen() {
  const { t } = useTranslation();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmUnfollow, setConfirmUnfollow] = useState(null); // user pending unfollow

  const loadFollowing = async () => {
    try {
      setLoading(true);
      const following = await fetchFollowing();
      // Mark all as following since this is the following list
      const followingWithStatus = following.map((user) => ({
        ...user,
        isFollowing: true,
      }));
      setList(followingWithStatus);
    } catch (error) {
      console.error("Error loading following:", error);
      Alert.alert("Error", "Failed to load following list. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let on = true;
    loadFollowing();
    return () => (on = false);
  }, []);

  const handleFollowToggle = (user) => {
    if (!user || !user.username) return;
    // Show confirmation modal for unfollow
    setConfirmUnfollow(user);
  };

  const handleConfirmUnfollow = async () => {
    if (!confirmUnfollow || !confirmUnfollow.username) return;

    const userToUnfollow = confirmUnfollow;
    setConfirmUnfollow(null);

    // Optimistically update UI - remove from list since we're unfollowing
    const previousList = list;
    setList((prev) => prev?.filter((u) => u.username !== userToUnfollow.username) || []);

    try {
      await unfollowUser(userToUnfollow.username);
    } catch (error) {
      // Revert on error
      setList(previousList);
      console.error("Error unfollowing user:", error);
      Alert.alert("Error", "Failed to unfollow user. Please try again.");
    }
  };

  return (
    <Screen>
      <AppHeader title={t("settings.following", { defaultValue: "Following user list" })} />
      <UserList
        data={list || []}
        kind="following"
        onItemPress={(u) => router.push(`/users/${u.username}`)}
        onFollowToggle={handleFollowToggle}
        ListEmptyComponent={() => (
          <TText dim style={{ padding: spacing.xl }}>
            {loading
              ? t("loading", { defaultValue: "Loading..." })
              : t("emptyFollowing", { defaultValue: "You are not following anyone yet." })}
          </TText>
        )}
      />

      <ModalConfirm
        visible={!!confirmUnfollow}
        title={t("confirmUnfollowTitle", { defaultValue: "Unfollow user?" })}
        message={`Are you sure you want to unfollow ${confirmUnfollow?.displayName || confirmUnfollow?.username || "this user"}? You won't see their updates in your feed.`}
        confirmText={t("unfollow", { defaultValue: "Unfollow" })}
        cancelText={t("cancel", { defaultValue: "Cancel" })}
        onCancel={() => setConfirmUnfollow(null)}
        onConfirm={handleConfirmUnfollow}
      />
    </Screen>
  );
}
