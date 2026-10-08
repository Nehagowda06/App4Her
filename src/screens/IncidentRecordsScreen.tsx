import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { AppLayout } from "../components/AppLayout";
import { PrimaryButton } from "../components/PrimaryButton";
import { incidentController } from "../controllers/incidentController";
import { useSafetyStore } from "../state/useSafetyStore";
import type { Incident } from "../types";
import { colors, shadows, spacing, typography } from "../utils/theme";
import { toTitleCase } from "../utils/formatters";

const formatIncidentDate = (timestamp: string) => new Date(timestamp).toLocaleString();

const formatIncidentLocation = (incident: Incident) => {
  if (!incident.location) {
    return "Location unavailable";
  }
  return `${incident.location.latitude.toFixed(5)}, ${incident.location.longitude.toFixed(5)}`;
};

const retentionLabel = (incident: Incident) =>
  incident.manuallySaved ? "Saved permanently" : "Auto-delete in 30 days";

export const IncidentRecordsScreen = () => {
  const incidents = useSafetyStore((state) => state.incidents);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [deletingIncidentId, setDeletingIncidentId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        await incidentController.loadIncidents();
      } catch {
        setError("Unable to load incident records.");
      } finally {
        setLoading(false);
      }
    };
    load().catch(() => undefined);
  }, []);

  const selectedIncident = useMemo(
    () => incidents.find((incident) => incident.id === selectedIncidentId) ?? null,
    [incidents, selectedIncidentId]
  );

  const handleDelete = async (incidentId: string) => {
    if (deletingIncidentId) {
      return;
    }

    setDeletingIncidentId(incidentId);
    try {
      const result = await incidentController.deleteIncident(incidentId);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (selectedIncidentId === incidentId) {
        setSelectedIncidentId(null);
      }
    } catch {
      setError("Unable to delete incident.");
    } finally {
      setDeletingIncidentId(null);
    }
  };

  return (
    <AppLayout title="Incident Records">
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.container}>
          {loading ? <Text style={styles.meta}>Loading incidents...</Text> : null}
          {!loading && incidents.length === 0 ? (
            <Text style={styles.meta}>No incidents recorded yet.</Text>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {incidents.map((incident) => (
            <View key={incident.id} style={styles.incidentCard}>
              <Text style={styles.cardLabel}>Date</Text>
              <Text style={styles.cardValue}>{formatIncidentDate(incident.timestamp)}</Text>

              <Text style={[styles.cardLabel, styles.cardSection]}>Type</Text>
              <Text style={styles.cardValue}>{toTitleCase(incident.type)}</Text>

              <Text style={[styles.cardLabel, styles.cardSection]}>Location</Text>
              <Text style={styles.cardValue}>{formatIncidentLocation(incident)}</Text>

              <Text style={[styles.cardLabel, styles.cardSection]}>Description</Text>
              <Text style={styles.cardValue}>{incident.description || "No description added."}</Text>

              <Text style={[styles.cardLabel, styles.cardSection]}>Evidence</Text>
              <Text style={styles.cardValue}>
                {incident.autoEvidence ? toTitleCase(incident.autoEvidence) : "None"}
              </Text>

              <Text style={[styles.cardLabel, styles.cardSection]}>Retention</Text>
              <Text style={styles.cardValue}>{retentionLabel(incident)}</Text>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.viewButton]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedIncidentId(incident.id)}
                >
                  <Text style={styles.actionButtonText}>View incident</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  activeOpacity={0.7}
                  disabled={Boolean(deletingIncidentId)}
                  onPress={() => {
                    handleDelete(incident.id).catch(() => {
                      setError("Unable to delete incident.");
                    });
                  }}
                >
                  <Text style={styles.actionButtonText}>
                    {deletingIncidentId === incident.id ? "Deleting..." : "Delete incident"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      <Modal
        visible={Boolean(selectedIncident)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedIncidentId(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Incident Details</Text>
            {selectedIncident ? (
              <>
                <Text style={styles.modalText}>
                  Date: {formatIncidentDate(selectedIncident.timestamp)}
                </Text>
                <Text style={styles.modalText}>Type: {toTitleCase(selectedIncident.type)}</Text>
                <Text style={styles.modalText}>
                  Location: {formatIncidentLocation(selectedIncident)}
                </Text>
                <Text style={styles.modalText}>
                  Description: {selectedIncident.description || "No description added."}
                </Text>
                <Text style={styles.modalText}>
                  Evidence:{" "}
                  {selectedIncident.autoEvidence
                    ? toTitleCase(selectedIncident.autoEvidence)
                    : "None"}
                </Text>
                <Text style={styles.modalText}>{retentionLabel(selectedIncident)}</Text>
              </>
            ) : null}
            <PrimaryButton
              label="Close"
              onPress={() => setSelectedIncidentId(null)}
              variant="secondary"
            />
          </View>
        </View>
      </Modal>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1
  },
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl
  },
  meta: {
    ...typography.body
  },
  error: {
    ...typography.body,
    color: colors.primaryDark
  },
  incidentCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 18,
    padding: 20,
    gap: spacing.xs,
    ...shadows.card
  },
  cardLabel: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.2
  },
  cardValue: {
    ...typography.body,
    color: colors.textLight
  },
  cardSection: {
    marginTop: 6
  },
  actionsRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: spacing.sm
  },
  actionButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10
  },
  viewButton: {
    backgroundColor: colors.primary
  },
  deleteButton: {
    backgroundColor: colors.primaryDark
  },
  actionButtonText: {
    ...typography.button
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000099",
    justifyContent: "flex-end"
  },
  modalCard: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: spacing.sm
  },
  modalTitle: {
    ...typography.title,
    color: colors.textLight
  },
  modalText: {
    ...typography.body,
    color: colors.textLight
  }
});
