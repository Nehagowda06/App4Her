import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppLayout } from "../components/AppLayout";
import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { safeNavigate } from "../navigation/safeNavigation";
import type { RootStackParamList } from "../navigation/types";
import { locationService } from "../services/locationService";
import { useSafetyStore } from "../state/useSafetyStore";
import { colors, spacing } from "../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "ProtectionModeScreen">;

export const ProtectionModeScreen = ({ navigation }: Props) => {
  const {
    protectionActive,
    currentLocation,
    locationDetails,
    protectionStatusMessage,
    locationSharingActive
  } = useSafetyStore((state) => ({
    protectionActive: state.protectionActive,
    currentLocation: state.currentLocation,
    locationDetails: state.locationDetails,
    protectionStatusMessage: state.protectionStatusMessage,
    locationSharingActive: state.locationSharingActive
  }));

  if (protectionActive) {
    return (
      <SafeAreaView style={styles.activeSafe}>
        <View style={styles.activeContainer}>
          <Text style={styles.activeTitle}>PROTECTION MODE ACTIVE</Text>
          <Text style={styles.activeSubtitle}>Emergency actions running</Text>
          <Text style={styles.activeMeta}>
            {protectionStatusMessage ?? "Live tracking and emergency actions running."}
          </Text>
          <Text style={styles.activeMeta}>
            {locationSharingActive ? "Live location sharing: ON" : "Live location sharing: OFF"}
          </Text>
          <Text style={styles.activeMeta}>
            Location: {locationService.formatLabel(currentLocation)}
          </Text>
          <Text style={styles.activeMeta}>
            City: {locationDetails?.city || "Unknown"}
          </Text>
          <Text style={styles.activeMeta}>
            Road: {locationDetails?.road || "Unknown"}
          </Text>
          <Text style={styles.activeMeta}>
            Landmark: {locationDetails?.landmark || "Unknown"}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <AppLayout title="Protection Mode">
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.container}>
          <Card style={styles.card}>
            <Text style={styles.statusTitle}>Protection Mode Inactive</Text>
            <Text style={styles.bodyText}>Use SOS from Home to activate Protection Mode.</Text>
            <Text style={styles.bodyText}>Deactivation is only available via SOS triple tap.</Text>
          </Card>
          <PrimaryButton
            label="Go to Home"
            onPress={() => safeNavigate(navigation, "HomeScreen")}
            variant="secondary"
          />
        </ScrollView>
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  activeSafe: {
    flex: 1,
    backgroundColor: "#150016"
  },
  activeContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 12
  },
  activeTitle: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center"
  },
  activeSubtitle: {
    color: "#E3B6B1",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center"
  },
  activeMeta: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center"
  },
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
  statusTitle: {
    color: colors.textLight,
    fontSize: 20,
    fontWeight: "700"
  },
  bodyText: {
    color: colors.textLight,
    lineHeight: 22
  }
});
