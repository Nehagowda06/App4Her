import { incidentService } from "../services/incidentService";
import { locationService } from "../services/locationService";
import { useSafetyStore } from "../state/useSafetyStore";
import type { AutoEvidenceSource, IncidentType } from "../types";

export const incidentController = {
  async loadIncidents() {
    try {
      const incidents = await incidentService.loadIncidents();
      useSafetyStore.getState().setIncidents(incidents);
      return incidents;
    } catch {
      useSafetyStore.getState().setIncidents([]);
      return [];
    }
  },

  async logIncident(input: {
    type: IncidentType;
    description?: string;
    autoEvidence?: AutoEvidenceSource;
    manuallySaved?: boolean;
  }) {
    const store = useSafetyStore.getState();
    try {
      const location =
        store.currentLocation ?? (await locationService.getCurrentLocation());

      store.updateLocation(location);

      const incident = incidentService.createIncident({
        type: input.type,
        location,
        description: input.description,
        autoEvidence: input.autoEvidence,
        manuallySaved: input.manuallySaved ?? false
      });

      const updated = await incidentService.addIncident(incident);
      store.setIncidents(updated);

      return {
        incident,
        error: null as string | null
      };
    } catch {
      return {
        incident: null,
        error: "Unable to save incident."
      };
    }
  },

  async logAutomaticIncident(type: IncidentType, autoEvidence?: AutoEvidenceSource) {
    return this.logIncident({
      type,
      autoEvidence,
      manuallySaved: false
    });
  },

  async deleteIncident(incidentId: string) {
    try {
      const updated = await incidentService.deleteIncident(incidentId);
      useSafetyStore.getState().setIncidents(updated);
      return {
        incidents: updated,
        error: null as string | null
      };
    } catch {
      return {
        incidents: [],
        error: "Unable to delete incident."
      };
    }
  }
};
