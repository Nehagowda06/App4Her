import React from "react";
import { StyleSheet, Text } from "react-native";

import type { Incident } from "../types";
import { formatTime, toTitleCase } from "../utils/formatters";
import { colors, spacing } from "../utils/theme";
import { Card } from "./Card";
import { PrimaryButton } from "./PrimaryButton";

type Props = {
  incident: Incident;
  onDelete: (incident: Incident) => void;
  deleting?: boolean;
};

export const IncidentCard = ({ incident, onDelete, deleting }: Props) => {
  const locationText = incident.location
    ? `${incident.location.latitude.toFixed(5)}, ${incident.location.longitude.toFixed(5)}`
    : "Location unavailable";

  return (
    <Card style={styles.card}>
      <Text style={styles.time}>{formatTime(incident.timestamp)}</Text>
      <Text style={styles.type}>{toTitleCase(incident.type)}</Text>
      <Text style={styles.location}>{locationText}</Text>
      {incident.description ? <Text style={styles.description}>{incident.description}</Text> : null}
      {incident.autoEvidence ? (
        <Text style={styles.evidence}>Evidence: {toTitleCase(incident.autoEvidence)}</Text>
      ) : null}
      <Text style={styles.retention}>
        {incident.manuallySaved
          ? "Saved permanently"
          : "Auto-delete in 30 days unless manually saved"}
      </Text>
      <PrimaryButton
        label={deleting ? "Deleting..." : "Delete"}
        onPress={() => onDelete(incident)}
        variant="secondary"
        disabled={deleting}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm
  },
  time: {
    color: colors.accent,
    fontWeight: "700"
  },
  type: {
    color: colors.textLight,
    fontWeight: "700"
  },
  location: {
    color: colors.textLight,
    fontWeight: "700"
  },
  description: {
    color: colors.textLight,
    lineHeight: 20
  },
  evidence: {
    color: colors.accent,
    fontWeight: "600"
  },
  retention: {
    color: colors.textLight,
    fontSize: 12
  }
});
