import React from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AppLayout } from "../components/AppLayout";
import { Card } from "../components/Card";
import { PrimaryButton } from "../components/PrimaryButton";
import { settingsController } from "../controllers/settingsController";
import { useSafetyStore } from "../state/useSafetyStore";
import { colors, spacing } from "../utils/theme";

export const ProfileScreen = () => {
  const { profile, trustedContactsCount, protectionActive } = useSafetyStore((state) => ({
    profile: state.profile,
    trustedContactsCount: state.trustedContacts.length,
    protectionActive: state.protectionActive
  }));

  const [name, setName] = React.useState(profile.name);
  const [emergencyMessage, setEmergencyMessage] = React.useState(profile.emergencyMessage);
  const [status, setStatus] = React.useState<string | null>(null);

  React.useEffect(() => {
    setName(profile.name);
    setEmergencyMessage(profile.emergencyMessage);
  }, [profile.name, profile.emergencyMessage]);

  const handleSave = () => {
    settingsController.updateProfile({
      name: name.trim() || "User",
      emergencyMessage: emergencyMessage.trim() || "Emergency. I need immediate help."
    });
    setStatus("Profile updated.");
  };

  return (
    <AppLayout title="Profile">
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.container}>
          <Card style={styles.card}>
            <Text style={styles.label}>User name</Text>
            <Text style={styles.value}>{profile.name}</Text>
            <Text style={styles.label}>Emergency contacts</Text>
            <Text style={styles.value}>{trustedContactsCount}</Text>
            <Text style={styles.label}>Protection mode status</Text>
            <Text style={styles.value}>
              {protectionActive ? "Active" : "Inactive"}
            </Text>
          </Card>

          <Card style={styles.card}>
            <Text style={styles.label}>Edit name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor="#7A7A7A"
            />

            <Text style={styles.label}>Emergency message</Text>
            <TextInput
              value={emergencyMessage}
              onChangeText={setEmergencyMessage}
              multiline
              numberOfLines={4}
              style={[styles.input, styles.messageInput]}
              placeholder="Emergency message text"
              placeholderTextColor="#7A7A7A"
            />

            <PrimaryButton label="Save Profile" onPress={handleSave} />
            {status ? <Text style={styles.status}>{status}</Text> : null}
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
  label: {
    color: colors.textLight,
    fontSize: 14,
    fontWeight: "600"
  },
  value: {
    color: colors.textLight,
    fontSize: 17,
    fontWeight: "700"
  },
  input: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E3E3E3",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    color: "#222"
  },
  messageInput: {
    minHeight: 120,
    textAlignVertical: "top",
    paddingTop: 12
  },
  status: {
    color: colors.accentSoft,
    fontWeight: "700"
  }
});
