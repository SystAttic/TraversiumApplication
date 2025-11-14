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

export default function VisitorProfile() {
  const { username } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [me, setMe] = useState(null);
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState(null);
  const [following, setFollowing] = useState(false);
  const [blocked, setBlocked] = useState(false);

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

  const onToggleFollow = () => setFollowing((f) => !f);
  const onToggleBlock = () => setBlocked((b) => !b);
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
    </Screen>
  );
}
