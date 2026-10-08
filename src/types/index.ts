export type Coordinates = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
};

export type Contact = {
  id: string;
  name: string;
  phone: string;
};

export type IncidentType =
  | "room_scan"
  | "drink_scan"
  | "manual_report"
  | "emergency"
  | "other";

export type AutoEvidenceSource = "room_scan" | "drink_scan" | "manual_report";

export type Incident = {
  id: string;
  timestamp: string;
  type: IncidentType;
  location: Coordinates | null;
  description?: string;
  autoEvidence?: AutoEvidenceSource;
  manuallySaved: boolean;
};

export type SafeHavenCategory =
  | "hospital"
  | "police_station"
  | "school"
  | "restaurant"
  | "cafe"
  | "mall"
  | "shopping_complex"
  | "metro_station"
  | "bus_station"
  | "apartment_complex"
  | "hotel"
  | "office"
  | "public_building"
  | "supermarket"
  | "other";

export type SafeHaven = {
  id: string;
  name: string;
  type: SafeHavenCategory;
  latitude: number;
  longitude: number;
};

export type SafeHavenWithDistance = SafeHaven & {
  distanceMeters: number;
  isFallback?: boolean;
};

export type SituationGuide = {
  id: string;
  title: string;
  indicators: string[];
  actions: string[];
};

export type IncidentRiskLevel = "low" | "medium" | "high" | "critical";

export type IncidentKnowledgeItem = {
  incident_title: string;
  keywords: string[];
  risk_level: IncidentRiskLevel;
  recommended_actions: string[];
};

export type RoomSafetyCheck = {
  id: string;
  label: string;
  checked: boolean;
};

export type LocationDetails = {
  city: string;
  road: string;
  landmark: string;
};

export type AppSettings = {
  autoCall112: boolean;
  autoSendLocation: boolean;
  enableBackgroundTracking: boolean;
  batteryOptimization: boolean;
  autoIncidentLogging: boolean;
  incidentLogAutoDeleteDays: number;
  fakeCallRingtone: "system" | "classic" | "emergency" | "silent" | "standard";
  protectionPin: string;
};

export type CameraCaptureMode = "room_scan" | "drink_scan" | "incident_photo";

export type ProfileData = {
  name: string;
  emergencyMessage: string;
};
