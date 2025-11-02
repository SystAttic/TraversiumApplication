import React, { useEffect, useState } from "react";
import { ScrollView, View, Image, Pressable } from "react-native";
import Screen from "../../src/components/Screen";
import AppHeader from "../../src/components/AppHeader";
import Card from "../../src/components/Card";
import TText from "../../src/components/TText";
import Button from "../../src/components/Button";
import StatusPill from "../../src/components/StatusPill";
import { useTheme } from "../../src/theme";
import { spacing, radii } from "../../src/theme/spacing";
import { Link } from "expo-router";
import { fetchTrips, fetchMe } from "../../src/data/api";
import SkeletonRect from "../../src/components/skeleton/SkeletonRect";
import SkeletonText from "../../src/components/skeleton/SkeletonText";
import { useLoading } from "../../src/providers/LoadingProvider";

export default function HomeScreen() {
  const { colors } = useTheme();
  const [me, setMe] = useState(null);
  const [recent, setRecent] = useState(null);
  const { show, hide } = useLoading();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [u, t] = await Promise.all([fetchMe(), fetchTrips()]);
      if (!mounted) return;
      setMe(u);
      setRecent(t.slice(0, 3));
    })();
    return () => (mounted = false);
  }, []);

  const handleNewTrip = async () => {
    show();
    try {
      // simulate mutation
      await new Promise((r) => setTimeout(r, 1400));
      // toast/snackbar could go here later
    } finally {
      hide();
    }
  };

  return (
    <Screen>
      <AppHeader title="Traversium" />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
        <Card>
          {me ? (
            <>
              <TText weight="bold" size="lg">Hello, {me.name.split(" ")[0]} 👋</TText>
              <TText dim style={{ marginTop: 6 }}>
                Turn your trips into shareable “Moments”. Invite friends. Re-live together.
              </TText>
            </>
          ) : (
            <>
              <SkeletonText lines={1} />
              <SkeletonText lines={2} />
            </>
          )}
          <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.lg }}>
            <Button title="New Trip" onPress={handleNewTrip} />
            <Link href="/trips" asChild>
              <Button title="Browse Trips" variant="ghost" />
            </Link>
          </View>
        </Card>

        <Card inset>
          <View style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }}>
            <StatusPill type="success" label="Synced" />
            <StatusPill type="info" label="3 pending invites" />
          </View>
        </Card>

        <View style={{ gap: spacing.md }}>
          <TText weight="medium">Recent trips</TText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.md, paddingRight: spacing.xl }}
          >
            {recent
              ? recent.map((t) => (
                  <Link key={t.id} href={`/trips/${t.id}`} asChild>
                    <Pressable>
                      <View
                        style={{
                          width: 220,
                          backgroundColor: colors.bg.layer2,
                          borderRadius: radii.lg,
                          borderWidth: 1,
                          borderColor: colors.border,
                          overflow: "hidden",
                        }}
                      >
                        <Image source={{ uri: t.cover }} style={{ width: "100%", height: 120 }} />
                        <View style={{ padding: spacing.md }}>
                          <TText weight="bold">{t.title}</TText>
                          <TText dim>{t.subtitle}</TText>
                        </View>
                      </View>
                    </Pressable>
                  </Link>
                ))
              : Array.from({ length: 3 }).map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: 220,
                      borderRadius: radii.lg,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.bg.layer2,
                    }}
                  >
                    <SkeletonRect height={120} radius={0} />
                    <View style={{ padding: spacing.md }}>
                      <SkeletonText lines={1} />
                      <SkeletonText lines={1} />
                    </View>
                  </View>
                ))}
          </ScrollView>
        </View>
      </ScrollView>
    </Screen>
  );
}
