import React from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { safeNavigate } from "../navigation/safeNavigation";
import type { RootStackParamList } from "../navigation/types";
import { colors, spacing, typography } from "../utils/theme";
import { BottomNavBar } from "./BottomNavBar";
import { HeaderBar } from "./HeaderBar";

type Props = {
  title: string;
  children: React.ReactNode;
  subtitle?: string;
  onTitleLongPress?: () => void;
  contentStyle?: ViewStyle;
};

type DrawerItem = {
  label: string;
  route: keyof RootStackParamList;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
};

const drawerItems: DrawerItem[] = [
  { label: "Home", route: "HomeScreen", icon: "home" },
  { label: "Incident Log", route: "IncidentLogScreen", icon: "file-document-outline" },
  { label: "Location Sharing", route: "LocationShareScreen", icon: "map-marker-outline" },
  { label: "Trusted Contacts", route: "TrustedContactsScreen", icon: "account-group-outline" },
  { label: "Safety AI", route: "SituationAIScreen", icon: "robot-outline" },
  { label: "Settings", route: "SettingsScreen", icon: "cog-outline" }
];

export const AppLayout = ({
  title,
  children,
  subtitle,
  onTitleLongPress,
  contentStyle
}: Props) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const drawerTranslateX = React.useRef(new Animated.Value(-320)).current;

  React.useEffect(() => {
    Animated.timing(drawerTranslateX, {
      toValue: drawerOpen ? 0 : -320,
      duration: 180,
      useNativeDriver: true
    }).start();
  }, [drawerOpen, drawerTranslateX]);

  const closeDrawer = () => setDrawerOpen(false);
  const openDrawer = () => setDrawerOpen(true);

  const handleDrawerNavigate = (route: keyof RootStackParamList) => {
    closeDrawer();
    safeNavigate(navigation, route);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <HeaderBar
          title={title}
          onMenuPress={openDrawer}
          onTitleLongPress={onTitleLongPress}
        />
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <View style={[styles.content, contentStyle]}>{children}</View>
        <BottomNavBar />
      </View>

      <Modal
        visible={drawerOpen}
        transparent
        animationType="none"
        onRequestClose={closeDrawer}
      >
        <View style={styles.drawerRoot}>
          <TouchableOpacity
            style={styles.drawerOverlay}
            activeOpacity={1}
            onPress={closeDrawer}
          />

          <Animated.View
            style={[
              styles.drawerPanel,
              {
                transform: [{ translateX: drawerTranslateX }]
              }
            ]}
          >
            <View style={styles.drawerTop}>
              <MaterialCommunityIcons name="menu" size={40} color={colors.textDark} />
            </View>

            {drawerItems.map((item) => (
              <TouchableOpacity
                key={item.route}
                style={styles.drawerItem}
                activeOpacity={0.7}
                onPress={() => handleDrawerNavigate(item.route)}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={22}
                  color={colors.textDark}
                />
                <Text style={styles.drawerItemText}>{item.label}</Text>
              </TouchableOpacity>
            ))}

            <View style={styles.drawerFooter}>
              <View style={styles.drawerAvatar} />
              <TouchableOpacity
                style={styles.drawerFooterButton}
                activeOpacity={0.7}
                onPress={() => handleDrawerNavigate("ProfileScreen")}
              >
                <Text style={styles.drawerFooterText}>Profile</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  page: {
    flex: 1,
    backgroundColor: colors.background
  },
  subtitle: {
    ...typography.body,
    color: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm
  },
  content: {
    flex: 1
  },
  drawerRoot: {
    flex: 1
  },
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#00000033"
  },
  drawerPanel: {
    width: "74%",
    height: "100%",
    backgroundColor: colors.white,
    paddingTop: spacing.xl,
    borderRightWidth: 1,
    borderRightColor: colors.border
  },
  drawerTop: {
    minHeight: 64,
    justifyContent: "center",
    paddingLeft: spacing.lg
  },
  drawerItem: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingLeft: 20
  },
  drawerItemText: {
    fontSize: 16,
    color: colors.textDark,
    fontWeight: "500"
  },
  drawerFooter: {
    marginTop: "auto",
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  drawerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.softSurface
  },
  drawerFooterButton: {
    flex: 1,
    minHeight: 44,
    justifyContent: "center"
  },
  drawerFooterText: {
    fontSize: 16,
    color: colors.textDark,
    fontWeight: "500"
  }
});
