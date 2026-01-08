import React from "react";
import { View } from "react-native";
import Card from "../Card";
import TText from "../TText";
import { spacing, radii } from "../../theme/spacing";
import { useTheme } from "../../theme";
import { getMediaFileUrl } from "../../services/fileStorageApi";
import AuthenticatedImage from "../AuthenticatedImage";
import AuthenticatedImageBackground from "../AuthenticatedImageBackground";

export default function TripHeader({ trip }) {
  const { colors } = useTheme();
  const safeTitle = trip?.title ?? "Trip";
  const safeDesc = trip?.description ?? "";
  const collabs = Array.isArray(trip?.collaborators) ? trip.collaborators.slice(0,4) : [];
  const moments = trip?.stats?.moments ?? 0;
  const media = trip?.stats?.media ?? 0;

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <AuthenticatedImageBackground
        source={{ uri: trip?.coverUri }}
        style={{ width: "100%", height: 160, backgroundColor: colors.bg.layer3 }}
        imageStyle={{ opacity: 0.9 }}
      />
      <View style={{ padding: spacing.lg, gap: spacing.xs }}>
        <TText weight="bold" size="lg">{safeTitle}</TText>
        {!!safeDesc && <TText dim>{safeDesc}</TText>}

        <View style={{ flexDirection: "row", alignItems: "center", marginTop: spacing.sm }}>
          {/* avatars */}
          <View style={{ flexDirection: "row" }}>
            {collabs.map((c, idx) => {
              const avatarUri = c.avatarPhotoReference 
                ? getMediaFileUrl(c.avatarPhotoReference)
                : c.avatar 
                ? getMediaFileUrl(c.avatar)
                : null;
              
              return avatarUri ? (
                <AuthenticatedImage
                  key={c.id}
                  source={{ uri: avatarUri }}
                  style={{
                    width: 28, height: 28, borderRadius: 999,
                    borderWidth: 2, borderColor: colors.bg.layer1,
                    marginLeft: idx === 0 ? 0 : -8,
                  }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  key={c.id}
                  style={{
                    width: 28, height: 28, borderRadius: 999,
                    borderWidth: 2, borderColor: colors.bg.layer1,
                    marginLeft: idx === 0 ? 0 : -8,
                    backgroundColor: colors.bg.layer3,
                  }}
                />
              );
            })}
          </View>
          <TText dim style={{ marginLeft: spacing.sm }}>
            {moments} moments · {media} media
          </TText>
        </View>
      </View>
    </Card>
  );
}
