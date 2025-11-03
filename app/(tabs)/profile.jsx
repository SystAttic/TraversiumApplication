import React, { useEffect, useState, useMemo } from "react";
import { ScrollView, View, Image, Pressable } from "react-native";
import Screen from "../../src/components/Screen";
import AppHeader from "../../src/components/AppHeader";
import Card from "../../src/components/Card";
import TText from "../../src/components/TText";
import Button from "../../src/components/Button";
import { useTheme } from "../../src/theme";
import { spacing } from "../../src/theme/spacing";
import { fetchMe, fetchTrips } from "../../src/data/api";
import ProfileHeader from "../../src/components/profile/ProfileHeader";
import ProgressBar from "../../src/components/ProgressBar";
import SkeletonRect from "../../src/components/skeleton/SkeletonRect";
import SkeletonText from "../../src/components/skeleton/SkeletonText";
import { Link, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import TabBarSpacer from "../../src/components/TabBarSpacer";
import { useTranslation } from "react-i18next";
import "intl-pluralrules";

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight?.() || 0;

  const [me, setMe] = useState(null);
  const [myTrips, setMyTrips] = useState(null);

  useEffect(() => {
    let m = true;
    (async () => {
      const u = await fetchMe();
      if (!m) return;
      setMe(u);
      const all = await fetchTrips();
      if (!m) return;
      setMyTrips(all.filter((t) => (t.contributors || []).includes(u?.username)));
    })();
    return () => (m = false);
  }, []);

  const stats = useMemo(() => {
    const trips = myTrips?.length || 0;
    const moments = (myTrips || []).reduce((sum, t) => sum + (t.momentsCount || 0), 0);
    const followers = me?.followers ?? 0;
    return { trips, moments, followers };
  }, [me, myTrips]);

  const level = me?.level ?? 3;
  const xp = me?.xp ?? 120;
  const nextXp = me?.nextXp ?? 200;

  return (
    <Screen>
      <AppHeader title="Profile" />
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, paddingBottom: insets.bottom + tabBarHeight + spacing.xl }}
      >
        {me ? (
          <ProfileHeader
            isOwner
            cover={me.cover}
            avatar={me.avatar}
            name={me.displayName || me.name}
            username={me.username}
            description={me.bio}
            onEdit={() => router.push("/settings/edit-profile")}
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
              <TText dim>{t("profile.trips_count", { count: stats.trips })}</TText>
            </View>
            <View style={{ alignItems: "center", flex: 1 }}>
              <TText weight="bold">{stats.moments}</TText>
              <TText dim>{t("profile.moments_count", { count: stats.moments })}</TText>
            </View>
            <View style={{ alignItems: "center", flex: 1 }}>
              <TText weight="bold">{stats.followers}</TText>
              <TText dim>{t("profile.followers_count", { count: stats.followers })}</TText>
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
              <TText dim style={{ marginTop: 6 }}>{xp}/{nextXp} XP</TText>
            </View>
          </View>
        </Card>

        <View style={{ gap: spacing.md }}>
          <TText weight="medium">My Trips</TText>
          <View style={{ gap: spacing.md }}>
            {myTrips
              ? myTrips.slice(0, 3).map((t, i) => (
                  <Link key={t.id || `me-trip-${i}`} href={`/trips/${t.id}`} asChild>
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
                  <Card key={`me-trip-skel-${i}`} style={{ padding: 0 }}>
                    <SkeletonRect height={140} />
                    <View style={{ padding: spacing.lg }}>
                      <SkeletonText lines={1} />
                      <SkeletonText lines={1} />
                    </View>
                  </Card>
                ))}
          </View>

          <Link href={`/users/${encodeURIComponent(me?.username || "me")}/trips`} asChild>
            <Pressable>
              <TText weight="medium" style={{ color: colors.accent.primary }}>Show more →</TText>
            </Pressable>
          </Link>
        </View>

        <TabBarSpacer />
      </ScrollView>
    </Screen>
  );
}
