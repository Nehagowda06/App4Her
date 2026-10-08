import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { HomeScreen } from "../screens/HomeScreen";
import { colors } from "../utils/theme";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => (
  <Stack.Navigator
    initialRouteName="HomeScreen"
    screenOptions={{
      headerShown: false,
      animation: "fade",
      animationDuration: 200,
      contentStyle: {
        backgroundColor: colors.background
      }
    }}
  >
    <Stack.Screen name="HomeScreen" component={HomeScreen} />
    <Stack.Screen
      name="RapidAssistanceScreen"
      getComponent={() =>
        require("../screens/RapidAssistanceScreen").RapidAssistanceScreen
      }
    />
    <Stack.Screen
      name="FakeCallScreen"
      getComponent={() => require("../screens/FakeCallScreen").FakeCallScreen}
    />
    <Stack.Screen
      name="InCallScreen"
      getComponent={() => require("../screens/InCallScreen").InCallScreen}
    />
    <Stack.Screen
      name="ProtectionModeScreen"
      getComponent={() =>
        require("../screens/ProtectionModeScreen").ProtectionModeScreen
      }
    />
    <Stack.Screen
      name="SituationAIScreen"
      getComponent={() => require("../screens/SituationAIScreen").SituationAIScreen}
    />
    <Stack.Screen
      name="SituationAssistantScreen"
      getComponent={() =>
        require("../screens/SituationAssistantScreen").SituationAssistantScreen
      }
    />
    <Stack.Screen
      name="SafeHavenScreen"
      getComponent={() => require("../screens/SafeHavenScreen").SafeHavenScreen}
    />
    <Stack.Screen
      name="SocialExitScreen"
      getComponent={() => require("../screens/SocialExitScreen").SocialExitScreen}
    />
    <Stack.Screen
      name="IncidentLogScreen"
      getComponent={() => require("../screens/IncidentLogScreen").IncidentLogScreen}
    />
    <Stack.Screen
      name="IncidentRecordsScreen"
      getComponent={() =>
        require("../screens/IncidentRecordsScreen").IncidentRecordsScreen
      }
    />
    <Stack.Screen
      name="RoomSafetyScreen"
      getComponent={() => require("../screens/RoomSafetyScreen").RoomSafetyScreen}
    />
    <Stack.Screen
      name="DrinkSafetyScreen"
      getComponent={() => require("../screens/DrinkSafetyScreen").DrinkSafetyScreen}
    />
    <Stack.Screen
      name="SafetyToolsScreen"
      getComponent={() => require("../screens/SafetyToolsScreen").SafetyToolsScreen}
    />
    <Stack.Screen
      name="CameraScreen"
      getComponent={() => require("../screens/CameraScreen").CameraScreen}
    />
    <Stack.Screen
      name="LocationShareScreen"
      getComponent={() => require("../screens/LocationShareScreen").LocationShareScreen}
    />
    <Stack.Screen
      name="ProfileScreen"
      getComponent={() => require("../screens/ProfileScreen").ProfileScreen}
    />
    <Stack.Screen
      name="SettingsScreen"
      getComponent={() => require("../screens/SettingsScreen").SettingsScreen}
    />
    <Stack.Screen
      name="TrustedContactsScreen"
      getComponent={() =>
        require("../screens/TrustedContactsScreen").TrustedContactsScreen
      }
    />
    <Stack.Screen
      name="PrivacyConsentScreen"
      getComponent={() =>
        require("../screens/PrivacyConsentScreen").PrivacyConsentScreen
      }
    />
  </Stack.Navigator>
);
