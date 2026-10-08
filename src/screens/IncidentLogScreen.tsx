import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";

import { AppLayout } from "../components/AppLayout";
import { Card } from "../components/Card";
import { IncidentCard } from "../components/IncidentCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { incidentController } from "../controllers/incidentController";
import { useSafetyStore } from "../state/useSafetyStore";
import type { Incident, IncidentType } from "../types";
import { colors, radius, spacing } from "../utils/theme";

const incidentTypeOptions: IncidentType[] = ["manual_report", "emergency", "other"];

export const IncidentLogScreen = () => {
  const incidents = useSafetyStore((state) => state.incidents);
  const [description, setDescription] = useState("");
  const [incidentType, setIncidentType] = useState<IncidentType>("manual_report");
  const [manuallySaved, setManuallySaved] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingIncidentId, setDeletingIncidentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await incidentController.loadIncidents();
      } catch {
        setError("Unable to load incidents.");
      } finally {
        setLoading(false);
      }
    };
    load().catch(() => undefined);
  }, []);

  const handleCreateIncident = async () => {
    if (saving) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const result = await incidentController.logIncident({
        type: incidentType,
        description: description.trim() || undefined,
        autoEvidence: incidentType === "manual_report" ? "manual_report" : undefined,
        manuallySaved
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setDescription("");
      setIncidentType("manual_report");
      setManuallySaved(true);
    } catch {
      setError("Unable to save incident.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteIncident = async (incident: Incident) => {
    if (deletingIncidentId) {
      return;
    }

    setDeletingIncidentId(incident.id);
    try {
      const result = await incidentController.deleteIncident(incident.id);
      if (result.error) {
        setError(result.error);
      }
    } catch {
      setError("Unable to delete incident.");
    } finally {
      setDeletingIncidentId(null);
    }
  };

  return (
    <AppLayout title="Incident Log">
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.container}>
          <Card style={styles.formCard}>
            <Text style={styles.label}>Incident type</Text>
            <View style={styles.typeRow}>
              {incidentTypeOptions.map((type) => {
                const selected = incidentType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typePill, selected && styles.typePillActive]}
                    activeOpacity={0.7}
                    onPress={() => setIncidentType(type)}
                  >
                    <Text style={[styles.typeText, selected && styles.typeTextActive]}>
                      {type.replace("_", " ")}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              placeholder="Describe what happened..."
              placeholderTextColor={colors.textDark}
              style={styles.input}
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Save permanently</Text>
              <Switch
                value={manuallySaved}
                onValueChange={setManuallySaved}
                thumbColor={manuallySaved ? colors.primary : "#ECECEC"}
                trackColor={{ true: "#C9B5D6", false: "#C8C8C8" }}
              />
            </View>

            <PrimaryButton
              label={saving ? "Saving..." : "Create Incident"}
              onPress={() => {
                handleCreateIncident().catch(() => undefined);
              }}
              disabled={saving}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </Card>

          {loading ? <Text style={styles.meta}>Loading incidents...</Text> : null}
          {!loading && incidents.length === 0 ? (
            <Text style={styles.meta}>No incidents recorded yet.</Text>
          ) : null}

          {incidents.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              deleting={deletingIncidentId === incident.id}
              onDelete={(selectedIncident) => {
                handleDeleteIncident(selectedIncident).catch(() => undefined);
              }}
            />
          ))}
        </ScrollView>
      </View>
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
  formCard: {
    gap: spacing.sm
  },
  label: {
    color: colors.textLight,
    fontWeight: "700"
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  typePill: {
    borderWidth: 1,
    borderColor: "#FFFFFF66",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF22"
  },
  typePillActive: {
    borderColor: colors.accentSoft,
    backgroundColor: colors.accentSoft
  },
  typeText: {
    color: colors.textLight,
    fontWeight: "600",
    textTransform: "capitalize"
  },
  typeTextActive: {
    color: colors.textDark
  },
  input: {
    borderWidth: 1.2,
    borderColor: colors.accentSoft,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.sm,
    padding: spacing.md,
    color: colors.textDark,
    minHeight: 120,
    textAlignVertical: "top"
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4
  },
  switchLabel: {
    color: colors.textLight,
    fontWeight: "600"
  },
  meta: {
    color: colors.textDark,
    fontWeight: "700"
  },
  error: {
    color: colors.primaryDark,
    fontWeight: "700"
  }
});
