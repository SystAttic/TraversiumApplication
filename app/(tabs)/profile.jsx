import React, { useEffect, useState, useCallback } from "react";
import { ScrollView, RefreshControl } from "react-native";
import Screen from "../../src/components/Screen";
import AppHeader from "../../src/components/AppHeader";
import { spacing } from "../../src/theme/spacing";
import { fetchMe, fetchTrips } from "../../src/data/api";
import ProfileContent from "../../src/components/profile/ProfileContent";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../src/theme";
import "intl-pluralrules";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight?.() || 0;

  const [me, setMe] = useState(null);
  const [myTrips, setMyTrips] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }
    
    try {
      const u = await fetchMe();
      setMe(u);
      const all = await fetchTrips();
      // Filter trips where user is a collaborator (collaborators contains Firebase UIDs)
      setMyTrips(all.filter((t) => {
        const collaborators = t.collaborators || [];
        const ownerId = t.ownerId;
        return collaborators.includes(u?.firebaseId) || ownerId === u?.firebaseId;
      }));
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  const onRefresh = useCallback(() => {
    loadData(true);
  }, [loadData]);

  const level = me?.level ?? 3;
  const xp = me?.xp ?? 120;
  const nextXp = me?.nextXp ?? 200;

  return (
    <Screen>
      <AppHeader title="Profile" />
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, paddingBottom: insets.bottom + tabBarHeight + spacing.sm }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent.primary}
            colors={[colors.accent.primary]}
          />
        }
      >
        <ProfileContent
          user={me}
          trips={myTrips}
          isOwner={true}
          onEdit={() => router.push("/settings/edit-profile")}
          tripsLabel={t("profile.my_trips", "My Trips")}
          showMoreLink={`/users/${encodeURIComponent(me?.username || "me")}/trips`}
          level={level}
          xp={xp}
          nextXp={nextXp}
        />
      </ScrollView>
    </Screen>
  );
}
