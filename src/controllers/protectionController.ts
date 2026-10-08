import { alertService } from "../services/alertService";
import { protectionRuntimeService } from "../services/protectionRuntimeService";
import type { Coordinates, SafeHavenWithDistance } from "../types";
import { ensureSafetyStoreHydrated } from "../state/hydration";
import { useSafetyStore } from "../state/useSafetyStore";
import { incidentController } from "./incidentController";
import { safeHavenController } from "./safeHavenController";

type ProtectionActivationResult = {
  location: Coordinates | null;
  safeHavens: SafeHavenWithDistance[];
  notificationStatus: string;
  dialerError: string | null;
  error: string | null;
};

let activationRequest: Promise<ProtectionActivationResult> | null = null;
let emergencySequenceToken = 0;

const wait = (durationMs: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, durationMs);
  });

const runEmergencyCallSequence = async (input: {
  contacts: { id: string; name: string; phone: string }[];
  sequenceToken: number;
}) => {
  const store = useSafetyStore.getState();

  for (const contact of input.contacts) {
    if (!store.protectionActive || input.sequenceToken !== emergencySequenceToken) {
      return;
    }

    if (!contact.phone.trim()) {
      continue;
    }

    try {
      store.setProtectionStatusMessage(`Calling ${contact.name || contact.phone}...`);
      await alertService.call(contact.phone);
    } catch {
      // Continue call chain even if a contact dial attempt fails.
    }

    if (!store.protectionActive || input.sequenceToken !== emergencySequenceToken) {
      return;
    }

    await wait(3000);
  }

  if (!store.protectionActive || input.sequenceToken !== emergencySequenceToken) {
    return;
  }

  try {
    store.setProtectionStatusMessage("Calling emergency services (112)...");
    await alertService.openEmergencyDialer();
  } catch {
    store.setProtectionStatusMessage("Unable to open dialer.");
    return;
  }

  if (store.protectionActive && input.sequenceToken === emergencySequenceToken) {
    store.setProtectionStatusMessage("Emergency actions running");
  }
};

export const protectionController = {
  async activateProtectionMode(): Promise<ProtectionActivationResult> {
    if (activationRequest) {
      return activationRequest;
    }

    activationRequest = (async () => {
      try {
        await ensureSafetyStoreHydrated();

        const store = useSafetyStore.getState();
        store.activateProtection();
        store.setProtectionStatusMessage("Emergency actions running");

        const safeHavenResult = await safeHavenController.loadNearbySafeHavens();
        const runtimeResult = await protectionRuntimeService.startRuntime({
          contacts: store.trustedContacts,
          autoSendLocation: store.settings.autoSendLocation,
          enableBackgroundTracking: store.settings.enableBackgroundTracking,
          batteryOptimization: store.settings.batteryOptimization
        });

        if (store.settings.autoIncidentLogging) {
          await incidentController.logIncident({
            type: "emergency",
            description: "Feature used: Protection Mode (SOS activation).",
            autoEvidence: "manual_report",
            manuallySaved: false
          });
        }

        emergencySequenceToken += 1;
        const sequenceToken = emergencySequenceToken;
        runEmergencyCallSequence({
          contacts: store.trustedContacts,
          sequenceToken
        }).catch(() => undefined);

        const notificationStatus =
          store.trustedContacts.length > 0
            ? `Trusted contacts notified: ${store.trustedContacts.length}`
            : "No trusted contacts available to notify.";

        return {
          ...safeHavenResult,
          notificationStatus,
          dialerError: runtimeResult.error,
          error: null
        };
      } catch {
        return {
          location: null,
          safeHavens: [],
          notificationStatus: "Unable to notify trusted contacts.",
          dialerError: "Unable to open dialer.",
          error: "Unable to activate protection mode."
        };
      } finally {
        activationRequest = null;
      }
    })();

    return activationRequest;
  },

  deactivateProtectionMode() {
    emergencySequenceToken += 1;
    protectionRuntimeService.stopRuntime();
    const store = useSafetyStore.getState();
    store.deactivateProtection();
  },

  async navigateToNearestSafeHaven() {
    const store = useSafetyStore.getState();
    const nearest = store.safeHavens[0];
    if (!nearest) {
      return false;
    }
    try {
      return await safeHavenController.openSafeHavenDirections(nearest);
    } catch {
      return false;
    }
  },

  async callPrimaryTrustedContact() {
    await ensureSafetyStoreHydrated();
    const store = useSafetyStore.getState();
    const primaryContact = store.trustedContacts[0];
    if (!primaryContact) {
      return {
        success: false,
        targetLabel: null as string | null,
        error: "No trusted contacts added yet."
      };
    }
    if (!primaryContact.phone?.trim()) {
      return {
        success: false,
        targetLabel: primaryContact.name,
        error: "No trusted contacts added yet."
      };
    }
    try {
      await alertService.call(primaryContact.phone);
      return {
        success: true,
        targetLabel: primaryContact.name,
        error: null as string | null
      };
    } catch {
      return {
        success: false,
        targetLabel: primaryContact.name,
        error: "Unable to open dialer."
      };
    }
  },

  async triggerEmergencyCall() {
    try {
      await alertService.openEmergencyDialer();
      return {
        success: true,
        targetLabel: "Emergency Services (112)",
        error: null as string | null
      };
    } catch {
      return {
        success: false,
        targetLabel: "Emergency Services (112)",
        error: "Unable to open dialer."
      };
    }
  }
};
