import React, { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, View, TextInput, Pressable, Image } from "react-native";
import Screen from "../../src/components/Screen";
import AppHeader from "../../src/components/AppHeader";
import Card from "../../src/components/Card";
import TText from "../../src/components/TText";
import Button from "../../src/components/Button";
import StatusPill from "../../src/components/StatusPill";
import { useTheme } from "../../src/theme";
import { spacing, radii } from "../../src/theme/spacing";
import { Link } from "expo-router";
import SkeletonRect from "../../src/components/skeleton/SkeletonRect";
import SkeletonText from "../../src/components/skeleton/SkeletonText";
import { fetchMe, searchProfiles, searchTrips } from "../../src/data/api";

const FILTERS = [
  { key: "mine", label: "Your Trips" },
  { key: "public", label: "Public Trips" },
  { key: "profiles", label: "Profiles" },
];

// ---------- helpers (pure, defensive) ----------
const safeStr = (v, fallback = "") => (typeof v === "string" ? v : fallback);
const safeUpper = (v, fallback = "") => safeStr(v, fallback).toUpperCase();
const safeNum = (v, fallback = 0) => (typeof v === "number" ? v : fallback);
const pickKey = (obj, idx, prefix) =>
  `${prefix}-${(obj && (obj.id ?? obj.username ?? obj.key ?? obj._id)) ?? idx}`;

const placeImg = (seed = 1) => `https://i.pravatar.cc/200?img=${(seed % 70) + 1}`;

