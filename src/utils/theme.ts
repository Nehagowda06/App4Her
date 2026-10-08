export const colors = {
  primaryDark: "#29104A",
  primary: "#29104A",
  cardBackground: "#FFFFFF",
  secondaryCard: "#522C5D",
  accent: "#845162",
  accentSoft: "#BFA6C8",
  background: "#FFFFFF",
  textLight: "#29104A",
  textDark: "#29104A",
  white: "#FFFFFF",
  navInactive: "#BFA6C8",
  softSurface: "#F6F2F8",

  // Compatibility tokens for existing screens/components.
  surface: "#FFFFFF",
  primaryPressed: "#522C5D",
  text: "#29104A",
  muted: "#845162",
  border: "#F0F0F0",
  success: "#845162",
  danger: "#29104A",
  warning: "#845162"
};

export const spacing = {
  xs: 8,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 24
};

export const shadows = {
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  }
};

export const typography = {
  title: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: "#29104A"
  },
  body: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: "#29104A"
  },
  button: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF"
  }
};
