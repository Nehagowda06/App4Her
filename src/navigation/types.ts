import type { CameraCaptureMode } from "../types";

export type RootStackParamList = {
  PrivacyConsentScreen: undefined;
  HomeScreen: undefined;
  RapidAssistanceScreen: undefined;
  FakeCallScreen: undefined;
  InCallScreen: undefined;
  ProtectionModeScreen: undefined;
  SituationAIScreen: undefined;
  SituationAssistantScreen: undefined;
  SafeHavenScreen: undefined;
  SocialExitScreen: undefined;
  IncidentLogScreen: undefined;
  IncidentRecordsScreen: undefined;
  TrustedContactsScreen: undefined;
  RoomSafetyScreen:
    | {
        capturedImageUri?: string;
        capturedMode?: CameraCaptureMode;
      }
    | undefined;
  DrinkSafetyScreen:
    | {
        capturedImageUri?: string;
        capturedMode?: CameraCaptureMode;
      }
    | undefined;
  SafetyToolsScreen: undefined;
  CameraScreen: {
    mode: CameraCaptureMode;
    returnTo?: "RoomSafetyScreen" | "DrinkSafetyScreen";
  };
  LocationShareScreen: undefined;
  ProfileScreen: undefined;
  SettingsScreen: undefined;
};
