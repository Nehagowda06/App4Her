import React from "react";
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";

import { colors, typography } from "../utils/theme";

type Props = {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  variant?: "primary" | "secondary" | "danger";
  onLongPress?: () => void;
  disabled?: boolean;
};

export const PrimaryButton = ({
  label,
  onPress,
  style,
  variant = "primary",
  onLongPress,
  disabled
}: Props) => (
  <TouchableOpacity
    onPress={onPress}
    onLongPress={onLongPress}
    disabled={disabled}
    activeOpacity={0.7}
    style={[
      styles.base,
      styles[variant],
      disabled && styles.disabled,
      style
    ]}
  >
    <Text style={styles.text}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  base: {
    minHeight: 65,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.2,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginVertical: 10
  },
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  secondary: {
    backgroundColor: colors.secondaryCard,
    borderColor: colors.secondaryCard
  },
  danger: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark
  },
  text: {
    ...typography.button
  },
  disabled: {
    opacity: 0.5
  }
});
