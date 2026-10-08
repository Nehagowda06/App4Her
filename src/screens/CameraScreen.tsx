import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CameraView, useCameraPermissions } from "expo-camera";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "CameraScreen">;

const modeLabel: Record<Props["route"]["params"]["mode"], string> = {
  room_scan: "Room Safety Scan",
  drink_scan: "Drink Safety Scan",
  incident_photo: "Incident Photo"
};

export const CameraScreen = ({ navigation, route }: Props) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [requestingPermission, setRequestingPermission] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [flash, setFlash] = useState<"off" | "on">("off");
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<CameraView | null>(null);
  const { mode } = route.params;

  const ensurePermission = async () => {
    if (permission?.granted) {
      return true;
    }

    setRequestingPermission(true);
    setError(null);
    try {
      const permissionResult = await requestPermission();
      if (!permissionResult.granted) {
        setError("Camera access is required for this feature.");
        return false;
      }
      return true;
    } catch {
      setError("Camera access is required for this feature.");
      return false;
    } finally {
      setRequestingPermission(false);
    }
  };

  React.useEffect(() => {
    ensurePermission().catch(() => {
      setError("Camera access is required for this feature.");
    });
  }, []);

  const handleOpenSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      setError("Unable to open settings right now.");
    }
  };

  const handleCapture = async () => {
    if (capturing) {
      return;
    }

    const hasPermission = await ensurePermission();
    if (!hasPermission) {
      return;
    }

    if (!cameraRef.current) {
      setError("Camera is still loading. Please try again.");
      return;
    }

    setCapturing(true);
    setError(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!photo?.uri) {
        setError("Could not capture photo. Try again.");
        return;
      }

      if (route.params.returnTo) {
        navigation.navigate(route.params.returnTo, {
          capturedImageUri: photo.uri,
          capturedMode: mode
        });
      } else {
        navigation.goBack();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setCapturing(false);
    }
  };

  const permissionDenied = permission && !permission.granted;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {requestingPermission ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        ) : permissionDenied ? (
          <View style={styles.centered}>
            <Text style={styles.permissionText}>Camera access is required for this feature.</Text>
            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.7}
              onPress={() => {
                handleOpenSettings().catch(() => undefined);
              }}
            >
              <Text style={styles.secondaryButtonText}>Open Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <CameraView ref={cameraRef} style={styles.camera} facing="back" flash={flash} />

            <View style={styles.topOverlay}>
              <Text style={styles.modeTitle}>{modeLabel[mode]}</Text>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={styles.controlButton}
                activeOpacity={0.7}
                onPress={() => navigation.goBack()}
                disabled={capturing}
              >
                <MaterialCommunityIcons name="close" size={28} color="#FFFFFF" />
                <Text style={styles.controlLabel}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.captureButton, capturing && styles.captureButtonDisabled]}
                activeOpacity={0.7}
                onPress={() => {
                  handleCapture().catch(() => undefined);
                }}
                disabled={capturing}
              >
                <View style={styles.captureInner} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlButton}
                activeOpacity={0.7}
                disabled={capturing}
                onPress={() => setFlash((prev) => (prev === "off" ? "on" : "off"))}
              >
                <MaterialCommunityIcons
                  name={flash === "on" ? "flash" : "flash-off"}
                  size={26}
                  color="#FFFFFF"
                />
                <Text style={styles.controlLabel}>Flash</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#111111"
  },
  container: {
    flex: 1,
    backgroundColor: "#111111"
  },
  camera: {
    flex: 1
  },
  topOverlay: {
    position: "absolute",
    top: 12,
    left: 16,
    right: 16,
    alignItems: "center",
    gap: 6
  },
  modeTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center"
  },
  errorText: {
    color: "#FFD6D6",
    textAlign: "center",
    fontWeight: "600"
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24
  },
  controlButton: {
    width: 88,
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  controlLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600"
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center"
  },
  captureButtonDisabled: {
    opacity: 0.7
  },
  captureInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#FFFFFF"
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 12
  },
  permissionText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600"
  },
  secondaryButton: {
    minHeight: 50,
    minWidth: 170,
    borderRadius: 14,
    backgroundColor: "#29104A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  cancelButton: {
    minHeight: 50,
    minWidth: 170,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FFFFFFAA",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontWeight: "700"
  }
});

