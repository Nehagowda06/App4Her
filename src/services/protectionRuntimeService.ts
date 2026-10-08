import type * as Location from "expo-location";

import type { Contact, Coordinates } from "../types";
import { useSafetyStore } from "../state/useSafetyStore";
import { locationService } from "./locationService";
import { locationShareService } from "./locationShareService";

let trackingSubscription: Location.LocationSubscription | null = null;
let liveSmsTimer: ReturnType<typeof setInterval> | null = null;
let latestLocation: Coordinates | null = null;
let latestLocationDetails: { city: string; road: string; landmark: string } | null = null;
let isSmsSending = false;
let isResolvingLocationDetails = false;
let sessionToken = 0;

const clearRuntime = () => {
  if (trackingSubscription) {
    trackingSubscription.remove();
    trackingSubscription = null;
  }
  if (liveSmsTimer) {
    clearInterval(liveSmsTimer);
    liveSmsTimer = null;
  }
  latestLocation = null;
  latestLocationDetails = null;
  isSmsSending = false;
  isResolvingLocationDetails = false;
};

const updateLiveLocation = (location: Coordinates) => {
  latestLocation = location;
  useSafetyStore.getState().updateLocation(location);
};

const updateLocationDetails = async (location: Coordinates | null) => {
  if (!location || isResolvingLocationDetails) {
    return;
  }

  isResolvingLocationDetails = true;
  try {
    const details = await locationService.getLocationDetails(location);
    latestLocationDetails = details;
    useSafetyStore.getState().updateLocationDetails(details);
  } finally {
    isResolvingLocationDetails = false;
  }
};

export const protectionRuntimeService = {
  async startRuntime(input: {
    contacts: Contact[];
    autoSendLocation: boolean;
    enableBackgroundTracking: boolean;
    batteryOptimization: boolean;
  }) {
    try {
      this.stopRuntime();
      sessionToken += 1;
      const currentToken = sessionToken;

      if (input.enableBackgroundTracking) {
        await locationService.requestBackgroundPermission();
      }

      const firstLocation = await locationService.getCurrentLocation(true);
      if (firstLocation) {
        updateLiveLocation(firstLocation);
        await updateLocationDetails(firstLocation);
      }

      trackingSubscription = await locationService.startBalancedTracking((location) => {
        if (currentToken !== sessionToken) {
          return;
        }
        updateLiveLocation(location);
        updateLocationDetails(location).catch(() => undefined);
      });

      if (!trackingSubscription && !firstLocation) {
        return {
          success: false,
          error: "Location unavailable."
        };
      }

      if (input.autoSendLocation) {
        useSafetyStore.getState().setLocationSharingActive(true);

        const sendLiveLocation = async () => {
          if (currentToken !== sessionToken || isSmsSending) {
            return;
          }

          isSmsSending = true;
          try {
            let coordinates = latestLocation;
            if (!coordinates) {
              coordinates = await locationService.getCurrentLocation(false);
              if (coordinates) {
                updateLiveLocation(coordinates);
              }
            }

            await locationShareService.sendEmergencyLocationSms({
              contacts: input.contacts,
              coordinates,
              locationDetails: latestLocationDetails ??
                useSafetyStore.getState().locationDetails
            });
          } finally {
            isSmsSending = false;
          }
        };

        await sendLiveLocation();
        liveSmsTimer = setInterval(() => {
          sendLiveLocation().catch(() => undefined);
        }, 15000);
      } else {
        useSafetyStore.getState().setLocationSharingActive(false);
      }

      return {
        success: true,
        error: null as string | null
      };
    } catch {
      this.stopRuntime();
      return {
        success: false,
        error: "Unable to start live tracking."
      };
    }
  },

  stopRuntime() {
    sessionToken += 1;
    clearRuntime();
    useSafetyStore.getState().setLocationSharingActive(false);
  },

  isRuntimeActive() {
    return Boolean(trackingSubscription || liveSmsTimer);
  },

  getLatestLocation() {
    return latestLocation;
  }
};
