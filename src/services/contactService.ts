import type { Contact } from "../types";
import { createId } from "../utils/id";

export const contactService = {
  normalizePhone(phone: string) {
    return phone.replace(/[^\d+]/g, "");
  },

  createContact(input: { name: string; phone: string }): Contact {
    const normalizedPhone = this.normalizePhone(input.phone);
    const normalizedName = input.name.trim() || normalizedPhone;
    return {
      id: createId("contact"),
      name: normalizedName,
      phone: normalizedPhone
    };
  }
};
