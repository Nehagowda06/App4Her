import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";

import { AppLayout } from "../components/AppLayout";
import { safeHavenController } from "../controllers/safeHavenController";
import { locationService } from "../services/locationService";
import { safeHavenService } from "../services/safeHavenService";
import { useSafetyStore } from "../state/useSafetyStore";
import type { SafeHavenWithDistance } from "../types";
import { colors, shadows, spacing, typography } from "../utils/theme";

const DEFAULT_REGION: Region = {
  latitude: 12.9716,
  longitude: 77.5946,
  latitudeDelta: 0.09,
  longitudeDelta: 0.09
};

const getRegion = (
  currentLocation: { latitude: number; longitude: number } | null,
  havens: SafeHavenWithDistance[]
): Region => {
  if (currentLocation) {
    return {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08
    };
  }

  const firstHaven = havens[0];
  if (firstHaven) {
    return {
      latitude: firstHaven.latitude,
      longitude: firstHaven.longitude,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08
    };
  }

  return DEFAULT_REGION;
};

export const SafeHavenScreen = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [navigatingId, setNavigatingId] = useState<string | null>(null);
  const [selectedHavenId, setSelectedHavenId] = useState<string | null>(null);
  const { safeHavens, currentLocation } = useSafetyStore((state) => ({
    safeHavens: state.safeHavens,
    currentLocation: state.currentLocation
  }));

  const selectedHaven = useMemo(
    () => safeHavens.find((haven) => haven.id === selectedHavenId) ?? null,
    [safeHavens, selectedHavenId]
  );

  const mapRegion = useMemo(
    () => getRegion(currentLocation, safeHavens),
    [currentLocation, safeHavens]
  );

  const loadNearbyHelp = async (location?: { latitude: number; longitude: number } | null) => {
    setLoading(true);
    setError(null);
    try {
      const result = await safeHavenController.loadNearbySafeHavens(location ?? undefined);
      if (result.error) {
        setError(result.error);
      }
      if (result.safeHavens.length > 0) {
        const firstHavenId = result.safeHavens[0]?.id ?? null;
        setSelectedHavenId((current) =>
          current && result.safeHavens.some((haven) => haven.id === current)
            ? current
            : firstHavenId
        );
      } else {
        setSelectedHavenId(null);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let locationSubscription: { remove: () => void } | null = null;

    const initialize = async () => {
      try {
        await loadNearbyHelp();

        locationSubscription = await locationService.startBalancedTracking(
          (updatedLocation) => {
            safeHavenController
              .loadNearbySafeHavens(updatedLocation)
              .then((result) => {
                if (!mounted) {
                  return;
                }
                setError(result.error);
                if (result.safeHavens.length > 0) {
                  const firstHavenId = result.safeHavens[0]?.id ?? null;
                  setSelectedHavenId((current) =>
                    current && result.safeHavens.some((haven) => haven.id === current)
                      ? current
                      : firstHavenId
                  );
                } else {
                  setSelectedHavenId(null);
                }
              })
              .catch(() => {
                if (mounted) {
                  setError("Something went wrong. Please try again.");
                }
              });
          }
        );
      } catch {
        if (mounted) {
          setError("Something went wrong. Please try again.");
          setLoading(false);
        }
      }
    };

    initialize().catch(() => {
      if (mounted) {
        setError("Something went wrong. Please try again.");
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  const handleNavigate = async (safeHaven: SafeHavenWithDistance) => {
    if (navigatingId) {
      return;
    }

    setNavigatingId(safeHaven.id);
    try {
      const opened = await safeHavenController.openSafeHavenDirections(safeHaven);
      if (!opened) {
        setError("Unable to open Google Maps.");
      }
    } catch {
      setError("Unable to open Google Maps.");
    } finally {
      setNavigatingId(null);
    }
  };

  return (
    <AppLayout title="Nearby Help">
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.mapWrap}>
            {loading ? (
              <View style={styles.loaderWrap}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <MapView
                style={styles.map}
                initialRegion={mapRegion}
                region={mapRegion}
                showsUserLocation={Boolean(currentLocation)}
                showsMyLocationButton
              >
                {safeHavens.map((haven) => (
                  <Marker
                    key={haven.id}
                    coordinate={{ latitude: haven.latitude, longitude: haven.longitude }}
                    title={haven.name}
                    description={`${safeHavenService.getCategoryLabel(haven.type)} - ${
                      haven.isFallback ? "Fallback data" : safeHavenService.formatDistance(haven.distanceMeters)
                    }`}
                    pinColor={selectedHavenId === haven.id ? "#D72638" : "#522C5D"}
                    onPress={() => setSelectedHavenId(haven.id)}
                  />
                ))}
              </MapView>
            )}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {!loading && safeHavens.length === 0 ? (
            <Text style={styles.errorText}>No safe havens available right now.</Text>
          ) : null}

          {selectedHaven ? (
            <View style={styles.selectedCard}>
              <Text style={styles.selectedName}>{selectedHaven.name}</Text>
              <Text style={styles.selectedDistance}>
                {safeHavenService.getCategoryLabel(selectedHaven.type)}
              </Text>
              <Text style={styles.selectedDistance}>
                {currentLocation
                  ? safeHavenService.formatDistance(selectedHaven.distanceMeters)
                  : "Distance unavailable"}
              </Text>
              {selectedHaven.isFallback ? (
                <Text style={styles.fallbackBadge}>Fallback safe location</Text>
              ) : null}
              <TouchableOpacity
                style={styles.navigateButton}
                disabled={Boolean(navigatingId)}
                activeOpacity={0.7}
                onPress={() => {
                  handleNavigate(selectedHaven).catch(() => undefined);
                }}
              >
                <Text style={styles.navigateButtonText}>
                  {navigatingId === selectedHaven.id ? "Opening..." : "Navigate"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.list}>
            {safeHavens.map((haven) => (
              <View key={haven.id} style={styles.havenCard}>
                <Text style={styles.placeName}>{haven.name}</Text>
                <Text style={styles.typeText}>{safeHavenService.getCategoryLabel(haven.type)}</Text>
                <Text style={styles.distanceText}>
                  {currentLocation
                    ? safeHavenService.formatDistance(haven.distanceMeters)
                    : "Distance unavailable"}
                </Text>
                {haven.isFallback ? (
                  <Text style={styles.fallbackBadge}>Fallback safe location</Text>
                ) : null}
                <TouchableOpacity
                  style={styles.navigateButton}
                  disabled={Boolean(navigatingId)}
                  activeOpacity={0.7}
                  onPress={() => {
                    handleNavigate(haven).catch(() => undefined);
                  }}
                >
                  <Text style={styles.navigateButtonText}>
                    {navigatingId === haven.id ? "Opening..." : "Navigate"}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
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
  mapWrap: {
    width: "100%",
    height: 280,
    borderRadius: 18,
    overflow: "hidden",
    ...shadows.card
  },
  map: {
    width: "100%",
    height: "100%"
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFEAF2"
  },
  errorText: {
    ...typography.body
  },
  selectedCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 18,
    padding: 20,
    gap: spacing.sm,
    ...shadows.card
  },
  selectedName: {
    ...typography.title,
    color: colors.textLight
  },
  selectedDistance: {
    ...typography.body,
    color: colors.textLight
  },
  fallbackBadge: {
    color: colors.accentSoft,
    fontWeight: "700"
  },
  list: {
    gap: spacing.md
  },
  havenCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 18,
    padding: 20,
    gap: spacing.xs,
    ...shadows.card
  },
  placeName: {
    ...typography.title,
    color: colors.textLight
  },
  typeText: {
    ...typography.body,
    color: colors.textLight,
    textTransform: "capitalize"
  },
  distanceText: {
    ...typography.body,
    color: colors.textLight
  },
  navigateButton: {
    alignSelf: "flex-start",
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.secondaryCard,
    paddingHorizontal: 16,
    justifyContent: "center"
  },
  navigateButtonText: {
    ...typography.button
  }
});
