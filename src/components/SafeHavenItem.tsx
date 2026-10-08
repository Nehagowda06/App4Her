import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { safeHavenService } from "../services/safeHavenService";
import type { SafeHavenWithDistance } from "../types";
import { toTitleCase } from "../utils/formatters";
import { colors, spacing } from "../utils/theme";
import { Card } from "./Card";
import { PrimaryButton } from "./PrimaryButton";

type Props = {
  haven: SafeHavenWithDistance;
  onNavigate: (haven: SafeHavenWithDistance) => void;
};

export const SafeHavenItem = ({ haven, onNavigate }: Props) => (
  <Card style={styles.card}>
    <View style={styles.row}>
      <Text style={styles.name}>{haven.name}</Text>
      <Text style={styles.distance}>{safeHavenService.formatDistance(haven.distanceMeters)}</Text>
    </View>
    <Text style={styles.meta}>{toTitleCase(haven.type)}</Text>
    <PrimaryButton
      label="Open Directions"
      onPress={() => onNavigate(haven)}
      style={styles.button}
      variant="secondary"
    />
  </Card>
);

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: colors.textLight
  },
  distance: {
    color: colors.accent,
    fontWeight: "700"
  },
  meta: {
    color: colors.accent,
    fontWeight: "600"
  },
  button: {
    marginTop: spacing.xs
  }
});
