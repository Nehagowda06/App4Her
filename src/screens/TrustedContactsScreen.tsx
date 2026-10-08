import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import * as Contacts from "expo-contacts";

import { AppLayout } from "../components/AppLayout";
import { PrimaryButton } from "../components/PrimaryButton";
import { settingsController } from "../controllers/settingsController";
import { ensureSafetyStoreHydrated } from "../state/hydration";
import { useSafetyStore } from "../state/useSafetyStore";
import { colors, shadows, spacing, typography } from "../utils/theme";
import { formatPhoneForDisplay } from "../utils/formatters";

type DeviceContact = {
  id: string;
  name: string;
  phone: string;
};

const getDisplayName = (name: string, phone: string) => {
  const trimmedName = name.trim();
  if (trimmedName.length > 0) {
    return trimmedName;
  }
  return formatPhoneForDisplay(phone);
};

const extractPhone = (contact: Contacts.Contact) => {
  const firstPhone = contact.phoneNumbers?.find((phoneEntry) => phoneEntry.number);
  return firstPhone?.number?.trim();
};

export const TrustedContactsScreen = () => {
  const trustedContacts = useSafetyStore((state) => state.trustedContacts);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [deviceContacts, setDeviceContacts] = useState<DeviceContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const [callingContactId, setCallingContactId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const hydrate = async () => {
      try {
        await ensureSafetyStoreHydrated();
      } catch {
        if (mounted) {
          setError("Something went wrong. Please try again.");
        }
      } finally {
        if (mounted) {
          setHydrating(false);
        }
      }
    };
    hydrate().catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  const sortedTrustedContacts = useMemo(
    () =>
      [...trustedContacts].sort((a, b) =>
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      ),
    [trustedContacts]
  );

  const loadDeviceContacts = async () => {
    if (hydrating) {
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const permission = await Contacts.requestPermissionsAsync();
      if (permission.status !== "granted") {
        setError("Contacts permission is required to add trusted contacts.");
        return;
      }

      const response = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers]
      });

      const contactsWithPhone = response.data
        .map((contact) => {
          const phone = extractPhone(contact);
          if (!phone) {
            return null;
          }
          return {
            id: contact.id,
            name: contact.name || "",
            phone
          };
        })
        .filter((item): item is DeviceContact => Boolean(item));

      if (contactsWithPhone.length === 0) {
        setError("No phone contacts available on this device.");
        return;
      }

      setDeviceContacts(contactsWithPhone);
      setPickerVisible(true);
    } catch {
      setError("Unable to load device contacts right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectContact = (contact: DeviceContact) => {
    setError(null);
    const result = settingsController.addTrustedContact({
      name: contact.name,
      phone: contact.phone
    });

    if (!result.success) {
      setError(result.error);
      return;
    }

    setPickerVisible(false);
  };

  const handleRemoveContact = (contactId: string) => {
    settingsController.removeTrustedContact(contactId);
  };

  const handleCallContact = async (contactId: string) => {
    if (callingContactId) {
      return;
    }

    setCallingContactId(contactId);
    setError(null);
    try {
      const result = await settingsController.callTrustedContact(contactId);
      if (!result.success) {
        setError(result.error);
      }
    } catch {
      setError("Unable to open dialer.");
    } finally {
      setCallingContactId(null);
    }
  };

  return (
    <AppLayout title="Trusted Contacts">
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.container}>
          <PrimaryButton
            label={
              hydrating
                ? "Loading Contacts..."
                : loading
                  ? "Loading Contacts..."
                  : "Add Trusted Contact"
            }
            onPress={() => {
              loadDeviceContacts().catch(() => undefined);
            }}
            disabled={loading || hydrating}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {hydrating ? <Text style={styles.meta}>Loading trusted contacts...</Text> : null}

          {!hydrating && sortedTrustedContacts.length === 0 ? (
            <Text style={styles.meta}>No trusted contacts added yet.</Text>
          ) : null}

          {sortedTrustedContacts.map((contact) => (
            <View key={contact.id} style={styles.contactCard}>
              <Text style={styles.name}>{getDisplayName(contact.name, contact.phone)}</Text>
              <Text style={styles.phone}>{formatPhoneForDisplay(contact.phone)}</Text>
              <PrimaryButton
                label={callingContactId === contact.id ? "Opening..." : "Call"}
                onPress={() => {
                  handleCallContact(contact.id).catch(() => undefined);
                }}
                variant="secondary"
                style={styles.removeButton}
                disabled={Boolean(callingContactId)}
              />
              <PrimaryButton
                label="Remove"
                onPress={() => handleRemoveContact(contact.id)}
                variant="secondary"
                style={styles.removeButton}
                disabled={Boolean(callingContactId)}
              />
            </View>
          ))}
        </ScrollView>
      </View>

      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select a contact</Text>
            <ScrollView contentContainerStyle={styles.modalList}>
              {deviceContacts.map((contact) => (
                <TouchableOpacity
                  key={contact.id}
                  style={styles.modalItem}
                  activeOpacity={0.7}
                  onPress={() => handleSelectContact(contact)}
                >
                  <Text style={styles.modalName}>
                    {getDisplayName(contact.name, contact.phone)}
                  </Text>
                  <Text style={styles.modalPhone}>{formatPhoneForDisplay(contact.phone)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <PrimaryButton
              label="Close"
              onPress={() => setPickerVisible(false)}
              variant="secondary"
            />
          </View>
        </View>
      </Modal>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1
  },
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl
  },
  meta: {
    ...typography.body
  },
  error: {
    ...typography.body,
    color: colors.primaryDark
  },
  contactCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    gap: spacing.sm,
    ...shadows.card
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222"
  },
  phone: {
    ...typography.body,
    color: "#666"
  },
  removeButton: {
    marginVertical: 0
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000099",
    justifyContent: "flex-end"
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "70%",
    gap: spacing.sm
  },
  modalTitle: {
    ...typography.title,
    color: "#222"
  },
  modalList: {
    gap: spacing.sm
  },
  modalItem: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#FFFFFF",
    ...shadows.card
  },
  modalName: {
    ...typography.body,
    color: "#222"
  },
  modalPhone: {
    ...typography.body,
    color: "#666"
  }
});

