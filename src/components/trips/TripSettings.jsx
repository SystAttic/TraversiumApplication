import React from "react";
import { View, Image, ScrollView } from "react-native";
import Card from "../Card";
import TText from "../TText";
import Button from "../Button";
import { spacing } from "../../theme/spacing";
import { useTheme } from "../../theme";

export default function TripSettings({ trip }) {
  const { colors } = useTheme();
  const canEdit = !!trip?.isCollaborator;

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xl }}>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <Image source={{ uri: trip?.coverUri }} style={{ width:"100%", height: 120 }} />
        <View style={{ padding: spacing.lg }}>
          <TText weight="bold">Cover Photo</TText>
          <TText dim size="sm">Shown at the top of the trip.</TText>
          <View style={{ marginTop: spacing.sm }}>
            <Button title="Change cover" onPress={() => {}} disabled={!canEdit} />
          </View>
        </View>
      </Card>

      <Card>
        <TText weight="bold">Basics</TText>
        <TText dim size="sm" style={{ marginTop: 4 }}>Title: {trip?.title}</TText>
        <TText dim size="sm">Visibility: {trip?.visibility}</TText>
        <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
          <Button title="Edit title" onPress={() => {}} disabled={!canEdit} />
          <Button title="Toggle visibility" variant="outline" onPress={() => {}} disabled={!canEdit} />
        </View>
      </Card>

      <Card>
        <TText weight="bold">Members</TText>
        <TText dim size="sm" style={{ marginTop: 4 }}>Collaborators</TText>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
          {(trip?.collaborators || []).map(c => (
            <View key={c.id} style={{ paddingHorizontal: 10, paddingVertical: 6, borderWidth:1, borderColor: colors.border, borderRadius: 999 }}>
              <TText size="sm">{c.displayName}</TText>
            </View>
          ))}
        </View>
        <View style={{ flexDirection:"row", gap: spacing.sm, marginTop: spacing.sm }}>
          <Button title="Manage collaborators" onPress={() => {}} disabled={!canEdit} />
          <Button title="Manage viewers" variant="outline" onPress={() => {}} disabled={!canEdit} />
        </View>
      </Card>

      {!canEdit && (
        <TText dim size="sm">
          You’re viewing as a viewer. Editing is disabled.
        </TText>
      )}
    </ScrollView>
  );
}
