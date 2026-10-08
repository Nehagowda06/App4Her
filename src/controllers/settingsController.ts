import { contactService } from "../services/contactService";
import { alertService } from "../services/alertService";
import { useSafetyStore } from "../state/useSafetyStore";
import type { AppSettings, ProfileData } from "../types";

export const settingsController = {
  addTrustedContact(input: { name: string; phone: string }) {
    const normalizedPhone = contactService.normalizePhone(input.phone);
    if (!normalizedPhone) {
      return {
        success: false,
        error: "Enter a valid phone number."
      };
    }

    const store = useSafetyStore.getState();
    const alreadyExists = store.trustedContacts.some(
      (contact) => contact.phone === normalizedPhone
    );
    if (alreadyExists) {
      return {
        success: false,
        error: "This contact is already in your trusted list."
      };
    }

    const contact = contactService.createContact({
      name: input.name,
      phone: normalizedPhone
    });

    store.setTrustedContacts([...store.trustedContacts, contact]);
    return {
      success: true,
      error: null as string | null
    };
  },

  removeTrustedContact(contactId: string) {
    const store = useSafetyStore.getState();
    store.setTrustedContacts(
      store.trustedContacts.filter((trustedContact) => trustedContact.id !== contactId)
    );
  },

  async callTrustedContact(contactId: string) {
    const store = useSafetyStore.getState();
    const contact = store.trustedContacts.find(
      (trustedContact) => trustedContact.id === contactId
    );

    if (!contact || !contact.phone?.trim()) {
      return {
        success: false,
        error: "No trusted contacts added yet."
      };
    }

    try {
      await alertService.call(contact.phone);
      return {
        success: true,
        error: null as string | null
      };
    } catch {
      return {
        success: false,
        error: "Unable to open dialer."
      };
    }
  },

  updateSettings(settings: Partial<AppSettings>) {
    useSafetyStore.getState().updateSettings(settings);
  },

  updateProfile(profile: Partial<ProfileData>) {
    useSafetyStore.getState().updateProfile(profile);
  },

  async resetAppData() {
    await useSafetyStore.getState().resetAppData();
  }
};
