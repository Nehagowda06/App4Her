export const formatDistance = (meters: number) => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
};

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export const toTitleCase = (value: string) =>
  value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export const formatPhoneForDisplay = (value: string) => {
  const normalized = value.replace(/[^\d+]/g, "");
  if (normalized.startsWith("+")) {
    return normalized;
  }

  const digitsOnly = normalized.replace(/[^\d]/g, "");
  if (digitsOnly.length === 10) {
    return `+91 ${digitsOnly}`;
  }

  if (digitsOnly.length > 10) {
    return `+${digitsOnly}`;
  }

  return normalized;
};
