import { Linking } from "react-native";

import { locationService } from "../services/locationService";
import { safeHavenService } from "../services/safeHavenService";
import { useSafetyStore } from "../state/useSafetyStore";
import type { Coordinates, SafeHavenWithDistance } from "../types";

type LoadSafeHavensResult = {
  location: Coordinates | null;
  safeHavens: SafeHavenWithDistance[];
  error: string | null;
};

export const safeHavenController = {
  async loadNearbySafeHavens(
    userLocation?: Coordinates | null
  ): Promise<LoadSafeHavensResult> {
    const store = useSafetyStore.getState();
    try {
      let location = userLocation ?? store.currentLocation ?? null;

      if (!location) {
        const permissionGranted = await locationService.requestPermission();
        if (!permissionGranted) {
          store.updateLocation(null);
          return {
            location: null,
            safeHavens: [],
            error: "Location unavailable."
          };
        }
        location = await locationService.getCurrentLocation(false);
      }

      if (!location) {
        store.updateLocation(null);
        return {
          location: null,
          safeHavens: [],
          error: "Location unavailable."
        };
      }

      store.updateLocation(location);

      const nearby = await safeHavenService.fetchNearbySafeHavens(location);
      if (nearby.length === 0) {
        store.setSafeHavens([]);
        return {
          location,
          safeHavens: [],
          error: "No safe havens found within 5 km."
        };
      }

      store.setSafeHavens(nearby);
      return {
        location,
        safeHavens: nearby,
        error: null
      };
    } catch {
      const fallback = safeHavenService.getFallbackSafeHavens(
        userLocation ?? store.currentLocation
      );
      store.setSafeHavens(fallback);
      return {
        location: userLocation ?? store.currentLocation ?? null,
        safeHavens: fallback,
        error: "Safe Haven service unavailable. Showing fallback locations."
      };
    }
  },

  async openSafeHavenDirections(haven: SafeHavenWithDistance): Promise<boolean> {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${haven.latitude},${haven.longitude}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        return false;
      }
      await Linking.openURL(url);
      return true;
    } catch {
      return false;
    }
  }
};
