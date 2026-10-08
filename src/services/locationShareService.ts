import { Linking } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as SMS from "expo-sms";

import { locationService } from "./locationService";
import type { Contact, Coordinates, LocationDetails } from "../types";

type LocationShareResult = {
  location: Coordinates | null;
  mapLink: string | null;
  error: string | null;
};

export const locationShareService = {
  async getCurrentLocationLink(): Promise<LocationShareResult> {
    try {
      const permissionGranted = await locationService.requestPermission();
      if (!permissionGranted) {
        return {
          location: null,
          mapLink: null,
          error: "Location unavailable."
        };
      }

      const location = await locationService.getCurrentLocation(false);
      if (!location) {
        return {
          location: null,
          mapLink: null,
          error: "Location unavailable."
        };
      }

      return {
        location,
        mapLink: locationService.createMapLink(location),
        error: null
      };
    } catch {
      return {
        location: null,
        mapLink: null,
        error: "Location unavailable."
      };
    }
  },

  buildLocationMessage(mapLink: string) {
    return [
      "I'm sharing my live location for safety.",
      `Location: ${mapLink}`
    ].join("\n");
  },

  buildEmergencyLocationMessage(mapLink: string, details: LocationDetails | null) {
    const city = details?.city?.trim() || "Unknown";
    const road = details?.road?.trim() || "Unknown";
    const landmark = details?.landmark?.trim() || "Unknown";

    return [
      "Emergency alert.",
      "I may be in danger.",
      "",
      "Location:",
      mapLink,
      `City: ${city}`,
      `Nearest road: ${road}`,
      `Nearest landmark: ${landmark}`
    ].join("\n");
  },

  async sendLocationSmsToContacts(contacts: Contact[]) {
    try {
      if (contacts.length === 0) {
        return {
          success: false,
          location: null as Coordinates | null,
          mapLink: null as string | null,
          error: "No trusted contacts added yet."
        };
      }

      const recipientNumbers = contacts
        .map((contact) => contact.phone.trim())
        .filter((phone) => phone.length > 0);

      if (recipientNumbers.length === 0) {
        return {
          success: false,
          location: null as Coordinates | null,
          mapLink: null as string | null,
          error: "No trusted contacts added yet."
        };
      }

      const available = await SMS.isAvailableAsync();
      if (!available) {
        return {
          success: false,
          location: null as Coordinates | null,
          mapLink: null as string | null,
          error: "SMS service unavailable on this device."
        };
      }

      const locationResult = await this.getCurrentLocationLink();
      if (!locationResult.location || !locationResult.mapLink) {
        return {
          success: false,
          location: null as Coordinates | null,
          mapLink: null as string | null,
          error: locationResult.error ?? "Location unavailable."
        };
      }

      const message = this.buildLocationMessage(locationResult.mapLink);
      await SMS.sendSMSAsync(recipientNumbers, message);

      return {
        success: true,
        location: locationResult.location,
        mapLink: locationResult.mapLink,
        error: null as string | null
      };
    } catch {
      return {
        success: false,
        location: null as Coordinates | null,
        mapLink: null as string | null,
        error: "Unable to share location right now."
      };
    }
  },

  async sendEmergencyLocationSms(input: {
    contacts: Contact[];
    coordinates: Coordinates | null;
    locationDetails?: LocationDetails | null;
  }) {
    try {
      if (!input.coordinates) {
        return {
          success: false,
          mapLink: null as string | null,
          error: "Location unavailable."
        };
      }

      const recipients = input.contacts
        .map((contact) => contact.phone.trim())
        .filter((phone) => phone.length > 0);

      if (recipients.length === 0) {
        return {
          success: false,
          mapLink: null as string | null,
          error: "No trusted contacts added yet."
        };
      }

      const available = await SMS.isAvailableAsync();
      if (!available) {
        return {
          success: false,
          mapLink: null as string | null,
          error: "SMS service unavailable on this device."
        };
      }

      const mapLink = locationService.createMapLink(input.coordinates);
      const details =
        input.locationDetails ??
        (await locationService.getLocationDetails(input.coordinates));
      const message = this.buildEmergencyLocationMessage(mapLink, details);
      await SMS.sendSMSAsync(recipients, message);

      return {
        success: true,
        mapLink,
        error: null as string | null
      };
    } catch {
      return {
        success: false,
        mapLink: null as string | null,
        error: "Unable to share location right now."
      };
    }
  },

  async copyLink(mapLink: string) {
    try {
      await Clipboard.setStringAsync(mapLink);
      return true;
    } catch {
      return false;
    }
  },

  async openMapLink(mapLink: string) {
    try {
      const canOpen = await Linking.canOpenURL(mapLink);
      if (!canOpen) {
        return false;
      }
      await Linking.openURL(mapLink);
      return true;
    } catch {
      return false;
    }
  }
};
