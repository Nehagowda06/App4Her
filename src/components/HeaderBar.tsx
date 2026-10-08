import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { safeNavigate } from "../navigation/safeNavigation";
import type { RootStackParamList } from "../navigation/types";
import { colors, spacing } from "../utils/theme";

type Props = {
  title: string;
  onMenuPress?: () => void;
  onTitleLongPress?: () => void;
};

export const HeaderBar = ({ title, onMenuPress, onTitleLongPress }: Props) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleMenuPress = () => {
    if (onMenuPress) {
      onMenuPress();
      return;
    }
    safeNavigate(navigation, "SettingsScreen");
  };

  const handleProfilePress = () => {
    safeNavigate(navigation, "ProfileScreen");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleMenuPress}
        style={styles.iconButton}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="menu" size={28} color={colors.textDark} />
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={1}
        style={styles.titleWrap}
        onPress={() => undefined}
        onLongPress={onTitleLongPress}
        delayLongPress={900}
        disabled={!onTitleLongPress}
      >
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.profilePlaceholder}
        activeOpacity={0.7}
        onPress={handleProfilePress}
      >
        <MaterialCommunityIcons name="account-outline" size={26} color={colors.textDark} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0"
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.textDark,
    textAlign: "center",
    maxWidth: 220
  },
  titleWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFE8F4",
    alignItems: "center",
    justifyContent: "center"
  }
});
