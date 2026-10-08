import { ensureSafetyStoreHydrated } from "../state/hydration";
import { useSafetyStore } from "../state/useSafetyStore";
import type { Contact } from "../types";

const fallbackContact: Contact = {
  id: "fallback_contact",
  name: "Dad",
  phone: ""
};

let callDurationTimer: ReturnType<typeof setInterval> | null = null;

const stopCallTimer = () => {
  if (!callDurationTimer) {
    return;
  }
  clearInterval(callDurationTimer);
  callDurationTimer = null;
};

const startCallTimer = () => {
  stopCallTimer();
  callDurationTimer = setInterval(() => {
    useSafetyStore.getState().incrementCallDuration();
  }, 1000);
};

export const callController = {
  async triggerFakeCall(contact?: Contact) {
    try {
      await ensureSafetyStoreHydrated();
      const store = useSafetyStore.getState();
      if (store.activeCall) {
        return {
          contact:
            store.activeCallContact ??
            store.trustedContacts[0] ??
            fallbackContact,
          reusedSession: true,
          callAlreadyAccepted: store.callDuration > 0
        };
      }

      const selectedContact = contact ?? store.trustedContacts[0] ?? fallbackContact;
      stopCallTimer();
      store.startFakeCall(selectedContact);
      return {
        contact: selectedContact,
        reusedSession: false,
        callAlreadyAccepted: false
      };
    } catch {
      return {
        contact: fallbackContact,
        reusedSession: false,
        callAlreadyAccepted: false
      };
    }
  },

  async acceptFakeCall() {
    await ensureSafetyStoreHydrated();
    const store = useSafetyStore.getState();
    if (!store.activeCall) {
      return false;
    }

    startCallTimer();
    return true;
  },

  incrementCallDuration() {
    const store = useSafetyStore.getState();
    store.incrementCallDuration();
  },

  async endFakeCall() {
    await ensureSafetyStoreHydrated();
    const store = useSafetyStore.getState();
    stopCallTimer();
    store.endFakeCall();
  },

  stopCallTimer() {
    stopCallTimer();
  }
};