export default function SearchScreen() {
  const { colors } = useTheme();

  const [active, setActive] = useState("mine");
  const [q, setQ] = useState("");
  const [me, setMe] = useState(null);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]); // always an array
  const [error, setError] = useState(null);

  const debTimer = useRef(null);
  const reqToken = useRef(0); // increases per request to ignore stale responses
  const mounted = useRef(true);

  // fetch current user once
  useEffect(() => {
    mounted.current = true;
    (async () => {
      try {
        const u = await fetchMe();
        if (!mounted.current) return;
        setMe(u);
      } catch {
        // non-fatal
      }
    })();
    return () => {
      mounted.current = false;
    };
  }, []);

  // run search (debounced) whenever active/q/me changes
  useEffect(() => {
    if (debTimer.current) clearTimeout(debTimer.current);

    setLoading(true);
    setError(null);
    setResults([]); // reset to array (never null)

    const token = ++reqToken.current;

    debTimer.current = setTimeout(async () => {
      try {
        let r = [];
        if (active === "profiles") {
          r = await searchProfiles({ query: q });
        } else {
          r = await searchTrips({ query: q, scope: active, me });
        }

        // ensure array + drop null/undefined + dedupe by id/username
        const seen = new Set();
        const cleaned = [];
        (Array.isArray(r) ? r : []).forEach((item) => {
          if (!item) return;
          const idKey = item.id ?? item.username ?? item._id ?? item.key;
          // allow items with no id/username but then dedupe by JSON signature
          const sig = idKey ?? JSON.stringify(item);
          if (seen.has(sig)) return;
          seen.add(sig);
          cleaned.push(item);
        });

        if (!mounted.current || token !== reqToken.current) return; // stale
        setResults(cleaned);
        setLoading(false);
      } catch (e) {
        if (!mounted.current || token !== reqToken.current) return;
        setError(e?.message || "Something went wrong.");
        setResults([]);
        setLoading(false);
      }
    }, 250);

    return () => debTimer.current && clearTimeout(debTimer.current);
  }, [q, active, me]);

  const placeholder = useMemo(() => {
    if (active === "profiles") return "Search profiles (name, @username)";
    if (active === "public") return "Search public trips (title, tags, locations)";
    return "Search your trips (title, tags)";
  }, [active]);

  // ---------- UI ----------
  return (
    <Screen>
      <AppHeader title="Search" />

      {/* Search & filters */}
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.md }}>
        <View
          style={{
            backgroundColor: colors.bg.layer2,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
          }}
        >
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={placeholder}
            placeholderTextColor={colors.text.muted}
            style={{ color: colors.text.primary, paddingVertical: 6 }}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>

        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          {FILTERS.map((f) => {
            const selected = active === f.key;
            return (
              <Pressable key={`filter-${f.key}`} onPress={() => setActive(f.key)}>
                <View
                  style={{
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.xs,
                    borderRadius: 999,
                    backgroundColor: selected ? colors.accent.primary : colors.bg.layer2,
                    borderWidth: 1,
                    borderColor: selected ? colors.accent.primary : colors.border,
                  }}
                >
                  <TText
                    weight="medium"
                    size="sm"
                    style={{ color: selected ? "#fff" : colors.text.primary }}
                  >
                    {f.label}
                  </TText>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
        {/* Error state */}
        {error && (
          <Card inset>
            <TText weight="bold">Search error</TText>
            <TText dim style={{ marginTop: spacing.sm }}>{String(error)}</TText>
          </Card>
        )}

        {/* TRIPS: mine/public */}
        {(active === "mine" || active === "public") && (
          <View style={{ gap: spacing.md }}>
            <TText weight="medium">
              {active === "mine" ? "Your Trips" : "Public Trips"}
            </TText>

            <View style={{ gap: spacing.md }}>
              {loading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={`trip-skel-${i}`} style={{ padding: 0 }}>
                    <SkeletonRect height={140} radius={12} />
                    <View style={{ padding: spacing.lg }}>
                      <SkeletonText lines={1} />
                      <SkeletonText lines={1} />
                    </View>
                  </Card>
                ))}

              {!loading &&
                results.map((raw, i) => {
                  // defensive field extraction
                  const id = safeStr(raw?.id) || `trip-${i}`;
                  const title = safeStr(raw?.title, "Untitled Trip");
                  const subtitle = safeStr(raw?.subtitle, "");
                  const cover = safeStr(raw?.cover) || placeImg(i);
                  const contribCount = Array.isArray(raw?.contributors)
                    ? raw.contributors.length
                    : safeNum(raw?.contributors, 0);
                  const visibility = safeStr(raw?.visibility, "unknown"); // <- default
                  const visType = visibility === "public" ? "info" : visibility === "private" ? "warning" : "warning";
                  const visLabel = safeUpper(visibility, "UNKNOWN");

                  // if we have no canonical id, avoid broken links (stay on page)
                  const href = raw?.id ? `/trips/${raw.id}` : undefined;

                  return (
                    <View key={pickKey(raw, i, "trip-wrapper")}>
                      {href ? (
                        <Link href={href} asChild>
                          <Pressable>
                            <TripCard
                              cover={cover}
                              title={title}
                              subtitle={subtitle}
                              visType={visType}
                              visLabel={visLabel}
                              contribCount={contribCount}
                            />
                          </Pressable>
                        </Link>
                      ) : (
                        <TripCard
                          cover={cover}
                          title={title}
                          subtitle={subtitle}
                          visType={visType}
                          visLabel={visLabel}
                          contribCount={contribCount}
                        />
                      )}
                    </View>
                  );
                })}

              {!loading && !error && results.length === 0 && (
                <Card inset key="no-trip-results">
                  <TText dim>No trips found.</TText>
                </Card>
              )}
            </View>
          </View>
        )}

        {/* PROFILES */}
        {active === "profiles" && (
          <View style={{ gap: spacing.md }}>
            <TText weight="medium">Profiles</TText>

            <View style={{ gap: spacing.md }}>
              {loading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={`profile-skel-${i}`}>
                    <View style={{ flexDirection: "row", gap: spacing.lg, alignItems: "center" }}>
                      <SkeletonRect height={56} radius={999} />
                      <View style={{ flex: 1 }}>
                        <SkeletonText lines={1} />
                        <SkeletonText lines={1} />
                      </View>
                    </View>
                  </Card>
                ))}

              {!loading &&
                results.map((raw, i) => {
                  const username = safeStr(raw?.username) || `user-${i}`; // fallback
                  const name = safeStr(raw?.name, username);
                  const location = safeStr(raw?.location, "");
                  const bio = safeStr(raw?.bio, "");
                  const avatar = safeStr(raw?.avatar) || placeImg(i);

                  const subtitle = [username && `@${username}`, location].filter(Boolean).join(" • ");

                  return (
                    <Link key={pickKey(raw, i, "profile")} href={`/users/${encodeURIComponent(username)}`} asChild>
                      <Pressable>
                        <Card>
                          <View style={{ flexDirection: "row", gap: spacing.lg, alignItems: "center" }}>
                            <Image source={{ uri: avatar }} style={{ width: 56, height: 56, borderRadius: 999 }} />
                            <View style={{ flex: 1 }}>
                              <TText weight="bold">{name}</TText>
                              <TText dim>{subtitle || "Profile"}</TText>
                              {bio ? <TText dim style={{ marginTop: 4 }}>{bio}</TText> : null}
                            </View>
                            <Button title="View" variant="outline" />
                          </View>
                        </Card>
                      </Pressable>
                    </Link>
                  );
                })}

              {!loading && !error && results.length === 0 && (
                <Card inset key="no-profile-results">
                  <TText dim>No profiles found.</TText>
                </Card>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

// ---------- presentational piece for trips (keeps mapping tidy) ----------
function TripCard({ cover, title, subtitle, visType, visLabel, contribCount }) {
  const { colors } = useTheme();
  return (
    <Card style={{ padding: 0 }}>
      <Image source={{ uri: cover }} style={{ width: "100%", height: 140 }} />
      <View style={{ padding: spacing.lg }}>
        <TText weight="bold">{title}</TText>
        {subtitle ? <TText dim>{subtitle}</TText> : null}
        <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.sm }}>
          <StatusPill type={visType} label={visLabel} />
          <StatusPill type="success" label={`${contribCount} contributors`} />
        </View>
      </View>
    </Card>
  );
}
