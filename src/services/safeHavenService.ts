import type {
  Coordinates,
  SafeHaven,
  SafeHavenCategory,
  SafeHavenWithDistance
} from "../types";

const EARTH_RADIUS_METERS = 6371000;
const SAFE_HAVEN_RADIUS_METERS = 5000;
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

type OverpassElement = {
  id: number;
  type: "node" | "way" | "relation";
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

const fallbackSafeHavens: SafeHaven[] = [
  {
    id: "fallback_1",
    name: "City Hospital",
    type: "hospital",
    latitude: 12.97456,
    longitude: 77.60382
  },
  {
    id: "fallback_2",
    name: "Police Station",
    type: "police_station",
    latitude: 12.97294,
    longitude: 77.60888
  },
  {
    id: "fallback_3",
    name: "Shopping Complex",
    type: "shopping_complex",
    latitude: 12.96967,
    longitude: 77.60673
  },
  {
    id: "fallback_4",
    name: "Metro Station",
    type: "metro_station",
    latitude: 12.97704,
    longitude: 77.57127
  },
  {
    id: "fallback_5",
    name: "Public Building",
    type: "public_building",
    latitude: 12.9712,
    longitude: 77.60525
  }
];

const toRadians = (value: number) => (value * Math.PI) / 180;

const calculateDistance = (user: Coordinates, haven: SafeHaven) => {
  const dLat = toRadians(haven.latitude - user.latitude);
  const dLon = toRadians(haven.longitude - user.longitude);
  const userLat = toRadians(user.latitude);
  const havenLat = toRadians(haven.latitude);
  const haversine =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(userLat) * Math.cos(havenLat) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine)));
};

const formatDistance = (distanceMeters: number | null | undefined) => {
  if (
    distanceMeters === null ||
    distanceMeters === undefined ||
    Number.isNaN(distanceMeters)
  ) {
    return "Distance unavailable";
  }
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} meters away`;
  }
  return `${(distanceMeters / 1000).toFixed(1)} km away`;
};

const categoryLabelMap: Record<SafeHavenCategory, string> = {
  hospital: "Hospital",
  police_station: "Police Station",
  school: "School",
  restaurant: "Restaurant",
  cafe: "Cafe",
  mall: "Mall",
  shopping_complex: "Shopping Complex",
  metro_station: "Metro Station",
  bus_station: "Bus Station",
  apartment_complex: "Apartment Complex",
  hotel: "Hotel",
  office: "Office",
  public_building: "Public Building",
  supermarket: "Supermarket",
  other: "Public Place"
};

const overpassQuery = (latitude: number, longitude: number) => `
[out:json][timeout:25];
(
  nwr(around:${SAFE_HAVEN_RADIUS_METERS},${latitude},${longitude})["amenity"="hospital"];
  nwr(around:${SAFE_HAVEN_RADIUS_METERS},${latitude},${longitude})["amenity"="clinic"];
  nwr(around:${SAFE_HAVEN_RADIUS_METERS},${latitude},${longitude})["amenity"="police"];
  nwr(around:${SAFE_HAVEN_RADIUS_METERS},${latitude},${longitude})["amenity"="school"];
  nwr(around:${SAFE_HAVEN_RADIUS_METERS},${latitude},${longitude})["amenity"="college"];
  nwr(around:${SAFE_HAVEN_RADIUS_METERS},${latitude},${longitude})["amenity"="university"];
  nwr(around:${SAFE_HAVEN_RADIUS_METERS},${latitude},${longitude})["amenity"="restaurant"];
  nwr(around:${SAFE_HAVEN_RADIUS_METERS},${latitude},${longitude})["amenity"="cafe"];
  nwr(around:${SAFE_HAVEN_RADIUS_METERS},${latitude},${longitude})["amenity"="food_court"];
  nwr(around:${SAFE_HAVEN_RADIUS_METERS},${latitude},${longitude})["amenity"="bus_station"];
  nwr(around:${SAFE_HAVEN_RADIUS_METERS},${latitude},${longitude})["amenity"="public_building"];
  nwr(around:${SAFE_HAVEN_RADIUS_METERS},${latitude},${longitude})["amenity"="community_centre"];
  nwr(around:${SAFE_HAVEN_RADIUS_METERS},${latitude},${longitude})["shop"="mall"];
  nwr(around:${SAFE_HAVEN_RADIUS_METERS},${latitude},${longitude})["shop"="department_store"];
  nwr(around:${SAFE_HAVEN_RADIUS_METERS},${latitude},${longitude})["shop"="supermarket"];
  nwr(around:${SAFE_HAVEN_RADIUS_METERS},${latitude},${longitude})["building"="retail"];
  nwr(around:${SAFE_HAVEN_RADIUS_METERS},${latitude},${longitude})["building"="commercial"];
  nwr(around:${SAFE_HAVEN_RADIUS_METERS},${latitude},${longitude})["railway"="station"];
  nwr(around:${SAFE_HAVEN_RADIUS_METERS},${latitude},${longitude})["railway"="subway_entrance"];
  nwr(around:${SAFE_HAVEN_RADIUS_METERS},${latitude},${longitude})["public_transport"="station"];
  nwr(around:${SAFE_HAVEN_RADIUS_METERS},${latitude},${longitude})["tourism"="hotel"];
  nwr(around:${SAFE_HAVEN_RADIUS_METERS},${latitude},${longitude})["building"="apartments"];
  nwr(around:${SAFE_HAVEN_RADIUS_METERS},${latitude},${longitude})["building"="residential"];
  nwr(around:${SAFE_HAVEN_RADIUS_METERS},${latitude},${longitude})["building"="office"];
  nwr(around:${SAFE_HAVEN_RADIUS_METERS},${latitude},${longitude})["office"];
  nwr(around:${SAFE_HAVEN_RADIUS_METERS},${latitude},${longitude})["building"="public"];
  nwr(around:${SAFE_HAVEN_RADIUS_METERS},${latitude},${longitude})["building"="civic"];
  nwr(around:${SAFE_HAVEN_RADIUS_METERS},${latitude},${longitude})["building"="government"];
);
out center;
`;

const classifyCategory = (tags?: Record<string, string>): SafeHavenCategory => {
  if (!tags) {
    return "other";
  }

  if (tags.amenity === "hospital") return "hospital";
  if (tags.amenity === "clinic") return "hospital";
  if (tags.amenity === "police") return "police_station";
  if (tags.amenity === "school" || tags.amenity === "college" || tags.amenity === "university") return "school";
  if (tags.amenity === "restaurant") return "restaurant";
  if (tags.amenity === "cafe" || tags.amenity === "food_court") return "cafe";
  if (tags.amenity === "bus_station") return "bus_station";
  if (tags.shop === "mall") return "mall";
  if (tags.shop === "supermarket") return "supermarket";
  if (
    tags.railway === "station" ||
    tags.station === "subway" ||
    tags.railway === "subway_entrance"
  ) {
    return "metro_station";
  }
  if (tags.public_transport === "station") return "bus_station";
  if (tags.tourism === "hotel") return "hotel";
  if (
    tags.building === "apartments" ||
    tags.building === "residential" ||
    tags.landuse === "residential"
  ) {
    return "apartment_complex";
  }
  if (tags.office || tags.building === "office") return "office";
  if (
    tags.amenity === "public_building" ||
    tags.building === "public" ||
    tags.building === "civic" ||
    tags.building === "government"
  ) {
    return "public_building";
  }
  if (
    tags.shop === "department_store" ||
    tags.shop === "commercial" ||
    tags.building === "retail" ||
    tags.building === "commercial"
  ) {
    return "shopping_complex";
  }

  return "other";
};

const elementCoordinates = (element: OverpassElement) => {
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }
  return { latitude, longitude };
};

const mapElementToSafeHaven = (element: OverpassElement): SafeHaven | null => {
  const coords = elementCoordinates(element);
  if (!coords) {
    return null;
  }
  const type = classifyCategory(element.tags);
  const name =
    element.tags?.name?.trim() ||
    element.tags?.brand?.trim() ||
    categoryLabelMap[type];

  return {
    id: `osm_${element.type}_${element.id}`,
    name,
    type,
    latitude: coords.latitude,
    longitude: coords.longitude
  };
};

const dedupeSafeHavens = (havens: SafeHaven[]) => {
  const seen = new Set<string>();
  const unique: SafeHaven[] = [];

  for (const haven of havens) {
    const key = `${haven.name}_${haven.latitude.toFixed(5)}_${haven.longitude.toFixed(5)}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(haven);
  }

  return unique;
};

