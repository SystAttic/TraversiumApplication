import React, { useEffect, useState } from "react";
import { ScrollView, Alert } from "react-native";
import Screen from "../../src/components/Screen";
import AppHeader from "../../src/components/AppHeader";
import { spacing } from "../../src/theme/spacing";
import { useLocalSearchParams } from "expo-router";
import { fetchUserByUsername, fetchTrips, fetchMe } from "../../src/data/api";
import ProfileContent from "../../src/components/profile/ProfileContent";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { followUser, unfollowUser, blockUser, unblockUser, getFollowing, getBlockedUsers } from "../../src/services/userApi";
import ModalConfirm from "../../src/components/ModalConfirm";

export default function VisitorProfile() {
  const { username } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [me, setMe] = useState(null);
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState(null);
  const [following, setFollowing] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showUnblockModal, setShowUnblockModal] = useState(false);

  useEffect(() => {
    let m = true;
    (async () => {
      try {
        const [u, current, all] = await Promise.all([
          fetchUserByUsername(username),
          fetchMe().catch(() => null), // Allow profile view even if current user fetch fails
          fetchTrips(),
        ]);
        if (!m) return;
        setUser(u);
        setMe(current);
        
        // Check if current user is following or has blocked the profile user
        if (current && u && current.firebaseId !== u.firebaseId && current.username) {
          try {
            const [followingList, blockedList] = await Promise.all([
              getFollowing(current.username, 0, 100).catch(() => []),
              getBlockedUsers(0, 100).catch(() => []),
            ]);
            
            const isFollowingUser = followingList.some(
              (followedUser) => followedUser.firebaseId === u.firebaseId || followedUser.username === u.username
            );
            const isBlockedUser = blockedList.some(
              (blockedUser) => blockedUser.firebaseId === u.firebaseId || blockedUser.username === u.username
            );
            
            if (!m) return;
            setFollowing(isFollowingUser);
            setBlocked(isBlockedUser);
          } catch (error) {
            console.error("Error checking follow/block status:", error);
            // Continue with default values (false)
          }
        }
        
        // Filter trips where user is owner or collaborator, and visibility is public (unless viewing own profile)
        const isOwnProfile = u && current && u.firebaseId === current.firebaseId;
        setTrips((all || []).filter((t) => {
          const collaborators = t.collaborators || [];
          const ownerId = t.ownerId;
          const isUserInvolved = collaborators.includes(u?.firebaseId) || ownerId === u?.firebaseId;
          if (!isUserInvolved) return false;
          // If viewing own profile, show all trips. Otherwise, only show public trips
          return isOwnProfile || t.visibility === "PUBLIC";
        }));
      } catch (error) {
        console.error("Error loading user profile:", error);
      }
    })();
    return () => (m = false);
  }, [username]);

  const isOwner = user && me && user.firebaseId === me.firebaseId;

  const level = user?.level ?? 2;
  const xp = user?.xp ?? 60;
  const nextXp = user?.nextXp ?? 150;

  const onToggleFollow = async () => {
    if (!user || !user.username) return;
    
    const wasFollowing = following;
    // Optimistically update UI
    setFollowing(!wasFollowing);
    
    try {
      if (wasFollowing) {
        await unfollowUser(user.username);
      } else {
        await followUser(user.username);
      }
    } catch (error) {
      // Revert on error
      setFollowing(wasFollowing);
      console.error("Error toggling follow:", error);
      Alert.alert(
        "Error",
        wasFollowing 
          ? "Failed to unfollow user. Please try again." 
          : "Failed to follow user. Please try again."
      );
    }
  };

  const onToggleBlock = () => {
    if (!user || !user.username) return;
    
    // Show confirmation modal instead of directly blocking/unblocking
    if (blocked) {
      setShowUnblockModal(true);
    } else {
      setShowBlockModal(true);
    }
  };

  const handleConfirmBlock = async () => {
    if (!user || !user.username) return;
    
    setShowBlockModal(false);
    const wasBlocked = blocked;
    // Optimistically update UI
    setBlocked(true);
    
    try {
      await blockUser(user.username);
      // If blocking, also unfollow if currently following
      if (following) {
        setFollowing(false);
      }
    } catch (error) {
      // Revert on error
      setBlocked(wasBlocked);
      console.error("Error blocking user:", error);
      Alert.alert(
        "Error",
        "Failed to block user. Please try again."
      );
    }
  };

  const handleConfirmUnblock = async () => {
    if (!user || !user.username) return;
    
    setShowUnblockModal(false);
    const wasBlocked = blocked;
    // Optimistically update UI
    setBlocked(false);
    
    try {
      await unblockUser(user.username);
    } catch (error) {
      // Revert on error
      setBlocked(wasBlocked);
      console.error("Error unblocking user:", error);
      Alert.alert(
        "Error",
        "Failed to unblock user. Please try again."
      );
    }
  };

  const onReport = () => Alert.alert("Report", "Thanks—your report has been noted.");

  return (
    <Screen>
      <AppHeader title={user ? (user.displayName || user.firstName || user.username) : "Profile"} />
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, paddingBottom: insets.bottom + spacing.sm }}
      >
        <ProfileContent
          user={user}
          trips={trips}
          isOwner={!!isOwner}
          isFollowing={following}
          isBlocked={blocked}
          onToggleFollow={onToggleFollow}
          onToggleBlock={onToggleBlock}
          onReport={onReport}
          onEdit={() => router.push("/settings/edit-profile")}
          tripsLabel="Their Trips"
          showMoreLink={`/users/${encodeURIComponent(username)}/trips`}
          level={level}
          xp={xp}
          nextXp={nextXp}
        />
      </ScrollView>

      {/* Block Confirmation Modal */}
      <ModalConfirm
        visible={showBlockModal}
        title="Block User?"
        message={`Are you sure you want to block ${user?.displayName || user?.username || "this user"}? You won't be able to see their content or interact with them.`}
        confirmText="Block"
        cancelText="Cancel"
        onConfirm={handleConfirmBlock}
        onCancel={() => setShowBlockModal(false)}
      />

      {/* Unblock Confirmation Modal */}
      <ModalConfirm
        visible={showUnblockModal}
        title="Unblock User?"
        message={`Are you sure you want to unblock ${user?.displayName || user?.username || "this user"}? You'll be able to see their content and interact with them again.`}
        confirmText="Unblock"
        cancelText="Cancel"
        onConfirm={handleConfirmUnblock}
        onCancel={() => setShowUnblockModal(false)}
      />
    </Screen>
  );
}
