import React, { useEffect, useState } from "react";
import Screen from "../../src/components/Screen";
import AppHeader from "../../src/components/AppHeader";
import UserList from "../../src/components/users/UserList";
import TText from "../../src/components/TText";
import { spacing } from "../../src/theme/spacing";
import { fetchFollowers, toggleFollow } from "../../src/data/social";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";

export default function FollowersScreen() {
  const { t } = useTranslation();
  const [list, setList] = useState(null);

  useEffect(() => {
    let on = true;
    fetchFollowers().then((x) => on && setList(x));
    return () => (on = false);
  }, []);

  return (
    <Screen>
      <AppHeader title={t("settings.followers", { defaultValue: "Followers user list" })} />
      <UserList
        data={list || []}
        kind="followers"
        onItemPress={(u) => router.push(`/users/${u.username}`)}
        onFollowToggle={async (u) => {
          await toggleFollow(u);
          setList((prev) => [...prev]);
        }}
        ListEmptyComponent={() => (
          <TText dim style={{ padding: spacing.xl }}>{t("emptyFollowers", { defaultValue: "No followers yet." })}</TText>
        )}
      />
    </Screen>
  );
}
