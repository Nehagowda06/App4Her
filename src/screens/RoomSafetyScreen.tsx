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
import { roomSafetyService } from "../services/roomSafetyService";
import { useSafetyStore } from "../state/useSafetyStore";
import { colors, spacing } from "../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "RoomSafetyScreen">;
type RoomMode = "quick_scan" | "guided_check" | "full_inspection";

const guidedSteps = [
  "Check behind mirrors",
  "Check inside smoke detectors",
  "Check air vents",
  "Check charging ports",
  "Turn off lights and look for blinking LEDs",
  "Use phone flashlight to inspect surfaces"
];

const fullInspectionSteps = [
  "Scan WiFi and Bluetooth",
  "Use camera to inspect suspicious objects",
  "Look for hidden cameras using flashlight reflection",
  "Check for unusual wires or new electronics",
  "Listen for faint buzzing sounds"
];

export const RoomSafetyScreen = ({ navigation, route }: Props) => {
  const autoIncidentLogging = useSafetyStore((state) => state.settings.autoIncidentLogging);
  const [selectedMode, setSelectedMode] = React.useState<RoomMode | null>(null);
  const [scanNetworks, setScanNetworks] = React.useState<string[]>([]);
  const [scanDevices, setScanDevices] = React.useState<string[]>([]);
  const [scanWarning, setScanWarning] = React.useState<string | null>(null);
  const [guidedChecks, setGuidedChecks] = React.useState<Record<string, boolean>>({});
  const [fullChecks, setFullChecks] = React.useState<Record<string, boolean>>({});
  const [inspectionNotes, setInspectionNotes] = React.useState("");
  const [quickNotes, setQuickNotes] = React.useState("");
  const [fullSuspicious, setFullSuspicious] = React.useState(false);
  const [quickSuspicious, setQuickSuspicious] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const quickAutoLoggedRef = React.useRef(false);
  const fullAutoLoggedRef = React.useRef(false);

  const capturedImageUri = route.params?.capturedImageUri;

  const toggleGuidedStep = (step: string) => {
    setGuidedChecks((prev) => ({
      ...prev,
      [step]: !prev[step]
    }));
  };

  const toggleFullStep = (step: string) => {
    setFullChecks((prev) => ({
      ...prev,
      [step]: !prev[step]
    }));
  };

  const runQuickScan = async () => {
    if (isProcessing) {
      return;
    }
    setIsProcessing(true);
    try {
      const result = await roomSafetyService.runQuickScan();
      setScanNetworks(result.networks);
      setScanDevices(result.bluetoothDevices);
      setScanWarning(result.warning);
      setQuickSuspicious(result.suspicious);
    } catch {
      setStatusMessage("Quick scan failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const saveSuspiciousFinding = async () => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    try {
      const result = await incidentController.logIncident({
        type: "room_scan",
        description: `Feature used: Room Safety Check (Full Inspection). ${inspectionNotes.trim()}`.trim(),
        autoEvidence: "room_scan",
        manuallySaved: true
      });
      if (result.error) {
        setStatusMessage(result.error);
      } else {
        setStatusMessage("Suspicious finding logged to Incident Log.");
      }
    } catch {
      setStatusMessage("Unable to save incident.");
    } finally {
      setIsProcessing(false);
    }
  };

  React.useEffect(() => {
    if (route.params?.capturedMode === "room_scan" && capturedImageUri) {
      setStatusMessage("Camera inspection captured. Continue full inspection steps.");
    }
  }, [capturedImageUri, route.params?.capturedMode]);

  React.useEffect(() => {
    if (!quickSuspicious) {
      quickAutoLoggedRef.current = false;
      return;
    }

    if (autoIncidentLogging && !quickAutoLoggedRef.current) {
      quickAutoLoggedRef.current = true;
      incidentController
        .logIncident({
          type: "room_scan",
          description: `Feature used: Room Safety Check (Quick Scan). ${quickNotes.trim()}`.trim(),
          autoEvidence: "room_scan",
          manuallySaved: false
        })
        .catch(() => undefined);
    }
  }, [autoIncidentLogging, quickNotes, quickSuspicious]);

  React.useEffect(() => {
    if (!fullSuspicious) {
      fullAutoLoggedRef.current = false;
      return;
    }

    if (autoIncidentLogging && !fullAutoLoggedRef.current) {
      fullAutoLoggedRef.current = true;
      incidentController
        .logIncident({
          type: "room_scan",
          description: `Feature used: Room Safety Check (Full Inspection). ${inspectionNotes.trim()}`.trim(),
          autoEvidence: "room_scan",
          manuallySaved: false
        })
        .catch(() => undefined);
    }
  }, [autoIncidentLogging, fullSuspicious, inspectionNotes]);

  return (
    <AppLayout title="Room Safety Check">
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.container}>
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Choose inspection level:</Text>
            <View style={styles.modeList}>
              <PrimaryButton
                label="1. Quick Scan"
                onPress={() => setSelectedMode("quick_scan")}
                variant={selectedMode === "quick_scan" ? "primary" : "secondary"}
                style={styles.modeButton}
              />
              <PrimaryButton
                label="2. Guided Check"
                onPress={() => setSelectedMode("guided_check")}
                variant={selectedMode === "guided_check" ? "primary" : "secondary"}
                style={styles.modeButton}
              />
              <PrimaryButton
                label="3. Full Safety Inspection"
                onPress={() => setSelectedMode("full_inspection")}
                variant={selectedMode === "full_inspection" ? "primary" : "secondary"}
                style={styles.modeButton}
              />
            </View>
          </Card>

          {selectedMode === "quick_scan" ? (
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Quick Scan</Text>
              <PrimaryButton
                label={isProcessing ? "Scanning..." : "Run Network + Device Scan"}
                onPress={() => {
                  runQuickScan().catch(() => undefined);
                }}
                disabled={isProcessing}
              />
              <Text style={styles.subTitle}>Detected networks</Text>
              {scanNetworks.length > 0 ? (
                scanNetworks.map((entry) => (
                  <Text key={entry} style={styles.bodyText}>
                    • {entry}
                  </Text>
                ))
              ) : (
                <Text style={styles.bodyText}>No network data yet.</Text>
              )}
              <Text style={styles.subTitle}>Detected devices</Text>
              {scanDevices.length > 0 ? (
                scanDevices.map((entry) => (
                  <Text key={entry} style={styles.bodyText}>
                    • {entry}
                  </Text>
                ))
              ) : (
                <Text style={styles.bodyText}>No device data yet.</Text>
              )}
              {scanWarning ? <Text style={styles.warning}>{scanWarning}</Text> : null}
              <TextInput
                value={quickNotes}
                onChangeText={setQuickNotes}
                placeholder="Optional notes"
                placeholderTextColor="#7A7A7A"
                style={styles.noteInput}
              />
              <View style={styles.toggleRow}>
                <Text style={styles.bodyText}>Mark suspicious</Text>
                <Switch
                  value={quickSuspicious}
                  onValueChange={setQuickSuspicious}
                  thumbColor={quickSuspicious ? colors.primary : "#ECECEC"}
                  trackColor={{ true: "#C9B5D6", false: "#C8C8C8" }}
                />
              </View>
              <PrimaryButton
                label="Save Suspicious Finding"
                onPress={() => {
                  if (!quickSuspicious) {
                    setStatusMessage("Mark suspicious to save an incident.");
                    return;
                  }
                  saveSuspiciousFinding().catch(() => undefined);
                }}
                variant="secondary"
                disabled={isProcessing}
              />
            </Card>
          ) : null}

          {selectedMode === "guided_check" ? (
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Guided Check</Text>
              {guidedSteps.map((step) => (
                <TouchableOpacity
                  key={step}
                  style={styles.checkRow}
                  activeOpacity={0.7}
                  onPress={() => toggleGuidedStep(step)}
                >
                  <Text style={styles.bodyText}>• {step}</Text>
                  <Text style={styles.checkText}>{guidedChecks[step] ? "✔ Checked" : "Mark"}</Text>
                </TouchableOpacity>
              ))}
            </Card>
          ) : null}

          {selectedMode === "full_inspection" ? (
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Full Safety Inspection</Text>
              {fullInspectionSteps.map((step) => (
                <TouchableOpacity
                  key={step}
                  style={styles.checkRow}
                  activeOpacity={0.7}
                  onPress={() => toggleFullStep(step)}
                >
                  <Text style={styles.bodyText}>• {step}</Text>
                  <Text style={styles.checkText}>{fullChecks[step] ? "✔ Checked" : "Mark"}</Text>
                </TouchableOpacity>
              ))}

              <PrimaryButton
                label="Open Camera Inspection"
                onPress={() =>
                  navigation.navigate("CameraScreen", {
                    mode: "room_scan",
                    returnTo: "RoomSafetyScreen"
                  })
                }
                variant="secondary"
              />

              {capturedImageUri ? (
                <Image source={{ uri: capturedImageUri }} style={styles.preview} />
              ) : null}

              <TextInput
                value={inspectionNotes}
                onChangeText={setInspectionNotes}
                placeholder="Inspection notes"
                placeholderTextColor="#7A7A7A"
                multiline
                numberOfLines={4}
                style={[styles.noteInput, styles.multiline]}
              />

              <View style={styles.toggleRow}>
                <Text style={styles.bodyText}>Suspicious activity detected</Text>
                <Switch
                  value={fullSuspicious}
                  onValueChange={setFullSuspicious}
                  thumbColor={fullSuspicious ? colors.primary : "#ECECEC"}
                  trackColor={{ true: "#C9B5D6", false: "#C8C8C8" }}
                />
              </View>

              <PrimaryButton
                label="Save Inspection Result"
                onPress={() => {
                  if (!fullSuspicious) {
                    setStatusMessage("No suspicious activity marked.");
                    return;
                  }
                  saveSuspiciousFinding().catch(() => undefined);
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
  subTitle: {
    color: colors.accentSoft,
    fontWeight: "700",
    marginTop: 6
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
