import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { callController } from "../controllers/callController";
import { safeNavigate } from "../navigation/safeNavigation";
import type { RootStackParamList } from "../navigation/types";
import { useSafetyStore } from "../state/useSafetyStore";

type Props = NativeStackScreenProps<RootStackParamList, "InCallScreen">;

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remaining = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remaining}`;
};

export const InCallScreen = ({ navigation }: Props) => {
  const { activeCall, activeCallContact, callDuration } = useSafetyStore((state) => ({
    activeCall: state.activeCall,
    activeCallContact: state.activeCallContact,
    callDuration: state.callDuration
  }));
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    if (!activeCall) {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        safeNavigate(navigation, "HomeScreen");
      }
    }
  }, [activeCall, navigation]);

  const endCall = async () => {
    if (processingAction) {
      return;
    }

    setProcessingAction(true);
    try {
      await callController.endFakeCall();
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        safeNavigate(navigation, "HomeScreen");
      }
    } finally {
      setProcessingAction(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.callStateText}>In Call</Text>
          <View style={styles.contactNameContainer}>
            <Text
              style={styles.contactName}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {activeCallContact?.name || "Dad"}
            </Text>
          </View>
          <Text style={styles.callerLabel}>Mobile</Text>
          <Text style={styles.timer}>{formatDuration(callDuration)}</Text>
        </View>

        <View style={styles.endWrap}>
          <TouchableOpacity
            style={[styles.circleButton, styles.declineButton]}
            disabled={processingAction}
            onPress={() => {
              endCall().catch(() => undefined);
            }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="phone-hangup" size={34} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.actionLabel}>End Call</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#4C4A57"
  },
  container: {
    flex: 1,
    backgroundColor: "#4C4A57",
    justifyContent: "space-between",
    paddingVertical: 28,
    paddingHorizontal: 28
  },
  centerContent: {
    marginTop: 70,
    alignItems: "center",
    gap: 8
  },
  contactNameContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%"
  },
  callStateText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600"
  },
  contactName: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 20
  },
  callerLabel: {
    color: "#ECECEC",
    fontSize: 18,
    fontWeight: "500"
  },
  timer: {
    marginTop: 8,
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700"
  },
  endWrap: {
    alignItems: "center",
    marginBottom: 24,
    gap: 8
  },
  circleButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  declineButton: {
    backgroundColor: "#EA4335"
  },
  actionLabel: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "500"
  }
});
