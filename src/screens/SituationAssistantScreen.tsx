import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppLayout } from "../components/AppLayout";
import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { PrimaryCardButton } from "../components/PrimaryCardButton";
import { locationShareController } from "../controllers/locationShareController";
import { safeHavenController } from "../controllers/safeHavenController";
import { situationController } from "../controllers/situationController";
import { safeNavigate } from "../navigation/safeNavigation";
import type { RootStackParamList } from "../navigation/types";
import { ensureSafetyStoreHydrated } from "../state/hydration";
import { colors, spacing } from "../utils/theme";

type SituationOption = {
  id: string;
  title: string;
  steps: string[];
};

const situationOptions: SituationOption[] = [
  {
    id: "following_me",
    title: "Someone is following me",
    steps: [
      "Move to a well lit or crowded area",
      "Enter a shop, mall, or restaurant",
      "Share your live location",
      "Use Fake Call to create an exit"
    ]
  },
  {
    id: "unsafe_cab",
    title: "I feel unsafe in a cab",
    steps: [
      "Check your route and compare it with your destination.",
      "Call a trusted contact and keep them on speaker.",
      "Ask to stop at a busy, well-lit place.",
      "Open Nearby Help and move to a safe haven."
    ]
  },
  {
    id: "alone_night",
    title: "I'm alone at night",
    steps: [
      "Stay in well-lit streets and avoid isolated shortcuts.",
      "Keep your phone ready and location sharing on.",
      "Identify the nearest staffed location.",
      "Activate Protection if your risk level increases."
    ]
  },
  {
    id: "being_watched",
    title: "Someone is watching me",
    steps: [
      "Change your direction and observe if they continue.",
      "Move toward nearby people or security staff.",
      "Share your live location with a trusted contact.",
      "Enter the nearest safe haven immediately."
    ]
  }
];

type Props = NativeStackScreenProps<RootStackParamList, "SituationAssistantScreen">;

export const SituationAssistantScreen = ({ navigation }: Props) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hydratingStore, setHydratingStore] = useState(true);
  const [actionLock, setActionLock] = useState<"fake" | "share" | "haven" | null>(null);
  const lockTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => {
      let mounted = true;
      const hydrate = async () => {
        try {
          await ensureSafetyStoreHydrated();
        } finally {
          if (mounted) {
            setHydratingStore(false);
          }
        }
      };
      hydrate().catch(() => {
        if (mounted) {
          setHydratingStore(false);
          setError("Something went wrong. Please try again.");
        }
      });
      return () => {
        mounted = false;
      };
    },
    []
  );

  React.useEffect(
    () => () => {
      if (lockTimer.current) {
        clearTimeout(lockTimer.current);
        lockTimer.current = null;
      }
    },
    []
  );

  const handleSelect = (option: SituationOption) => {
    const nextId = selectedId === option.id ? null : option.id;
    setSelectedId(nextId);
    situationController.selectSituation(nextId);
    setStatusMessage(null);
    setError(null);
  };

  const handleFakeCall = () => {
    if (actionLock || hydratingStore) {
      return;
    }
    setActionLock("fake");
    setError(null);
    safeNavigate(navigation, "FakeCallScreen", (message) => {
      setError(message);
    });
    lockTimer.current = setTimeout(() => {
      setActionLock(null);
      lockTimer.current = null;
    }, 300);
  };

  const handleShareLocation = async () => {
    if (actionLock || hydratingStore) {
      return;
    }
    setActionLock("share");
    setError(null);
    setStatusMessage(null);

    try {
      const result = await locationShareController.shareLocationWithTrustedContacts();
      if (!result.success || !result.mapLink) {
        setError(result.error ?? "Location unavailable.");
        return;
      }

      setStatusMessage("My current location shared with trusted contacts.");
      Alert.alert("My current location", result.mapLink, [{ text: "OK" }]);
    } catch {
      setError("Location unavailable.");
    } finally {
      setActionLock(null);
    }
  };

  const handleFindSafeHaven = async () => {
    if (actionLock || hydratingStore) {
      return;
    }
    setActionLock("haven");
    setError(null);
    setStatusMessage(null);

    try {
      await safeHavenController.loadNearbySafeHavens();
      safeNavigate(navigation, "SafeHavenScreen", (message) => {
        setError(message);
      });
    } catch {
      setError("Unable to load safe havens right now.");
    } finally {
      setActionLock(null);
    }
  };

  return (
    <AppLayout title="Situation Assistant">
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.questionText}>What is happening?</Text>
          <View style={styles.options}>
            {situationOptions.map((option) => {
              const expanded = option.id === selectedId;
              return (
                <View key={option.id} style={styles.optionBlock}>
                  <PrimaryCardButton
                    title={option.title}
                    onPress={() => handleSelect(option)}
                    style={styles.actionCard}
                  />

                  {expanded ? (
                    <Card style={styles.guidanceCard}>
                      <Text style={styles.guidanceTitle}>{option.title}</Text>
                      {option.steps.map((step) => (
                        <Text key={`${option.id}_${step}`} style={styles.stepItem}>
                          - {step}
                        </Text>
                      ))}

                      <View style={styles.actionButtons}>
                        <PrimaryButton
                          label={actionLock === "fake" ? "Opening..." : "Fake Call"}
                          onPress={handleFakeCall}
                          style={styles.quickAction}
                          disabled={Boolean(actionLock) || hydratingStore}
                        />
                        <PrimaryButton
                          label={actionLock === "share" ? "Sharing..." : "Share Location"}
                          onPress={() => {
                            handleShareLocation().catch(() => undefined);
                          }}
                          variant="secondary"
                          style={styles.quickAction}
                          disabled={Boolean(actionLock) || hydratingStore}
                        />
                        <PrimaryButton
                          label={actionLock === "haven" ? "Loading..." : "Find Safe Haven"}
                          onPress={() => {
                            handleFindSafeHaven().catch(() => undefined);
                          }}
                          style={styles.quickAction}
                          disabled={Boolean(actionLock) || hydratingStore}
                        />
                      </View>
                    </Card>
                  ) : null}
                </View>
              );
            })}
          </View>

          {statusMessage ? <Text style={styles.statusText}>{statusMessage}</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {hydratingStore ? <Text style={styles.statusText}>Loading saved safety data...</Text> : null}
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
  questionText: {
    color: colors.textDark,
    fontSize: 18,
    fontWeight: "700"
  },
  options: {
    gap: 16
  },
  optionBlock: {
    gap: spacing.sm
  },
  actionCard: {
    marginVertical: 0
  },
  guidanceCard: {
    gap: spacing.sm
  },
  guidanceTitle: {
    color: colors.textLight,
    fontSize: 17,
    fontWeight: "700"
  },
  stepItem: {
    color: colors.textLight,
    lineHeight: 22
  },
  actionButtons: {
    gap: 8,
    marginTop: 4
  },
  quickAction: {
    marginVertical: 0
  },
  statusText: {
    color: colors.textDark,
    fontWeight: "700"
  },
  errorText: {
    color: colors.primaryDark,
    fontWeight: "700"
  }
});


