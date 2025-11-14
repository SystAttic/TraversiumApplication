import React, { useMemo } from "react";
import { View, Image, Pressable } from "react-native";
import Card from "../Card";
import TText from "../TText";
import ProgressBar from "../ProgressBar";
import ProfileHeader from "./ProfileHeader";
import SkeletonRect from "../skeleton/SkeletonRect";
import SkeletonText from "../skeleton/SkeletonText";
import { Link } from "expo-router";
import { spacing } from "../../theme/spacing";
import { useTheme } from "../../theme";

/**
 * Shared profile content component used by both own profile and visitor profile
 */
export default function ProfileContent({
  user,
  me,
  trips,
  isOwner = false,
  isFollowing = false,
  isBlocked = false,
  onToggleFollow,
  onToggleBlock,
  onReport,
  onEdit,
  tripsLabel = "Trips",
  showMoreLink,
  level = 2,
  xp = 60,
  nextXp = 150,
}) {
  const { colors } = useTheme();

  const stats = useMemo(() => {
    const tripsCount = trips?.length || 0;
    // Calculate moments from albums in trips
    const moments = (trips || []).reduce((sum, t) => {
      const albums = t.albums || [];
      const mediaCount = albums.reduce((albumSum, album) => albumSum + ((album.media || []).length), 0);
      return sum + mediaCount;
    }, 0);
    const followers = (user?.followers && typeof user.followers === 'object') 
      ? (Array.isArray(user.followers) ? user.followers.length : Object.keys(user.followers).length)
      : (user?.followers || 0);
    return { trips: tripsCount, moments, followers };
  }, [user, trips]);

  return (
    <>
      {user ? (
        <ProfileHeader
          cover={user.coverPhotoReference}
          avatar={user.avatarPhotoReference}
          name={user.displayName || user.firstName || user.username}
          username={user.username}
          description={user.description}
          isOwner={isOwner}
          isFollowing={isFollowing}
          isBlocked={isBlocked}
          onToggleFollow={onToggleFollow}
          onToggleBlock={onToggleBlock}
          onReport={onReport}
          onEdit={onEdit}
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
        <TText weight="medium">{tripsLabel}</TText>
        <View style={{ gap: spacing.md }}>
          {trips
            ? trips.slice(0, 3).map((t, i) => (
                <Link key={t.tripId || `trip-${i}`} href={`/trips/${t.tripId}`} asChild>
                  <Pressable>
                    <Card style={{ padding: 0 }}>
                      <Image 
                        source={t.coverPhotoUrl ? { uri: t.coverPhotoUrl } : require("../../../assets/cover-default.jpg")} 
                        style={{ width: "100%", height: 140 }} 
                      />
                      <View style={{ padding: spacing.lg }}>
                        <TText weight="bold">{t.title || "Untitled Trip"}</TText>
                        <TText dim>{t.description || ""}</TText>
                      </View>
                    </Card>
                  </Pressable>
                </Link>
              ))
            : Array.from({ length: 3 }).map((_, i) => (
                <Card key={`trip-skel-${i}`} style={{ padding: 0 }}>
                  <SkeletonRect height={140} />
                  <View style={{ padding: spacing.lg }}>
                    <SkeletonText lines={1} />
                    <SkeletonText lines={1} />
                  </View>
                </Card>
              ))}
        </View>

        {showMoreLink && (
          <Link href={showMoreLink} asChild>
            <Pressable>
              <TText weight="medium" style={{ color: colors.accent.primary }}>Show more →</TText>
            </Pressable>
          </Link>
        )}
      </View>
    </>
  );
}

