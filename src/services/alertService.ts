import { Linking, Share } from "react-native";

import type { Contact, Coordinates } from "../types";
import { locationService } from "./locationService";

const buildContactsLabel = (contacts: Contact[]) =>
  contacts.length === 0 ? "No trusted contacts set" : contacts.map((c) => c.name).join(", ");

export const alertService = {
  buildMessage(input: {
    source: string;
    contacts: Contact[];
    coordinates: Coordinates | null;
  }) {
    const mapLink = locationService.createMapLink(input.coordinates);
    return [
      "App4Her Safety Alert",
      `Trigger: ${input.source}`,
      "I may be unsafe. Please check in with me now.",
      mapLink ? `Location: ${mapLink}` : "Location unavailable",
      `Trusted contacts: ${buildContactsLabel(input.contacts)}`,
      `Time: ${new Date().toLocaleString()}`
    ].join("\n");
  },

  async shareAlert(message: string) {
    try {
      await Share.share({ message });
    } catch {
      throw new Error("Unable to open sharing options.");
    }
  },

  async call(phone: string) {
    const url = `tel:${phone}`;
    try {
      await Linking.openURL(url);
    } catch {
      throw new Error("Unable to open phone dialer.");
    }
  },

  async openEmergencyDialer() {
    try {
      await Linking.openURL("tel:112");
    } catch {
      throw new Error("Unable to open dialer.");
    }
  },

  async openDirections(latitude: number, longitude: number) {
    try {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        throw new Error("Unable to open map application.");
      }
      await Linking.openURL(url);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Unable to open map application.");
    }
  }
};
