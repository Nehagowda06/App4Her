import { locationShareService } from "../services/locationShareService";
import { useSafetyStore } from "../state/useSafetyStore";

export const locationShareController = {
  async shareLocationWithTrustedContacts() {
    const store = useSafetyStore.getState();

    try {
      const result = await locationShareService.sendLocationSmsToContacts(
        store.trustedContacts
      );

      if (result.location) {
        store.updateLocation(result.location);
      }

      return result;
    } catch {
      return {
        success: false,
        location: null,
        mapLink: null,
        error: "Unable to share location right now."
      };
    }
  }
};
