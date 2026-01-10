import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import Screen from "../../src/components/Screen";
import AppHeader from "../../src/components/AppHeader";
import UserList from "../../src/components/users/UserList";
import TText from "../../src/components/TText";
import ModalConfirm from "../../src/components/ModalConfirm";
import { spacing } from "../../src/theme/spacing";
import { fetchFollowers } from "../../src/data/social";
import { fetchMe } from "../../src/data/api";
import { getFollowing, followUser, unfollowUser } from "../../src/services/userApi";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";

export default function FollowersScreen() {
  const { t } = useTranslation();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmUnfollow, setConfirmUnfollow] = useState(null); // user pending unfollow

  const loadFollowers = async () => {
    try {
      setLoading(true);
      const [followers, me] = await Promise.all([
        fetchFollowers(),
        fetchMe().catch(() => null),
      ]);

      if (!me || !me.username) {
        setList(followers.map((user) => ({ ...user, isFollowing: false })));
        return;
      }

      // Get current user's following list to check follow status
      const followingList = await getFollowing(me.username, 0, 100).catch(() => []);
      const followingUsernames = new Set(
        followingList.map((u) => u.username || u.firebaseId)
      );

      // Mark followers with their follow status
      const followersWithStatus = followers.map((user) => ({
        ...user,
        isFollowing:
          followingUsernames.has(user.username) ||
          followingUsernames.has(user.firebaseId),
      }));

      setList(followersWithStatus);
    } catch (error) {
      console.error("Error loading followers:", error);
      Alert.alert("Error", "Failed to load followers list. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let on = true;
    loadFollowers();
    return () => (on = false);
  }, []);

  const handleFollowToggle = (user) => {
    if (!user || !user.username) return;

    const wasFollowing = user.isFollowing;
    
    // If unfollowing, show confirmation modal
    if (wasFollowing) {
      setConfirmUnfollow(user);
    } else {
      // If following, do it directly without confirmation
      handleFollow(user);
    }
  };

  const handleFollow = async (user) => {
    if (!user || !user.username) return;

    // Optimistically update UI
    setList((prev) =>
      prev?.map((u) =>
        u.username === user.username ? { ...u, isFollowing: true } : u
      )
    );

    try {
      await followUser(user.username);
    } catch (error) {
      // Revert on error
      setList((prev) =>
        prev?.map((u) =>
          u.username === user.username ? { ...u, isFollowing: false } : u
        )
      );
      console.error("Error following user:", error);
      Alert.alert("Error", "Failed to follow user. Please try again.");
    }
  };

  const handleConfirmUnfollow = async () => {
    if (!confirmUnfollow || !confirmUnfollow.username) return;

    const userToUnfollow = confirmUnfollow;
    setConfirmUnfollow(null);

    // Optimistically update UI
    setList((prev) =>
      prev?.map((u) =>
        u.username === userToUnfollow.username ? { ...u, isFollowing: false } : u
      )
    );

    try {
      await unfollowUser(userToUnfollow.username);
    } catch (error) {
      // Revert on error
      setList((prev) =>
        prev?.map((u) =>
          u.username === userToUnfollow.username ? { ...u, isFollowing: true } : u
        )
      );
      console.error("Error unfollowing user:", error);
      Alert.alert("Error", "Failed to unfollow user. Please try again.");
    }
  };

  return (
    <Screen>
      <AppHeader title={t("settings.followers", { defaultValue: "Followers user list" })} />
      <UserList
        data={list || []}
        kind="followers"
        onItemPress={(u) => router.push(`/users/${u.username}`)}
        onFollowToggle={handleFollowToggle}
        ListEmptyComponent={() => (
          <TText dim style={{ padding: spacing.xl }}>
            {loading
              ? t("loading", { defaultValue: "Loading..." })
              : t("emptyFollowers", { defaultValue: "No followers yet." })}
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
