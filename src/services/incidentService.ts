import AsyncStorage from "@react-native-async-storage/async-storage";

import type { AutoEvidenceSource, Coordinates, Incident, IncidentType } from "../types";
import { createId } from "../utils/id";

const INCIDENTS_STORAGE_KEY = "app4her_incidents_v3";
const AUTO_DELETE_DAYS = 30;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const validIncidentTypes: IncidentType[] = [
  "room_scan",
  "drink_scan",
  "manual_report",
  "emergency",
  "other"
];

const validEvidenceSources: AutoEvidenceSource[] = [
  "room_scan",
  "drink_scan",
  "manual_report"
];

const normalizeCoordinates = (value: unknown): Coordinates | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<Coordinates>;
  if (typeof candidate.latitude !== "number" || typeof candidate.longitude !== "number") {
    return null;
  }

  return {
    latitude: candidate.latitude,
    longitude: candidate.longitude,
    accuracy:
      typeof candidate.accuracy === "number" || candidate.accuracy === null
        ? candidate.accuracy
        : null
  };
};

const normalizeIncident = (value: unknown): Incident | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Partial<Incident> & {
    notes?: string;
    mediaUri?: string;
  };

  if (!raw.id || typeof raw.id !== "string") {
    return null;
  }

  const normalizedType = validIncidentTypes.includes(raw.type as IncidentType)
    ? (raw.type as IncidentType)
    : "manual_report";

  const normalizedEvidence = validEvidenceSources.includes(
    raw.autoEvidence as AutoEvidenceSource
  )
    ? (raw.autoEvidence as AutoEvidenceSource)
    : raw.notes || raw.mediaUri
      ? "manual_report"
      : undefined;

  return {
    id: raw.id,
    timestamp:
      typeof raw.timestamp === "string" ? raw.timestamp : new Date().toISOString(),
    type: normalizedType,
    location: normalizeCoordinates(raw.location),
    description:
      typeof raw.description === "string"
        ? raw.description
        : typeof raw.notes === "string"
          ? raw.notes
          : undefined,
    autoEvidence: normalizedEvidence,
    manuallySaved:
      typeof raw.manuallySaved === "boolean" ? raw.manuallySaved : true
  };
};

const safeParse = (raw: string | null): Incident[] => {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((item) => normalizeIncident(item))
      .filter((item): item is Incident => Boolean(item));
  } catch {
    return [];
  }
};

const isExpiredAutoIncident = (incident: Incident, nowMs: number) => {
  if (incident.manuallySaved) {
    return false;
  }
  const timestampMs = new Date(incident.timestamp).getTime();
  if (Number.isNaN(timestampMs)) {
    return true;
  }
  return nowMs - timestampMs > AUTO_DELETE_DAYS * DAY_IN_MS;
};

const cleanupIncidents = (incidents: Incident[]) => {
  const nowMs = Date.now();
  return incidents.filter((incident) => !isExpiredAutoIncident(incident, nowMs));
};

export const incidentService = {
  async loadIncidents(): Promise<Incident[]> {
    try {
      const raw = await AsyncStorage.getItem(INCIDENTS_STORAGE_KEY);
      const parsed = safeParse(raw);
      const cleaned = cleanupIncidents(parsed);

      if (cleaned.length !== parsed.length) {
        await AsyncStorage.setItem(INCIDENTS_STORAGE_KEY, JSON.stringify(cleaned));
      }

      return cleaned;
    } catch {
      return [];
    }
  },

  async saveIncidents(incidents: Incident[]): Promise<void> {
    try {
      await AsyncStorage.setItem(INCIDENTS_STORAGE_KEY, JSON.stringify(incidents));
    } catch {
      // Avoid crashing when storage write fails.
    }
  },

  createIncident(input: {
    type: IncidentType;
    location?: Coordinates | null;
    description?: string;
    autoEvidence?: AutoEvidenceSource;
    manuallySaved?: boolean;
    coordinates?: Coordinates | null;
  }): Incident {
    const derivedLocation =
      input.location !== undefined ? input.location : input.coordinates ?? null;

    return {
      id: createId("incident"),
      timestamp: new Date().toISOString(),
      type: input.type,
      location: derivedLocation,
      description: input.description?.trim() || undefined,
      autoEvidence: input.autoEvidence,
      manuallySaved: input.manuallySaved ?? false
    };
  },

  async addIncident(incident: Incident): Promise<Incident[]> {
    try {
      const existing = await this.loadIncidents();
      const updated = [incident, ...existing];
      await this.saveIncidents(updated);
      return updated;
    } catch {
      return [incident];
    }
  },

  async deleteIncident(incidentId: string): Promise<Incident[]> {
    try {
      const existing = await this.loadIncidents();
      const updated = existing.filter((incident) => incident.id !== incidentId);
      await this.saveIncidents(updated);
      return updated;
    } catch {
      return [];
    }
  },

  async clearIncidents(): Promise<void> {
    try {
      await AsyncStorage.removeItem(INCIDENTS_STORAGE_KEY);
    } catch {
      // Avoid crashing when clear fails.
    }
  }
};
