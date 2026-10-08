import React from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppLayout } from "../components/AppLayout";
import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { locationShareController } from "../controllers/locationShareController";
import { locationShareService } from "../services/locationShareService";
import { colors, spacing } from "../utils/theme";

export const LocationShareScreen = () => {
  const [isSharing, setIsSharing] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);

  const handleShareLocation = async () => {
    if (isSharing) {
      return;
    }

    setIsSharing(true);
    setStatusMessage(null);

    try {
      const result = await locationShareController.shareLocationWithTrustedContacts();
      if (!result.success || !result.mapLink) {
        setStatusMessage(result.error ?? "Location unavailable.");
        return;
      }

      setStatusMessage("Location message opened for trusted contacts.");

      Alert.alert("My current location", result.mapLink, [
        {
          text: "Copy link",
          onPress: () => {
            locationShareService.copyLink(result.mapLink!).catch(() => {
              setStatusMessage("Something went wrong. Please try again.");
            });
          }
        },
        {
          text: "Open in Maps",
          onPress: () => {
            locationShareService.openMapLink(result.mapLink!).then((opened) => {
              if (!opened) {
                setStatusMessage("Unable to open maps.");
              }
            });
          }
        },
        { text: "Close", style: "cancel" }
      ]);
    } catch {
      setStatusMessage("Unable to share location right now.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <AppLayout title="Location Sharing">
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.container}>
          <Card style={styles.card}>
            <Text style={styles.title}>Share live location with trusted contacts</Text>
            <Text style={styles.body}>
              This opens SMS with your Google Maps location link pre-filled for all trusted contacts.
            </Text>
            <PrimaryButton
              label={isSharing ? "Sharing..." : "Share Location"}
              onPress={() => {
                handleShareLocation().catch(() => undefined);
              }}
              disabled={isSharing}
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
  title: {
    color: colors.textLight,
    fontSize: 18,
    fontWeight: "700"
  },
  body: {
    color: colors.textLight,
    lineHeight: 20
  },
  status: {
    color: colors.accentSoft,
    fontWeight: "700"
  }
});
