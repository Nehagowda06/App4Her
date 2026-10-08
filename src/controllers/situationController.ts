import { useSafetyStore } from "../state/useSafetyStore";

export const situationController = {
  selectSituation(situationId: string | null) {
    useSafetyStore.getState().setSituation(situationId);
  }
};
