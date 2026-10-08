import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppLayout } from "../components/AppLayout";
import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { PrimaryCardButton } from "../components/PrimaryCardButton";
import { protectionController } from "../controllers/protectionController";
import type { RootStackParamList } from "../navigation/types";
import { safeNavigate } from "../navigation/safeNavigation";
import { colors, spacing } from "../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "SafetyToolsScreen">;

const timerPresets = [60, 180, 300];

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
};

export const SafetyToolsScreen = ({ navigation }: Props) => {
  const [timerPreset, setTimerPreset] = useState(180);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const [timerExpired, setTimerExpired] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (timerRemaining === null || timerRemaining <= 0) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setTimerRemaining((prev) => {
        if (prev === null) {
          return null;
        }
        return Math.max(prev - 1, 0);
      });
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [timerRemaining]);

  useEffect(() => {
    if (timerRemaining !== 0 || timerExpired) {
      return;
    }

    setTimerExpired(true);
    setTimerRemaining(null);
    setStatusMessage("Safety alert triggered. Protection mode activated.");

    Alert.alert(
      "Safety Timer Expired",
      "Protection mode has been activated because the timer was not canceled."
    );

    const activateProtection = async () => {
      try {
        const result = await protectionController.activateProtectionMode();
        if (result.error) {
          setStatusMessage("Something went wrong. Please try again.");
          return;
        }
        if (result.dialerError) {
          setStatusMessage(result.dialerError);
        }
      } catch {
        setStatusMessage("Something went wrong. Please try again.");
      }
    };

    activateProtection().catch(() => undefined);
  }, [timerRemaining, timerExpired]);

  const startSafetyTimer = () => {
    setTimerExpired(false);
    setStatusMessage(null);
    setTimerRemaining(timerPreset);
  };

  const cancelSafetyTimer = () => {
    setTimerRemaining(null);
    setTimerExpired(false);
    setStatusMessage("Safety timer canceled.");
  };

  return (
    <AppLayout title="Safety Tools">
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.actions}>
            <PrimaryCardButton
              title="Room Safety Check"
              subtitle="Run quick, guided, or full room inspection"
              onPress={() => safeNavigate(navigation, "RoomSafetyScreen")}
              style={styles.actionCard}
            />
            <PrimaryCardButton
              title="Drink Safety Check"
              subtitle="Use photo scan or safety guides"
              onPress={() => safeNavigate(navigation, "DrinkSafetyScreen")}
              style={styles.actionCard}
            />
            <PrimaryCardButton
              title="Incident Photo"
              subtitle="Capture evidence photo on a dedicated camera screen"
              onPress={() => navigation.navigate("CameraScreen", { mode: "incident_photo" })}
              style={styles.actionCard}
            />
            <PrimaryCardButton
              title="Incident Log"
              subtitle="Create and manage structured incident records"
              onPress={() => safeNavigate(navigation, "IncidentLogScreen")}
              style={styles.actionCard}
            />
          </View>

          <Card style={styles.timerCard}>
            <Text style={styles.timerTitle}>Safety Timer</Text>
            <Text style={styles.infoText}>Set a timer and trigger protection if unattended.</Text>

            <View style={styles.presetRow}>
              {timerPresets.map((preset) => {
                const activePreset = timerPreset === preset;
                return (
                  <TouchableOpacity
                    key={preset}
                    style={[styles.presetButton, activePreset && styles.presetButtonActive]}
                    activeOpacity={0.7}
                    onPress={() => setTimerPreset(preset)}
                  >
                    <Text style={[styles.presetText, activePreset && styles.presetTextActive]}>
                      {Math.floor(preset / 60)} min
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <PrimaryButton
              label={
                timerRemaining !== null
                  ? `Running: ${formatDuration(timerRemaining)}`
                  : "Start Safety Timer"
              }
              onPress={startSafetyTimer}
              disabled={timerRemaining !== null}
            />
            <PrimaryButton
              label="Cancel Timer"
              onPress={cancelSafetyTimer}
              variant="secondary"
              disabled={timerRemaining === null}
            />

            {statusMessage ? <Text style={styles.statusText}>{statusMessage}</Text> : null}
            {timerExpired ? (
              <Text style={styles.alertText}>
                Alert triggered due to timer expiry. Stay in a populated area.
              </Text>
            ) : null}
          </Card>
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
  actions: {
    gap: spacing.md
  },
  actionCard: {
    width: "85%",
    alignSelf: "center",
    marginVertical: 0
  },
  timerCard: {
    gap: spacing.sm
  },
  timerTitle: {
    color: colors.textLight,
    fontSize: 20,
    fontWeight: "700"
  },
  infoText: {
    color: colors.textLight,
    fontWeight: "600"
  },
  presetRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  presetButton: {
    backgroundColor: colors.accentSoft,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1.2,
    borderColor: colors.primary
  },
  presetButtonActive: {
    backgroundColor: colors.primary
  },
  presetText: {
    color: "#29104A",
    fontWeight: "700"
  },
  presetTextActive: {
    color: "#FFFFFF"
  },
  statusText: {
    color: colors.accentSoft,
    fontWeight: "700"
  },
  alertText: {
    color: colors.textLight,
    fontWeight: "700"
  }
});
