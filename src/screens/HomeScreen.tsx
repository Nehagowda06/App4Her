import React from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppLayout } from "../components/AppLayout";
import { PrimaryCardButton } from "../components/PrimaryCardButton";
import { protectionController } from "../controllers/protectionController";
import { safeNavigate } from "../navigation/safeNavigation";
import type { RootStackParamList } from "../navigation/types";
import { useSafetyStore } from "../state/useSafetyStore";
import { colors } from "../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "HomeScreen">;
const SOS_HOLD_DURATION_MS = 2000;
const SOS_DEACTIVATE_TAP_WINDOW_MS = 2000;
const HOME_TRIPLE_TAP_WINDOW_MS = 1000;

export const HomeScreen = ({ navigation }: Props) => {
  const [isNavigating, setIsNavigating] = React.useState(false);
  const [isActivatingProtection, setIsActivatingProtection] = React.useState(false);
  const [navError, setNavError] = React.useState<string | null>(null);
  const [protectionMessage, setProtectionMessage] = React.useState<string | null>(null);
  const [isHoldingSos, setIsHoldingSos] = React.useState(false);
  const [pinModalVisible, setPinModalVisible] = React.useState(false);
  const [pinInput, setPinInput] = React.useState("");
  const [pinError, setPinError] = React.useState<string | null>(null);
  const protectionActive = useSafetyStore((state) => state.protectionActive);
  const lockTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const deactivationStartRef = React.useRef<number | null>(null);
  const deactivationTapCountRef = React.useRef(0);
  const deactivationResetTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const homeTapStartRef = React.useRef<number | null>(null);
  const homeTapCountRef = React.useRef(0);
  const homeTapResetTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseScale = React.useRef(new Animated.Value(1)).current;

  const clearSosHoldTimer = React.useCallback((resetHolding = true) => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (resetHolding) {
      setIsHoldingSos(false);
    }
  }, []);

  React.useEffect(
    () => () => {
      if (lockTimer.current) {
        clearTimeout(lockTimer.current);
        lockTimer.current = null;
      }
      clearSosHoldTimer(true);
      if (deactivationResetTimerRef.current) {
        clearTimeout(deactivationResetTimerRef.current);
        deactivationResetTimerRef.current = null;
      }
      if (homeTapResetTimerRef.current) {
        clearTimeout(homeTapResetTimerRef.current);
        homeTapResetTimerRef.current = null;
      }
    },
    [clearSosHoldTimer]
  );

  React.useEffect(() => {
    const unsubscribe = navigation.addListener("blur", () => {
      clearSosHoldTimer(true);
    });

    return unsubscribe;
  }, [clearSosHoldTimer, navigation]);

  React.useEffect(() => {
    if (!protectionActive) {
      pulseScale.stopAnimation();
      pulseScale.setValue(1);
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.08,
          duration: 650,
          useNativeDriver: true
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true
        })
      ])
    );
    animation.start();

    return () => {
      animation.stop();
      pulseScale.stopAnimation();
      pulseScale.setValue(1);
    };
  }, [protectionActive, pulseScale]);

  const handleNavigate = (route: keyof RootStackParamList) => {
    if (isNavigating) {
      return;
    }

    setNavError(null);
    setIsNavigating(true);
    safeNavigate(navigation, route, (message) => {
      setNavError(message);
    });
    lockTimer.current = setTimeout(() => {
      setIsNavigating(false);
      lockTimer.current = null;
    }, 300);
  };

  const activateProtection = async () => {
    if (isActivatingProtection || protectionActive) {
      setProtectionMessage(protectionActive ? "Protection mode is already active." : null);
      return;
    }

    setIsActivatingProtection(true);
    setProtectionMessage(null);
    setNavError(null);
    try {
      const result = await protectionController.activateProtectionMode();
      if (result.error) {
        setProtectionMessage(result.error);
        return;
      }
      setProtectionMessage("Protection mode activated.");
      safeNavigate(navigation, "ProtectionModeScreen", (message) => {
        setNavError(message);
      });
    } catch {
      setProtectionMessage("Something went wrong. Please try again.");
    } finally {
      setIsActivatingProtection(false);
    }
  };

  const resetDeactivationTapWindow = () => {
    deactivationStartRef.current = null;
    deactivationTapCountRef.current = 0;
    if (deactivationResetTimerRef.current) {
      clearTimeout(deactivationResetTimerRef.current);
      deactivationResetTimerRef.current = null;
    }
  };

  const resetHomeTapWindow = () => {
    homeTapStartRef.current = null;
    homeTapCountRef.current = 0;
    if (homeTapResetTimerRef.current) {
      clearTimeout(homeTapResetTimerRef.current);
      homeTapResetTimerRef.current = null;
    }
  };

  const handleHomeTripleTapCapture = () => {
    if (protectionActive || isActivatingProtection) {
      return;
    }

    const now = Date.now();
    if (
      homeTapStartRef.current === null ||
      now - homeTapStartRef.current > HOME_TRIPLE_TAP_WINDOW_MS
    ) {
      homeTapStartRef.current = now;
      homeTapCountRef.current = 1;
    } else {
      homeTapCountRef.current += 1;
    }

    if (homeTapCountRef.current >= 3) {
      resetHomeTapWindow();
      setProtectionMessage("Hidden trigger detected. Activating protection mode.");
      activateProtection().catch(() => undefined);
      return;
    }

    if (homeTapResetTimerRef.current) {
      clearTimeout(homeTapResetTimerRef.current);
    }
    homeTapResetTimerRef.current = setTimeout(() => {
      resetHomeTapWindow();
    }, HOME_TRIPLE_TAP_WINDOW_MS);
  };

  const closePinModal = () => {
    setPinModalVisible(false);
    setPinInput("");
    setPinError(null);
  };

  const submitPinDeactivation = () => {
    const configuredPin = useSafetyStore.getState().settings.protectionPin.trim();
    if (pinInput.trim() !== configuredPin) {
      setPinError("Incorrect PIN");
      return;
    }

    protectionController.deactivateProtectionMode();
    setProtectionMessage("Protection mode deactivated.");
    closePinModal();
  };

  const handleSosTapWhileActive = () => {
    if (!protectionActive) {
      return;
    }

    const now = Date.now();
    if (
      deactivationStartRef.current === null ||
      now - deactivationStartRef.current > SOS_DEACTIVATE_TAP_WINDOW_MS
    ) {
      deactivationStartRef.current = now;
      deactivationTapCountRef.current = 1;
    } else {
      deactivationTapCountRef.current += 1;
    }

    const remaining = Math.max(3 - deactivationTapCountRef.current, 0);
    setProtectionMessage(
      remaining > 0
        ? `Tap ${remaining} more times to deactivate.`
        : "Deactivate confirmation required."
    );

    if (deactivationTapCountRef.current >= 3) {
      resetDeactivationTapWindow();
      setPinInput("");
      setPinError(null);
      setPinModalVisible(true);
      return;
    }

    if (deactivationResetTimerRef.current) {
      clearTimeout(deactivationResetTimerRef.current);
    }
    deactivationResetTimerRef.current = setTimeout(() => {
      resetDeactivationTapWindow();
      if (useSafetyStore.getState().protectionActive) {
        setProtectionMessage("Protection mode active. Triple tap SOS to deactivate.");
      }
    }, SOS_DEACTIVATE_TAP_WINDOW_MS);
  };

  const handleSosPressIn = () => {
    if (isActivatingProtection || protectionActive) {
      return;
    }

    clearSosHoldTimer(true);
    setIsHoldingSos(true);
    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null;
      setIsHoldingSos(false);
      activateProtection().catch(() => undefined);
    }, SOS_HOLD_DURATION_MS);
  };

  const handleSosPressOut = () => {
    if (protectionActive) {
      return;
    }

    clearSosHoldTimer(true);
  };

  const sosHint =
    isHoldingSos
      ? "HOLDING..."
      : isActivatingProtection
        ? "Activating..."
        : protectionActive
          ? "Protection mode active. Triple tap SOS to deactivate."
          : "Press and hold for 2s";

  return (
    <AppLayout title="Home">
      <View
        style={styles.content}
        onStartShouldSetResponderCapture={() => {
          handleHomeTripleTapCapture();
          return false;
        }}
      >
        {protectionMessage ? <Text style={styles.message}>{protectionMessage}</Text> : null}

        <View>
          <PrimaryCardButton
            title="Instant Response"
            onPress={() => {
              handleNavigate("ProtectionModeScreen");
            }}
            onLongPress={() => {
              activateProtection().catch(() => undefined);
            }}
            delayLongPress={2000}
            disabled={isActivatingProtection}
            style={styles.homeButton}
          />
          <PrimaryCardButton
            title="Rapid Assistance"
            onPress={() => handleNavigate("RapidAssistanceScreen")}
            style={styles.homeButton}
          />
          <PrimaryCardButton
            title="Situational Guidance"
            onPress={() => handleNavigate("SituationAssistantScreen")}
            style={styles.homeButton}
          />
          <PrimaryCardButton
            title="Preventive Tools"
            onPress={() => handleNavigate("SafetyToolsScreen")}
            style={styles.homeButton}
          />

          {navError ? <Text style={styles.error}>{navError}</Text> : null}
        </View>

        <View style={styles.sosSection}>
          <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
            <TouchableOpacity
              style={[styles.sosButton, isActivatingProtection && styles.sosDisabled]}
              activeOpacity={0.9}
              onPress={() => {
                if (protectionActive) {
                  handleSosTapWhileActive();
                }
              }}
              onPressIn={handleSosPressIn}
              onPressOut={handleSosPressOut}
              disabled={isActivatingProtection}
            >
              <Text style={styles.sosText}>SOS</Text>
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.sosHint}>{sosHint}</Text>
        </View>

        <Modal
          visible={pinModalVisible}
          transparent
          animationType="fade"
          onRequestClose={closePinModal}
        >
          <View style={styles.pinOverlay}>
            <View style={styles.pinCard}>
              <Text style={styles.pinTitle}>Enter PIN to Deactivate</Text>
              <TextInput
                value={pinInput}
                onChangeText={(value) => {
                  const numericOnly = value.replace(/[^0-9]/g, "").slice(0, 3);
                  setPinInput(numericOnly);
                  if (pinError) {
                    setPinError(null);
                  }
                }}
                keyboardType="number-pad"
                maxLength={3}
                secureTextEntry
                style={styles.pinInput}
                placeholder="3-digit PIN"
                placeholderTextColor="#7A7A7A"
              />
              {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}
              <View style={styles.pinActions}>
                <TouchableOpacity
                  style={styles.pinCancel}
                  activeOpacity={0.7}
                  onPress={closePinModal}
                >
                  <Text style={styles.pinCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pinConfirm}
                  activeOpacity={0.7}
                  onPress={submitPinDeactivation}
                >
                  <Text style={styles.pinConfirmText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    marginTop: 20,
    marginHorizontal: 20,
    paddingBottom: 12
  },
  homeButton: {
    marginVertical: 8,
    height: 70,
    borderRadius: 16,
    backgroundColor: "#F6F2F8"
  },
  message: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 6
  },
  error: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 10
  },
  sosSection: {
    marginTop: "auto",
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  sosButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#D72638",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6
  },
  sosDisabled: {
    opacity: 0.8
  },
  sosText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700"
  },
  sosHint: {
    marginTop: 10,
    color: colors.textDark,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center"
  },
  pinOverlay: {
    flex: 1,
    backgroundColor: "#00000066",
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  },
  pinCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    padding: 20,
    gap: 12
  },
  pinTitle: {
    color: colors.textDark,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center"
  },
  pinInput: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D7D0DE",
    paddingHorizontal: 14,
    color: colors.textDark,
    backgroundColor: "#FFFFFF",
    textAlign: "center",
    fontSize: 18,
    letterSpacing: 8
  },
  pinError: {
    color: "#D72638",
    fontWeight: "700",
    textAlign: "center"
  },
  pinActions: {
    flexDirection: "row",
    gap: 10
  },
  pinCancel: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D7D0DE",
    alignItems: "center",
    justifyContent: "center"
  },
  pinConfirm: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  pinCancelText: {
    color: colors.textDark,
    fontWeight: "700"
  },
  pinConfirmText: {
    color: "#FFFFFF",
    fontWeight: "700"
  }
});
