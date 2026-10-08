import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { Linking, Platform } from "react-native";

import type { AppSettings } from "../types";

const ANDROID_SYSTEM_RINGTONE_URI = "content://settings/system/ringtone";
const CLASSIC_RINGTONE_URI =
  "https://actions.google.com/sounds/v1/alarms/phone_alerts_and_rings.ogg";
const EMERGENCY_RINGTONE_URI =
  "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg";

type SupportedRingtone = "system" | "classic" | "emergency" | "silent";

const normalizeRingtone = (
  ringtone: AppSettings["fakeCallRingtone"]
): SupportedRingtone => {
  if (ringtone === "standard") {
    return "classic";
  }
  if (ringtone === "system") {
    return "system";
  }
  if (ringtone === "emergency") {
    return "emergency";
  }
  if (ringtone === "silent") {
    return "silent";
  }
  return "classic";
};

const buildCandidateSources = (ringtone: SupportedRingtone) => {
  if (ringtone === "silent") {
    return [];
  }

  if (ringtone === "system") {
    const sources: { uri: string }[] = [];
    if (Platform.OS === "android") {
      sources.push({ uri: ANDROID_SYSTEM_RINGTONE_URI });
    }
    sources.push({ uri: CLASSIC_RINGTONE_URI });
    return sources;
  }

  if (ringtone === "emergency") {
    return [{ uri: EMERGENCY_RINGTONE_URI }, { uri: CLASSIC_RINGTONE_URI }];
  }

  return [{ uri: CLASSIC_RINGTONE_URI }];
};

export const callService = {
  normalizeRingtone,

  async createRingtoneSound(
    ringtone: AppSettings["fakeCallRingtone"]
  ): Promise<Audio.Sound | null> {
    try {
      const normalized = normalizeRingtone(ringtone);
      if (normalized === "silent") {
        return null;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        playThroughEarpieceAndroid: false
      });

      const candidates = buildCandidateSources(normalized);
      for (const ringtoneSource of candidates) {
        try {
          const { sound } = await Audio.Sound.createAsync(ringtoneSource);
          await sound.setIsLoopingAsync(true);
          await sound.playAsync();
          return sound;
        } catch {
          // Try the next candidate source.
        }
      }

      return null;
    } catch {
      return null;
    }
  },

  async stopAndUnloadSound(sound: Audio.Sound | null | undefined) {
    if (!sound) {
      return;
    }

    try {
      await sound.stopAsync();
    } catch {
      // Ignore stop failures and continue cleanup.
    }

    try {
      await sound.unloadAsync();
    } catch {
      // Ignore unload failures to keep flow stable.
    }
  },

  async openSystemRingtoneSettings(): Promise<boolean> {
    try {
      if (Platform.OS === "android" && typeof Linking.sendIntent === "function") {
        await Linking.sendIntent("android.settings.SOUND_SETTINGS");
        return true;
      }

      await Linking.openSettings();
      return true;
    } catch {
      return false;
    }
  }
};

