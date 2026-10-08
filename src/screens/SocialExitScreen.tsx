import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppLayout } from "../components/AppLayout";
import { PrimaryCardButton } from "../components/PrimaryCardButton";
import { safeNavigate } from "../navigation/safeNavigation";
import type { RootStackParamList } from "../navigation/types";
import { colors, spacing } from "../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "SocialExitScreen">;

export const SocialExitScreen = ({ navigation }: Props) => {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const lockTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (lockTimer.current) {
        clearTimeout(lockTimer.current);
        lockTimer.current = null;
      }
    },
    []
  );

  const handleFakeCall = () => {
    if (isProcessing) {
      return;
    }
    setError(null);
    setIsProcessing(true);
    safeNavigate(navigation, "FakeCallScreen", (message) => {
      setError(message);
    });
    lockTimer.current = setTimeout(() => {
      setIsProcessing(false);
      lockTimer.current = null;
    }, 300);
  };

  return (
    <AppLayout title="Social Exit">
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.container}>
          <PrimaryCardButton
            title={isProcessing ? "Opening..." : "Open Fake Call"}
            subtitle="Simulate an incoming call now"
            onPress={handleFakeCall}
            style={styles.card}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
    width: "85%",
    alignSelf: "center",
    marginVertical: 0
  },
  errorText: {
    color: colors.primaryDark,
    fontWeight: "700",
    textAlign: "center"
  }
});
