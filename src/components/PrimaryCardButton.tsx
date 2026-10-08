import React from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle
} from "react-native";

import { colors, typography } from "../utils/theme";

type Props = {
  title: string;
  subtitle?: string;
  onPress: () => void;
  onLongPress?: () => void;
  delayLongPress?: number;
  disabled?: boolean;
  style?: ViewStyle;
};

export const PrimaryCardButton = ({
  title,
  subtitle,
  onPress,
  onLongPress,
  delayLongPress,
  disabled,
  style
}: Props) => {
  const scale = React.useRef(new Animated.Value(1)).current;

  const animateScale = (toValue: number) => {
    Animated.timing(scale, {
      toValue,
      duration: 90,
      useNativeDriver: true
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={delayLongPress}
        disabled={disabled}
        onPressIn={() => animateScale(0.96)}
        onPressOut={() => animateScale(1)}
        style={[styles.cardButton, disabled && styles.disabled, style]}
      >
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardButton: {
    backgroundColor: colors.softSurface,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 70,
    justifyContent: "center",
    marginVertical: 8
  },
  title: {
    ...typography.title,
    fontSize: 18,
    textAlign: "center",
    color: colors.textDark
  },
  subtitle: {
    marginTop: 8,
    ...typography.body,
    textAlign: "center",
    color: colors.textDark
  },
  disabled: {
    opacity: 0.55
  }
});
