import { useCallback, useState } from "react";

import { locationService } from "../services/locationService";
import { useSafetyStore } from "../state/useSafetyStore";

export const useCurrentLocation = () => {
  const [loading, setLoading] = useState(false);
  const updateLocation = useSafetyStore((state) => state.updateLocation);

  const refreshLocation = useCallback(async () => {
    setLoading(true);
    try {
      const location = await locationService.getCurrentLocation();
      updateLocation(location);
      return location;
    } catch {
      updateLocation(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [updateLocation]);

  return { refreshLocation, loading };
};