const buildDistanceList = (userLocation: Coordinates, safeHavens: SafeHaven[]) =>
  safeHavens
    .map((haven) => ({
      ...haven,
      distanceMeters: calculateDistance(userLocation, haven)
    }))
    .filter((haven) => haven.distanceMeters <= SAFE_HAVEN_RADIUS_METERS)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

const fetchNearbySafeHavens = async (
  userLocation: Coordinates
): Promise<SafeHavenWithDistance[]> => {
  const query = overpassQuery(userLocation.latitude, userLocation.longitude);
  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: `data=${encodeURIComponent(query)}`
  });

  if (!response.ok) {
    throw new Error("Safe Haven API request failed.");
  }

  const payload = (await response.json()) as OverpassResponse;
  const elements = Array.isArray(payload.elements) ? payload.elements : [];
  const mapped = dedupeSafeHavens(
    elements.map((element) => mapElementToSafeHaven(element)).filter((haven): haven is SafeHaven => Boolean(haven))
  );

  return buildDistanceList(userLocation, mapped);
};

const getFallbackSafeHavens = (
  userLocation?: Coordinates | null
): SafeHavenWithDistance[] =>
  fallbackSafeHavens
    .map((haven) => ({
      ...haven,
      distanceMeters: userLocation ? calculateDistance(userLocation, haven) : Number.NaN,
      isFallback: true
    }))
    .sort((a, b) => {
      if (Number.isNaN(a.distanceMeters) || Number.isNaN(b.distanceMeters)) {
        return 0;
      }
      return a.distanceMeters - b.distanceMeters;
    });

const getCategoryLabel = (category: SafeHavenCategory) => categoryLabelMap[category] ?? "Public Place";

export const safeHavenService = {
  fetchNearbySafeHavens,
  calculateDistance,
  getFallbackSafeHavens,
  formatDistance,
  getCategoryLabel,
  SAFE_HAVEN_RADIUS_METERS
};
