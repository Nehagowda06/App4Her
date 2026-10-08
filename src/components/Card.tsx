import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

import { colors, radius, shadows } from "../utils/theme";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export const Card = ({ children, style }: Props) => (
  <View style={[styles.card, style]}>{children}</View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...shadows.card
  }
});
