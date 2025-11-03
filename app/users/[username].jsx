import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, View, Image, Pressable, Alert } from "react-native";
import Screen from "../../src/components/Screen";
import AppHeader from "../../src/components/AppHeader";
import Card from "../../src/components/Card";
import TText from "../../src/components/TText";
import { spacing } from "../../src/theme/spacing";
import { useTheme } from "../../src/theme";
import { useLocalSearchParams, Link } from "expo-router";
import { fetchUserByUsername, fetchTrips, fetchMe } from "../../src/data/api";
import ProfileHeader from "../../src/components/profile/ProfileHeader";
import ProgressBar from "../../src/components/ProgressBar";
import SkeletonRect from "../../src/components/skeleton/SkeletonRect";
import SkeletonText from "../../src/components/skeleton/SkeletonText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TabBarSpacer from "../../src/components/TabBarSpacer";
import { router } from "expo-router";

export default function VisitorProfile() {
  const { username } = useLocalSearchParams();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [me, setMe] = useState(null);
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState(null);
  const [following, setFollowing] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    let m = true;
    (async () => {
      const [u, current, all] = await Promise.all([
        fetchUserByUsername(username),
        fetchMe(),
        fetchTrips(),
      ]);
      if (!m) return;
      setUser(u);
      setMe(current);
      setTrips((all || []).filter(
        (t) => t.visibility === "public" && (t.contributors || []).includes(u?.username)
      ));
    })();
    return () => (m = false);
  }, [username]);

  const isOwner = user && me && user.username === me.username;

  const stats = useMemo(() => {
    const tripsN = trips?.length || 0;
    const moments = (trips || []).reduce((sum, t) => sum + (t.momentsCount || 0), 0);
    const followers = user?.followers ?? 0;
    return { trips: tripsN, moments, followers };
  }, [user, trips]);

  const level = user?.level ?? 2;
  const xp = user?.xp ?? 60;
  const nextXp = user?.nextXp ?? 150;

  const onToggleFollow = () => setFollowing((f) => !f);
  const onToggleBlock = () => setBlocked((b) => !b);
  const onReport = () => Alert.alert("Report", "Thanks—your report has been noted.");

  return (
    <Screen>
      <AppHeader title={user ? (user.displayName || user.name || user.username) : "Profile"} />
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, paddingBottom: insets.bottom + 24 }}
      >
        {user ? (
          <ProfileHeader
            cover={user.cover}
            avatar={user.avatar}
            name={user.displayName || user.name}
            username={user.username}
            description={user.bio}
            isOwner={!!isOwner}
            isFollowing={following}
            isBlocked={blocked}
            onToggleFollow={onToggleFollow}
            onToggleBlock={onToggleBlock}
            onReport={onReport}
            onEdit={() => {
              router.push("/settings/edit-profile");
            }}
          />
        ) : (
          <Card style={{ padding: 0 }}>
            <SkeletonRect height={160} radius={0} />
            <View style={{ alignItems: "center", marginTop: -40 }}>
              <SkeletonRect height={96} radius={999} />
            </View>
            <View style={{ padding: spacing.lg }}>
              <SkeletonText lines={2} />
            </View>
          </Card>
        )}

        <Card inset>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View style={{ alignItems: "center", flex: 1 }}>
              <TText weight="bold">{stats.trips}</TText>
              <TText dim>Trips</TText>
            </View>
            <View style={{ alignItems: "center", flex: 1 }}>
              <TText weight="bold">{stats.moments}</TText>
              <TText dim>Moments</TText>
            </View>
            <View style={{ alignItems: "center", flex: 1 }}>
              <TText weight="bold">{stats.followers}</TText>
              <TText dim>Followers</TText>
            </View>
          </View>
        </Card>

        <Card>
          <View style={{ alignItems: "center", gap: 6 }}>
            <Image
              source={{ uri: "https://cdn-icons-png.flaticon.com/512/616/616490.png" }}
              style={{ width: 36, height: 36, tintColor: colors.accent.primary }}
            />
            <TText weight="bold">Level {level}</TText>
            <View style={{ width: "100%", marginTop: spacing.sm }}>
              <ProgressBar value={xp} max={nextXp} />
              <TText dim style={{ marginTop: spacing.sm }}>{xp}/{nextXp} XP</TText>
            </View>
          </View>
        </Card>

        <View style={{ gap: spacing.md }}>
          <TText weight="medium">Their Trips</TText>
          <View style={{ gap: spacing.md }}>
            {trips
              ? trips.slice(0, 3).map((t, i) => (
                  <Link key={t.id || `utrip-${i}`} href={`/trips/${t.id}`} asChild>
                    <Pressable>
                      <Card style={{ padding: 0 }}>
                        <Image source={{ uri: t.cover }} style={{ width: "100%", height: 140 }} />
                        <View style={{ padding: spacing.lg }}>
                          <TText weight="bold">{t.title || "Untitled Trip"}</TText>
                          <TText dim>{t.subtitle || ""}</TText>
                        </View>
                      </Card>
                    </Pressable>
                  </Link>
                ))
              : Array.from({ length: 3 }).map((_, i) => (
                  <Card key={`vis-trip-skel-${i}`} style={{ padding: 0 }}>
                    <SkeletonRect height={140} />
                    <View style={{ padding: spacing.lg }}>
                      <SkeletonText lines={1} />
                      <SkeletonText lines={1} />
                    </View>
                  </Card>
                ))}
          </View>

          <Link href={`/users/${encodeURIComponent(username)}/trips`} asChild>
            <Pressable>
              <TText weight="medium" style={{ color: colors.accent.primary }}>Show more →</TText>
            </Pressable>
          </Link>
        </View>

        <TabBarSpacer useTabBarHeight={false} />
      </ScrollView>
    </Screen>
  );
}
