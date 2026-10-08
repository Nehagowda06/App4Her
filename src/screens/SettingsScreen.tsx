import React from "react";
import {
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
import { settingsController } from "../controllers/settingsController";
import { safeNavigate } from "../navigation/safeNavigation";
import type { RootStackParamList } from "../navigation/types";
import { callService } from "../services/callService";
import { useSafetyStore } from "../state/useSafetyStore";
import { colors, spacing } from "../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "SettingsScreen">;

export const SettingsScreen = ({ navigation }: Props) => {
  const settings = useSafetyStore((state) => state.settings);
  const [resetting, setResetting] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [pinInput, setPinInput] = React.useState(settings.protectionPin);
  const [pinMessage, setPinMessage] = React.useState<string | null>(null);
  const [ringtoneMessage, setRingtoneMessage] = React.useState<string | null>(null);
  const normalizedRingtone = callService.normalizeRingtone(settings.fakeCallRingtone);

  const ringtoneOptions: Array<{
    value: "system" | "classic" | "emergency" | "silent";
    label: string;
  }> = [
    { value: "system", label: "Default System Ringtone" },
    { value: "classic", label: "Classic Phone" },
    { value: "emergency", label: "Emergency Alert" },
    { value: "silent", label: "Silent" }
  ];

  React.useEffect(() => {
    setPinInput(settings.protectionPin);
  }, [settings.protectionPin]);

  const toggleSetting = (
    key:
      | "autoCall112"
      | "autoSendLocation"
      | "enableBackgroundTracking"
      | "batteryOptimization"
      | "autoIncidentLogging"
  ) => {
    settingsController.updateSettings({
      [key]: !settings[key]
    });
  };

  return (
    <AppLayout title="Settings">
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.container}>
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Emergency Settings</Text>
            <PrimaryButton
              label="Trusted contacts"
              onPress={() => safeNavigate(navigation, "TrustedContactsScreen")}
              style={styles.actionButton}
            />

            <View style={styles.toggleRow}>
              <Text style={styles.caption}>Auto call 112</Text>
              <Switch
                value={settings.autoCall112}
                onValueChange={() => toggleSetting("autoCall112")}
                thumbColor={settings.autoCall112 ? colors.primary : "#ECECEC"}
                trackColor={{ true: "#C9B5D6", false: "#C8C8C8" }}
              />
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.caption}>Auto send location</Text>
              <Switch
                value={settings.autoSendLocation}
                onValueChange={() => toggleSetting("autoSendLocation")}
                thumbColor={settings.autoSendLocation ? colors.primary : "#ECECEC"}
                trackColor={{ true: "#C9B5D6", false: "#C8C8C8" }}
              />
            </View>
          </Card>

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Protection Mode</Text>
            <View style={styles.toggleRow}>
              <Text style={styles.caption}>Enable background tracking</Text>
              <Switch
                value={settings.enableBackgroundTracking}
                onValueChange={() => toggleSetting("enableBackgroundTracking")}
                thumbColor={settings.enableBackgroundTracking ? colors.primary : "#ECECEC"}
                trackColor={{ true: "#C9B5D6", false: "#C8C8C8" }}
              />
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.caption}>Battery optimization toggle</Text>
              <Switch
                value={settings.batteryOptimization}
                onValueChange={() => toggleSetting("batteryOptimization")}
                thumbColor={settings.batteryOptimization ? colors.primary : "#ECECEC"}
                trackColor={{ true: "#C9B5D6", false: "#C8C8C8" }}
              />
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.caption}>Auto incident logging</Text>
              <Switch
                value={settings.autoIncidentLogging}
                onValueChange={() => toggleSetting("autoIncidentLogging")}
                thumbColor={settings.autoIncidentLogging ? colors.primary : "#ECECEC"}
                trackColor={{ true: "#C9B5D6", false: "#C8C8C8" }}
              />
            </View>

            <Text style={styles.caption}>Deactivation PIN (3 digits)</Text>
            <View style={styles.pinRow}>
              <TextInput
                value={pinInput}
                onChangeText={(value) => {
                  setPinInput(value.replace(/[^0-9]/g, "").slice(0, 3));
                  if (pinMessage) {
                    setPinMessage(null);
                  }
                }}
                keyboardType="number-pad"
                maxLength={3}
                secureTextEntry
                placeholder="Enter PIN"
                placeholderTextColor="#7A7A7A"
                style={styles.pinInput}
              />
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.pinSaveButton}
                onPress={() => {
                  if (!/^\d{3}$/.test(pinInput.trim())) {
                    setPinMessage("PIN must be exactly 3 digits.");
                    return;
                  }
                  settingsController.updateSettings({ protectionPin: pinInput.trim() });
                  setPinMessage("PIN updated.");
                }}
              >
                <Text style={styles.pinSaveText}>Save PIN</Text>
              </TouchableOpacity>
            </View>
            {pinMessage ? <Text style={styles.status}>{pinMessage}</Text> : null}
          </Card>

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Privacy</Text>
            <Text style={styles.caption}>Incident log auto delete (30 days)</Text>
          </Card>

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Sound</Text>
            <Text style={styles.caption}>Fake call ringtone selection</Text>
            <View style={styles.choiceRow}>
              {ringtoneOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  activeOpacity={0.7}
                  style={[
                    styles.choiceButton,
                    normalizedRingtone === option.value && styles.choiceButtonActive
                  ]}
                  onPress={() => {
                    settingsController.updateSettings({ fakeCallRingtone: option.value });
                    setRingtoneMessage(null);
                  }}
                >
                  <Text
                    style={[
                      styles.choiceText,
                      normalizedRingtone === option.value && styles.choiceTextActive
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <PrimaryButton
              label="Open System Sound Settings"
              onPress={() => {
                callService.openSystemRingtoneSettings().then((opened) => {
                  setRingtoneMessage(
                    opened
                      ? "System sound settings opened."
                      : "Unable to open sound settings."
                  );
                });
              }}
              variant="secondary"
              style={styles.actionButton}
            />
            {ringtoneMessage ? <Text style={styles.status}>{ringtoneMessage}</Text> : null}
          </Card>

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>App</Text>
            <Text style={styles.caption}>Reset app data</Text>
            <PrimaryButton
              label={resetting ? "Resetting..." : "Reset app data"}
              onPress={() => {
                if (resetting) {
                  return;
                }
                setResetting(true);
                setStatusMessage(null);
                settingsController
                  .resetAppData()
                  .then(() => {
                    setStatusMessage("App data reset completed.");
                  })
                  .catch(() => {
                    setStatusMessage("Unable to reset app data.");
                  })
                  .finally(() => {
                    setResetting(false);
                  });
              }}
              disabled={resetting}
              variant="secondary"
              style={styles.actionButton}
            />
            {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}
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
  card: {
    gap: spacing.sm
  },
  sectionTitle: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: "700"
  },
  caption: {
    color: colors.textLight,
    lineHeight: 20,
    flex: 1,
    paddingRight: 10
  },
  actionButton: {
    marginVertical: 0
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  choiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  choiceButton: {
    minWidth: "48%",
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFFFFF66",
    backgroundColor: "#FFFFFF22",
    alignItems: "center",
    justifyContent: "center"
  },
  choiceButtonActive: {
    borderColor: colors.accentSoft,
    backgroundColor: colors.accentSoft
  },
  choiceText: {
    color: colors.textLight,
    fontWeight: "700"
  },
  choiceTextActive: {
    color: colors.textDark
  },
  status: {
    color: colors.accentSoft,
    fontWeight: "700"
  },
  pinRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  pinInput: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFFFFF66",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    color: colors.textDark
  },
  pinSaveButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  pinSaveText: {
    color: colors.textDark,
    fontWeight: "700"
  }
});
