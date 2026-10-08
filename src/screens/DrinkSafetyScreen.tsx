import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppLayout } from "../components/AppLayout";
import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { incidentController } from "../controllers/incidentController";
import type { RootStackParamList } from "../navigation/types";
import { useSafetyStore } from "../state/useSafetyStore";
import { colors, spacing } from "../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "DrinkSafetyScreen">;
type DrinkMode = "photo_scan" | "quick_visual" | "full_guide";

const quickChecklist = [
  "Drink left unattended?",
  "Strange smell?",
  "Cloudy appearance?",
  "Unusual bubbles?"
];

const fullGuideSteps = [
  "Never accept open drinks",
  "Watch bartender prepare drink",
  "Use drink cover if available",
  "Avoid sharing drinks",
  "If taste changes suddenly → stop drinking"
];

export const DrinkSafetyScreen = ({ navigation, route }: Props) => {
  const autoIncidentLogging = useSafetyStore((state) => state.settings.autoIncidentLogging);
  const [selectedMode, setSelectedMode] = React.useState<DrinkMode | null>(null);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [photoSuspicious, setPhotoSuspicious] = React.useState(false);
  const [photoNote, setPhotoNote] = React.useState("");
  const [quickFlags, setQuickFlags] = React.useState<Record<string, boolean>>({});
  const [fullSuspicious, setFullSuspicious] = React.useState(false);
  const [fullNotes, setFullNotes] = React.useState("");
  const quickAutoLoggedRef = React.useRef(false);
  const photoAutoLoggedRef = React.useRef(false);
  const fullAutoLoggedRef = React.useRef(false);

  const capturedImageUri = route.params?.capturedImageUri;

  const hasQuickFlag = quickChecklist.some((item) => quickFlags[item]);

  React.useEffect(() => {
    if (!hasQuickFlag) {
      quickAutoLoggedRef.current = false;
      return;
    }

    if (hasQuickFlag && autoIncidentLogging && !quickAutoLoggedRef.current) {
      quickAutoLoggedRef.current = true;
      incidentController
        .logIncident({
          type: "drink_scan",
          description: "Feature used: Drink Safety Check (Quick Visual Guide).",
          autoEvidence: "drink_scan",
          manuallySaved: false
        })
        .catch(() => undefined);
    }
  }, [hasQuickFlag, autoIncidentLogging]);

  React.useEffect(() => {
    if (route.params?.capturedMode === "drink_scan" && capturedImageUri) {
      setSelectedMode("photo_scan");
      setStatusMessage("Drink photo captured. Review indicators below.");
    }
  }, [capturedImageUri, route.params?.capturedMode]);

  React.useEffect(() => {
    if (!photoSuspicious) {
      photoAutoLoggedRef.current = false;
      return;
    }

    if (autoIncidentLogging && !photoAutoLoggedRef.current) {
      photoAutoLoggedRef.current = true;
      incidentController
        .logIncident({
          type: "drink_scan",
          description: `Feature used: Drink Safety Check (Photo Scan). ${photoNote.trim()}`.trim(),
          autoEvidence: "drink_scan",
          manuallySaved: false
        })
        .catch(() => undefined);
    }
  }, [autoIncidentLogging, photoNote, photoSuspicious]);

  React.useEffect(() => {
    if (!fullSuspicious) {
      fullAutoLoggedRef.current = false;
      return;
    }

    if (autoIncidentLogging && !fullAutoLoggedRef.current) {
      fullAutoLoggedRef.current = true;
      incidentController
        .logIncident({
          type: "drink_scan",
          description: `Feature used: Drink Safety Check (Full Guide). ${fullNotes.trim()}`.trim(),
          autoEvidence: "drink_scan",
          manuallySaved: false
        })
        .catch(() => undefined);
    }
  }, [autoIncidentLogging, fullNotes, fullSuspicious]);

  const saveSuspicious = async (note: string, manuallySaved: boolean) => {
    if (isProcessing) {
      return;
    }
    setIsProcessing(true);
    try {
      const result = await incidentController.logIncident({
        type: "drink_scan",
        description: `Feature used: Drink Safety Check. ${note.trim()}`.trim(),
        autoEvidence: "drink_scan",
        manuallySaved
      });
      if (result.error) {
        setStatusMessage(result.error);
      } else {
        setStatusMessage("Suspicious finding logged to Incident Log.");
      }
    } catch {
      setStatusMessage("Unable to log incident right now.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AppLayout title="Drink Safety Check">
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.container}>
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Choose inspection level:</Text>
            <View style={styles.modeList}>
              <PrimaryButton
                label="1. Photo Scan"
                onPress={() => setSelectedMode("photo_scan")}
                variant={selectedMode === "photo_scan" ? "primary" : "secondary"}
                style={styles.modeButton}
              />
              <PrimaryButton
                label="2. Quick Visual Guide"
                onPress={() => setSelectedMode("quick_visual")}
                variant={selectedMode === "quick_visual" ? "primary" : "secondary"}
                style={styles.modeButton}
              />
              <PrimaryButton
                label="3. Full Drink Safety Guide"
                onPress={() => setSelectedMode("full_guide")}
                variant={selectedMode === "full_guide" ? "primary" : "secondary"}
                style={styles.modeButton}
              />
            </View>
          </Card>

          {selectedMode === "photo_scan" ? (
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Photo Scan</Text>
              <PrimaryButton
                label="Capture Drink Photo"
                onPress={() =>
                  navigation.navigate("CameraScreen", {
                    mode: "drink_scan",
                    returnTo: "DrinkSafetyScreen"
                  })
                }
              />

              {capturedImageUri ? (
                <Image source={{ uri: capturedImageUri }} style={styles.preview} />
              ) : null}

              <Text style={styles.bodyText}>• Look for unusual color</Text>
              <Text style={styles.bodyText}>• Look for floating residue</Text>
              <Text style={styles.bodyText}>• Look for oily film</Text>

              <TextInput
                value={photoNote}
                onChangeText={setPhotoNote}
                placeholder="Optional notes"
                placeholderTextColor="#7A7A7A"
                style={styles.noteInput}
              />

              <View style={styles.toggleRow}>
                <Text style={styles.bodyText}>Something suspicious</Text>
                <Switch
                  value={photoSuspicious}
                  onValueChange={setPhotoSuspicious}
                  thumbColor={photoSuspicious ? colors.primary : "#ECECEC"}
                  trackColor={{ true: "#C9B5D6", false: "#C8C8C8" }}
                />
              </View>

              <PrimaryButton
                label="Drink looks safe"
                onPress={() => setStatusMessage("Drink marked safe.")}
                variant="secondary"
              />
              <PrimaryButton
                label="Something suspicious"
                onPress={() => {
                  setPhotoSuspicious(true);
                  setStatusMessage("Suspicious drink indicator marked.");
                }}
                disabled={isProcessing}
              />
            </Card>
          ) : null}

          {selectedMode === "quick_visual" ? (
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Quick Visual Guide</Text>
              {quickChecklist.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.checkRow}
                  activeOpacity={0.7}
                  onPress={() =>
                    setQuickFlags((prev) => ({
                      ...prev,
                      [item]: !prev[item]
                    }))
                  }
                >
                  <Text style={styles.bodyText}>• {item}</Text>
                  <Text style={styles.checkText}>{quickFlags[item] ? "Flagged" : "Mark"}</Text>
                </TouchableOpacity>
              ))}

              {hasQuickFlag ? (
                <Text style={styles.warning}>
                  Warning: One or more risk indicators were flagged.
                </Text>
              ) : null}
            </Card>
          ) : null}

          {selectedMode === "full_guide" ? (
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Full Drink Safety Guide</Text>
              {fullGuideSteps.map((step) => (
                <Text key={step} style={styles.bodyText}>
                  • {step}
                </Text>
              ))}

              <TextInput
                value={fullNotes}
                onChangeText={setFullNotes}
                placeholder="Notes"
                placeholderTextColor="#7A7A7A"
                multiline
                numberOfLines={4}
                style={[styles.noteInput, styles.multiline]}
              />

              <View style={styles.toggleRow}>
                <Text style={styles.bodyText}>Suspicious signs detected</Text>
                <Switch
                  value={fullSuspicious}
                  onValueChange={setFullSuspicious}
                  thumbColor={fullSuspicious ? colors.primary : "#ECECEC"}
                  trackColor={{ true: "#C9B5D6", false: "#C8C8C8" }}
                />
              </View>

              <PrimaryButton
                label="Save Guide Result"
                onPress={() => {
                  if (!fullSuspicious) {
                    setStatusMessage("No suspicious signs marked.");
                    return;
                  }
                  saveSuspicious(fullNotes, true).catch(() => undefined);
                }}
                disabled={isProcessing}
              />
            </Card>
          ) : null}

          {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}
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
  card: {
    gap: spacing.sm
  },
  sectionTitle: {
    color: colors.textLight,
    fontSize: 18,
    fontWeight: "700"
  },
  bodyText: {
    color: colors.textLight,
    lineHeight: 20,
    flex: 1
  },
  warning: {
    color: colors.primaryDark,
    fontWeight: "700"
  },
  modeList: {
    gap: 8
  },
  modeButton: {
    marginVertical: 0
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  checkText: {
    color: colors.accentSoft,
    fontWeight: "700"
  },
  noteInput: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E3E3E3",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    color: "#222"
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: "top",
    paddingTop: 12
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  preview: {
    width: "100%",
    height: 180,
    borderRadius: 12
  },
  status: {
    color: colors.textDark,
    fontWeight: "700",
    textAlign: "center"
  }
});
