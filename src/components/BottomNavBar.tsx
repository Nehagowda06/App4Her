import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { safeNavigate } from "../navigation/safeNavigation";
import type { RootStackParamList } from "../navigation/types";
import { colors, spacing } from "../utils/theme";

type NavItem = {
  label: string;
  route: keyof RootStackParamList;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
};

const navItems: NavItem[] = [
  { label: "Fake Call", route: "FakeCallScreen", icon: "phone" },
  { label: "Home", route: "HomeScreen", icon: "home" },
  { label: "Protection", route: "ProtectionModeScreen", icon: "shield" },
  { label: "Safe Haven", route: "SafeHavenScreen", icon: "map-marker" }
];

export const BottomNavBar = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const tapLock = React.useRef(false);
  const lockTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (lockTimer.current) {
        clearTimeout(lockTimer.current);
        lockTimer.current = null;
      }
    },
    []
  );

  return (
    <View style={styles.container}>
      {navItems.map((item) => {
        const active = route.name === item.route;
        return (
          <TouchableOpacity
            key={item.route}
            style={styles.navItem}
            onPress={() => {
              if (active || tapLock.current) {
                return;
              }

              tapLock.current = true;
              safeNavigate(navigation, item.route);
              lockTimer.current = setTimeout(() => {
                tapLock.current = false;
                lockTimer.current = null;
              }, 250);
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <MaterialCommunityIcons
              name={item.icon}
              size={26}
              color={active ? colors.white : colors.navInactive}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    height: 70,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: spacing.sm
  },
  navItem: {
    minHeight: 70,
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  }
});
