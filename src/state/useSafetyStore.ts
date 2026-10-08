import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type {
  AppSettings,
  Contact,
  Coordinates,
  Incident,
  LocationDetails,
  ProfileData,
  SafeHavenWithDistance
} from "../types";

const defaultSettings: AppSettings = {
  autoCall112: true,
  autoSendLocation: true,
  enableBackgroundTracking: true,
  batteryOptimization: true,
  autoIncidentLogging: true,
  incidentLogAutoDeleteDays: 30,
  fakeCallRingtone: "system",
  protectionPin: "123"
};

const defaultProfile: ProfileData = {
  name: "User",
  emergencyMessage: "Emergency. I need immediate help."
};

type SafetyState = {
  protectionActive: boolean;
  protectionStatusMessage: string | null;
  locationSharingActive: boolean;
  currentLocation: Coordinates | null;
  locationDetails: LocationDetails | null;
  trustedContacts: Contact[];
  incidents: Incident[];
  settings: AppSettings;
  profile: ProfileData;
  activeCall: boolean;
  activeCallContact: Contact | null;
  callDuration: number;
  safeHavens: SafeHavenWithDistance[];
  activeSituation: string | null;
  activateProtection: () => void;
  deactivateProtection: () => void;
  setProtectionStatusMessage: (message: string | null) => void;
  setLocationSharingActive: (active: boolean) => void;
  updateLocation: (location: Coordinates | null) => void;
  updateLocationDetails: (details: LocationDetails | null) => void;
  setTrustedContacts: (contacts: Contact[]) => void;
  addIncident: (incident: Incident) => void;
  setIncidents: (incidents: Incident[]) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateProfile: (profile: Partial<ProfileData>) => void;
  resetAppData: () => Promise<void>;
  startFakeCall: (contact: Contact) => void;
  endFakeCall: () => void;
  incrementCallDuration: () => void;
  setSafeHavens: (safeHavens: SafeHavenWithDistance[]) => void;
  setSituation: (situation: string | null) => void;
};

export const useSafetyStore = create<SafetyState>()(
  persist(
    (set) => ({
      protectionActive: false,
      protectionStatusMessage: null,
      locationSharingActive: false,
      currentLocation: null,
      locationDetails: null,
      trustedContacts: [],
      incidents: [],
      settings: defaultSettings,
      profile: defaultProfile,
      activeCall: false,
      activeCallContact: null,
      callDuration: 0,
      safeHavens: [],
      activeSituation: null,

      activateProtection: () => set({ protectionActive: true }),

      deactivateProtection: () =>
        set({
          protectionActive: false,
          protectionStatusMessage: null,
          locationSharingActive: false
        }),

      setProtectionStatusMessage: (message) =>
        set({ protectionStatusMessage: message }),

      setLocationSharingActive: (active) =>
        set({ locationSharingActive: active }),

      updateLocation: (location) => set({ currentLocation: location }),

      updateLocationDetails: (details) => set({ locationDetails: details }),

      setTrustedContacts: (contacts) => set({ trustedContacts: contacts }),

      addIncident: (incident) =>
        set((state) => ({
          incidents: [incident, ...state.incidents]
        })),

      setIncidents: (incidents) => set({ incidents }),

      updateSettings: (settings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...settings
          }
        })),

      updateProfile: (profile) =>
        set((state) => ({
          profile: {
            ...state.profile,
            ...profile
          }
        })),

      resetAppData: async () => {
        try {
          await AsyncStorage.removeItem("app4her_incidents_v3");
          await AsyncStorage.removeItem("app4her_safety_store_v3");
        } catch {
          // Ignore storage cleanup errors to keep reset resilient.
        }

        set({
          protectionActive: false,
          protectionStatusMessage: null,
          locationSharingActive: false,
          currentLocation: null,
          locationDetails: null,
          trustedContacts: [],
          incidents: [],
          settings: defaultSettings,
          profile: defaultProfile,
          activeCall: false,
          activeCallContact: null,
          callDuration: 0,
          safeHavens: [],
          activeSituation: null
        });
      },

      startFakeCall: (contact) =>
        set({
          activeCall: true,
          activeCallContact: contact,
          callDuration: 0
        }),

      endFakeCall: () =>
        set({
          activeCall: false,
          activeCallContact: null,
          callDuration: 0
        }),

      incrementCallDuration: () =>
        set((state) => {
          if (!state.activeCall) {
            return state;
          }
          return {
            callDuration: state.callDuration + 1
          };
        }),

      setSafeHavens: (safeHavens) => set({ safeHavens }),

      setSituation: (situation) => set({ activeSituation: situation })
    }),
    {
      name: "app4her_safety_store_v3",
      storage: createJSONStorage(() => AsyncStorage),
      skipHydration: true,
      partialize: (state) => ({
        trustedContacts: state.trustedContacts,
        incidents: state.incidents,
        settings: state.settings,
        profile: state.profile
      })
    }
  )
);
