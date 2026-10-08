import { Alert } from "react-native";

import type { RootStackParamList } from "./types";

const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again.";

const registeredRoutes: (keyof RootStackParamList)[] = [
  "PrivacyConsentScreen",
  "HomeScreen",
  "RapidAssistanceScreen",
  "FakeCallScreen",
  "InCallScreen",
  "ProtectionModeScreen",
  "SituationAIScreen",
  "SituationAssistantScreen",
  "SafeHavenScreen",
  "SocialExitScreen",
  "IncidentLogScreen",
  "IncidentRecordsScreen",
  "TrustedContactsScreen",
  "RoomSafetyScreen",
  "DrinkSafetyScreen",
  "SafetyToolsScreen",
  "CameraScreen",
  "LocationShareScreen",
  "ProfileScreen",
  "SettingsScreen"
];

const routeSet = new Set<keyof RootStackParamList>(registeredRoutes);

export const isRegisteredRoute = (
  route: string
): route is keyof RootStackParamList => routeSet.has(route as keyof RootStackParamList);

export const safeNavigate = (
  navigation: { navigate: (route: keyof RootStackParamList) => void },
  route: keyof RootStackParamList,
  onError?: (message: string) => void
) => {
  const handleError =
    onError ??
    ((message: string) => {
      Alert.alert("App4Her", message);
    });

  try {
    if (!isRegisteredRoute(route)) {
      handleError(DEFAULT_ERROR_MESSAGE);
      return false;
    }

    navigation.navigate(route);
    return true;
  } catch {
    handleError(DEFAULT_ERROR_MESSAGE);
    return false;
  }
};
