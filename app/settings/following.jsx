import React, { useEffect, useState } from "react";
import Screen from "../../src/components/Screen";
import AppHeader from "../../src/components/AppHeader";
import UserList from "../../src/components/users/UserList";
import TText from "../../src/components/TText";
import { spacing } from "../../src/theme/spacing";
import { fetchFollowing, toggleFollow } from "../../src/data/social";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";

export default function FollowingScreen() {
  const { t } = useTranslation();
  const [list, setList] = useState(null);

  useEffect(() => {
    let on = true;
    fetchFollowing().then((x) => on && setList(x));
    return () => (on = false);
  }, []);

  return (
    <Screen>
      <AppHeader title={t("settings.following", { defaultValue: "Following user list" })} />
      <UserList
        data={list || []}
        kind="following"
        onItemPress={(u) => router.push(`/users/${u.username}`)}
        onFollowToggle={async (u) => {
          await toggleFollow(u);
          setList((prev) => [...prev]);
        }}
        ListEmptyComponent={() => (
          <TText dim style={{ padding: spacing.xl }}>{t("emptyFollowing", { defaultValue: "You are not following anyone yet." })}</TText>
        )}
      />
    </Screen>
  );
}
