import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppLayout } from "../components/AppLayout";
import { PrimaryCardButton } from "../components/PrimaryCardButton";
import { locationShareController } from "../controllers/locationShareController";
import { protectionController } from "../controllers/protectionController";
import { safeNavigate } from "../navigation/safeNavigation";
import type { RootStackParamList } from "../navigation/types";
import { colors, spacing } from "../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "RapidAssistanceScreen">;

export const RapidAssistanceScreen = ({ navigation }: Props) => {
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [processing, setProcessing] = React.useState(false);

  const withLock = async (task: () => Promise<void>) => {
    if (processing) {
      return;
    }
    setProcessing(true);
    try {
      await task();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AppLayout title="Rapid Assistance">
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.container}>
          <PrimaryCardButton
            title="Share Live Location"
            subtitle="Send your current location to trusted contacts"
            onPress={() => {
              withLock(async () => {
                const result = await locationShareController.shareLocationWithTrustedContacts();
                setStatusMessage(
                  result.success
                    ? "Location sharing opened for trusted contacts."
                    : result.error ?? "Location unavailable."
                );
              }).catch(() => {
                setStatusMessage("Something went wrong. Please try again.");
              });
            }}
            disabled={processing}
            style={styles.actionCard}
          />
          <PrimaryCardButton
            title="Call Trusted Contact"
            subtitle="Quickly open dialer for your first trusted contact"
            onPress={() => {
              withLock(async () => {
                const result = await protectionController.callPrimaryTrustedContact();
                setStatusMessage(
                  result.success
                    ? `Dialer ready for ${result.targetLabel}.`
                    : result.error ?? "Unable to open dialer."
                );
              }).catch(() => {
                setStatusMessage("Unable to open dialer.");
              });
            }}
            disabled={processing}
            style={styles.actionCard}
          />
          <PrimaryCardButton
            title="Fake Call"
            subtitle="Trigger an incoming call screen"
            onPress={() => safeNavigate(navigation, "FakeCallScreen")}
            style={styles.actionCard}
          />
          <PrimaryCardButton
            title="Find Safe Haven"
            subtitle="Open nearby safe locations"
            onPress={() => safeNavigate(navigation, "SafeHavenScreen")}
            style={styles.actionCard}
          />
          <PrimaryCardButton
            title="Activate Protection Mode"
            subtitle="Start emergency actions now"
            onPress={() => {
              withLock(async () => {
                const result = await protectionController.activateProtectionMode();
                if (result.error) {
                  setStatusMessage(result.error);
                  return;
                }
                setStatusMessage("Protection mode activated.");
                safeNavigate(navigation, "ProtectionModeScreen");
              }).catch(() => {
                setStatusMessage("Something went wrong. Please try again.");
              });
            }}
            disabled={processing}
            style={styles.actionCard}
          />

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
  actionCard: {
    width: "85%",
    alignSelf: "center",
    marginVertical: 0
  },
  status: {
    color: colors.textDark,
    fontWeight: "700",
    textAlign: "center"
  }
});
