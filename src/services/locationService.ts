import * as Location from "expo-location";

import type { Coordinates, LocationDetails } from "../types";

export const locationService = {
  async requestPermission(): Promise<boolean> {
    try {
      const existing = await Location.getForegroundPermissionsAsync();
      if (existing.status === "granted") {
        return true;
      }

      const result = await Location.requestForegroundPermissionsAsync();
      return result.status === "granted";
    } catch {
      return false;
    }
  },

  async getCurrentLocation(requestPermission = true): Promise<Coordinates | null> {
    try {
      if (requestPermission) {
        const granted = await this.requestPermission();
        if (!granted) {
          return null;
        }
      }
      const result = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      return {
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        accuracy: result.coords.accuracy ?? null
      };
    } catch {
      return null;
    }
  },

  async requestBackgroundPermission(): Promise<boolean> {
    try {
      const existing = await Location.getBackgroundPermissionsAsync();
      if (existing.status === "granted") {
        return true;
      }

      const result = await Location.requestBackgroundPermissionsAsync();
      return result.status === "granted";
    } catch {
      return false;
    }
  },

  async startBalancedTracking(
    onLocation: (location: Coordinates) => void
  ): Promise<Location.LocationSubscription | null> {
    try {
      const granted = await this.requestPermission();
      if (!granted) {
        return null;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 15000,
          distanceInterval: 10
        },
        (locationUpdate) => {
          onLocation({
            latitude: locationUpdate.coords.latitude,
            longitude: locationUpdate.coords.longitude,
            accuracy: locationUpdate.coords.accuracy ?? null
          });
        }
      );
      return subscription;
    } catch {
      return null;
    }
  },

  formatLabel(coordinates: Coordinates | null) {
    if (!coordinates) {
      return "Location unavailable";
    }
    return `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`;
  },

  createMapLink(coordinates: Coordinates | null) {
    if (!coordinates) {
      return "";
    }
    return `https://maps.google.com/?q=${coordinates.latitude},${coordinates.longitude}`;
  },

  async getLocationDetails(coordinates: Coordinates | null): Promise<LocationDetails | null> {
    if (!coordinates) {
      return null;
    }

    try {
      const result = await Location.reverseGeocodeAsync({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
      });
      const first = result[0];
      if (!first) {
        return {
          city: "Unknown",
          road: "Unknown",
          landmark: "Unknown"
        };
      }

      const city =
        first.city || first.subregion || first.region || first.district || "Unknown";
      const road =
        first.street ||
        [first.streetNumber, first.street].filter(Boolean).join(" ") ||
        "Unknown";
      const landmark = first.name || first.district || first.subregion || "Unknown";

      return {
        city,
        road,
        landmark
      };
    } catch {
      return {
        city: "Unknown",
        road: "Unknown",
        landmark: "Unknown"
      };
    }
  }
};
