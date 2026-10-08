import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppLayout } from "../components/AppLayout";
import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { safeNavigate } from "../navigation/safeNavigation";
import type { RootStackParamList } from "../navigation/types";
import { colors, spacing } from "../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "PrivacyConsentScreen">;

export const PrivacyConsentScreen = ({ navigation }: Props) => {
  return (
    <AppLayout title="Privacy">
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.container}>
          <Card style={styles.card}>
            <Text style={styles.title}>How this prototype uses data</Text>
            <Text style={styles.line}>- Location supports safety navigation only.</Text>
            <Text style={styles.line}>- Incident logs are stored on this device.</Text>
            <Text style={styles.line}>- You can remove data in Settings at any time.</Text>
            <Text style={styles.line}>
              - This app supports decisions and does not replace emergency services.
            </Text>
          </Card>

          <PrimaryButton
            label="Consent Noted"
            onPress={() => safeNavigate(navigation, "HomeScreen")}
          />
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
    fontWeight: "700",
    fontSize: 16
  },
  line: {
    color: colors.textLight,
    lineHeight: 20
  }
});

