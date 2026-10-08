import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Audio } from "expo-av";

import { callController } from "../controllers/callController";
import { safeNavigate } from "../navigation/safeNavigation";
import type { RootStackParamList } from "../navigation/types";
import { useSafetyStore } from "../state/useSafetyStore";

type Props = NativeStackScreenProps<RootStackParamList, "FakeCallScreen">;

export const FakeCallScreen = ({ navigation }: Props) => {
  const activeCall = useSafetyStore((state) => state.activeCall);
  const activeCallContact = useSafetyStore((state) => state.activeCallContact);
  const [callerName, setCallerName] = useState("Dad");
  const [audioMessage, setAudioMessage] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [ringtone, setRingtone] = useState<Audio.Sound | null>(null);
  const ringtoneRef = useRef<Audio.Sound | null>(null);
  const keepCallSessionRef = useRef(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (activeCallContact?.name?.trim()) {
      setCallerName(activeCallContact.name.trim());
    }
  }, [activeCallContact]);

  useEffect(() => {
    if (!initializedRef.current || activeCall) {
      return;
    }
    closeCallScreen();
  }, [activeCall]);

  const closeCallScreen = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      safeNavigate(navigation, "HomeScreen");
    }
  };

  const stopRingtone = async (resetState = true) => {
    const sound = ringtoneRef.current;
    if (!sound) {
      return;
    }

    try {
      await sound.stopAsync();
    } catch {
      // Continue cleanup even if stop fails.
    }

    try {
      await sound.unloadAsync();
    } catch {
      // Keep fake call flow stable if unload fails.
    }

    ringtoneRef.current = null;
    if (resetState) {
      setRingtone(null);
    }
  };

  const playRingtone = async () => {
    try {
      if (ringtoneRef.current) {
        await stopRingtone();
      }

      const { sound } = await Audio.Sound.createAsync(
        require("../../ringtone/ringtone.mp3"),
        {
          shouldPlay: true,
          isLooping: true,
          volume: 1.0
        }
      );

      ringtoneRef.current = sound;
      setRingtone(sound);
      setAudioMessage(null);
    } catch {
      setAudioMessage("Ringtone unavailable. Visual call mode is active.");
    }
  };

  useEffect(() => {
    return () => {
      if (ringtone) {
        ringtone.stopAsync().catch(() => undefined);
        ringtone.unloadAsync().catch(() => undefined);
      }
    };
  }, [ringtone]);

  useEffect(() => {
    let mounted = true;
    keepCallSessionRef.current = false;

    const startIncomingCall = async () => {
      const result = await callController.triggerFakeCall();
      if (!mounted) {
        return;
      }

      setCallerName(result.contact.name || "Dad");

      if (result.callAlreadyAccepted) {
        keepCallSessionRef.current = true;
        safeNavigate(navigation, "InCallScreen");
        return;
      }

      await playRingtone();
      if (!mounted && ringtoneRef.current) {
        await stopRingtone();
      }
    };

    startIncomingCall()
      .catch(() => {
        if (mounted) {
          setAudioMessage("Ringtone unavailable. Visual call mode is active.");
        }
      })
      .finally(() => {
        initializedRef.current = true;
      });

    return () => {
      mounted = false;
      stopRingtone(false).catch(() => undefined);
      if (!keepCallSessionRef.current) {
        callController.endFakeCall().catch(() => undefined);
      }
    };
  }, [navigation]);

  const handleDecline = async () => {
    if (processingAction) {
      return;
    }

    setProcessingAction(true);
    try {
      await stopRingtone();
      await callController.endFakeCall();
      closeCallScreen();
    } catch {
      setAudioMessage("Something went wrong. Please try again.");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleAccept = async () => {
    if (processingAction) {
      return;
    }

    setProcessingAction(true);
    try {
      await stopRingtone();
      const accepted = await callController.acceptFakeCall();
      if (!accepted) {
        setAudioMessage("Something went wrong. Please try again.");
        return;
      }

      keepCallSessionRef.current = true;
      const navigated = safeNavigate(navigation, "InCallScreen", (message) => {
        setAudioMessage(message);
      });
      if (!navigated) {
        keepCallSessionRef.current = false;
        await callController.endFakeCall();
      }
    } catch {
      setAudioMessage("Something went wrong. Please try again.");
    } finally {
      setProcessingAction(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.callStateText}>Incoming Call</Text>
          <View style={styles.contactNameContainer}>
            <Text
              style={styles.contactName}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {callerName}
            </Text>
          </View>
          <Text style={styles.callerLabel}>Mobile</Text>
          {audioMessage ? <Text style={styles.audioMessage}>{audioMessage}</Text> : null}
          {ringtone ? <Text style={styles.audioStatus}>Ringing...</Text> : null}
        </View>

        <View style={styles.helperRow}>
          <View style={styles.helperItem}>
            <MaterialCommunityIcons name="alarm" size={28} color="#FFFFFF" />
            <Text style={styles.helperLabel}>Remind Me</Text>
          </View>
          <View style={styles.helperItem}>
            <MaterialCommunityIcons name="message-text-outline" size={28} color="#FFFFFF" />
            <Text style={styles.helperLabel}>Message</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <View style={styles.actionColumn}>
            <TouchableOpacity
              style={[styles.circleButton, styles.declineButton]}
              disabled={processingAction}
              onPress={() => {
                handleDecline().catch(() => undefined);
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="phone-hangup" size={34} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.actionLabel}>Decline</Text>
          </View>

          <View style={styles.actionColumn}>
            <TouchableOpacity
              style={[styles.circleButton, styles.acceptButton]}
              disabled={processingAction}
              onPress={() => {
                handleAccept().catch(() => undefined);
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="phone" size={34} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.actionLabel}>Accept</Text>
          </View>
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
  audioMessage: {
    marginTop: 6,
    color: "#F5D7D7",
    fontSize: 14,
    textAlign: "center"
  },
  audioStatus: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600"
  },
  helperRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 14
  },
  helperItem: {
    alignItems: "center",
    gap: 8
  },
  helperLabel: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "500"
  },
  actionsRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24
  },
  actionColumn: {
    alignItems: "center",
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
  acceptButton: {
    backgroundColor: "#5BCC5B"
  },
  actionLabel: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "500"
  }
});
