import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { AppStackParamList } from "../navigation/types";
import type { Theme } from "../theme/tokens";
import { useThemedStyles } from "../theme/useTheme";

type TabKey = "home" | "orders" | "customers" | "profile";
type NavigationRoute = "Home" | "Orders" | "Customers";
export type BottomNavigationTab = TabKey;

type IconName = "home" | "clipboard" | "users" | "profile";

interface TabDefinition {
  key: TabKey;
  label: string;
  icon: IconName;
  route?: NavigationRoute;
}

interface BottomNavigationProps {
  active: BottomNavigationTab;
}

const tabs: readonly TabDefinition[] = [
  { key: "home", label: "Beranda", icon: "home", route: "Home" },
  { key: "orders", label: "Pesanan", icon: "clipboard", route: "Orders" },
  { key: "customers", label: "Pelanggan", icon: "users", route: "Customers" },
  { key: "profile", label: "Profil", icon: "profile" },
];

type Navigation = NativeStackNavigationProp<AppStackParamList>;

function NavIcon({ name, color }: { name: IconName; color: string }) {
  if (name === "home") {
    return (
      <View style={iconStyles.base}>
        <View style={[iconStyles.homeRoof, { borderColor: color }]} />
        <View style={[iconStyles.homeBody, { borderColor: color }]} />
        <View style={[iconStyles.homeDoor, { backgroundColor: color }]} />
      </View>
    );
  }

  if (name === "clipboard") {
    return (
      <View style={iconStyles.base}>
        <View style={[iconStyles.clipboardBody, { borderColor: color }]} />
        <View style={[iconStyles.clipboardTop, { backgroundColor: color }]} />
      </View>
    );
  }

  if (name === "users") {
    return (
      <View style={iconStyles.base}>
        <View style={[iconStyles.userHead, { borderColor: color }]} />
        <View style={[iconStyles.userBody, { borderColor: color }]} />
        <View style={[iconStyles.userSideHead, { borderColor: color }]} />
        <View style={[iconStyles.userSideBody, { borderColor: color }]} />
      </View>
    );
  }

  return (
    <View style={iconStyles.base}>
      <View style={[iconStyles.profileHead, { borderColor: color }]} />
      <View style={[iconStyles.profileBody, { borderColor: color }]} />
    </View>
  );
}

export default function BottomNavigation({ active }: BottomNavigationProps) {
  const navigation = useNavigation<Navigation>();
  const styles = useThemedStyles(createStyles);

  const navigate = (route: NavigationRoute) => {
    if (route === "Home") {
      navigation.navigate("Home");
      return;
    }
    if (route === "Orders") {
      navigation.navigate("Orders");
      return;
    }
    navigation.navigate("Customers");
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.container} accessibilityRole="tablist">
        {tabs.map((tab) => {
          const selected = active === tab.key;
          const color = selected ? styles.active.color : styles.inactive.color;
          const disabled = !tab.route;

          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected, disabled }}
              disabled={disabled}
              onPress={() => {
                if (tab.route) {
                  navigate(tab.route);
                }
              }}
              style={({ pressed }) => [
                styles.tab,
                selected && styles.tabSelected,
                pressed && !disabled && styles.tabPressed,
              ]}
            >
              <NavIcon name={tab.icon} color={color} />
              <Text
                style={[
                  styles.label,
                  selected ? styles.active : styles.inactive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = ({ colors, layout, radius, spacing, typography }: Theme) =>
  StyleSheet.create({
    safeArea: {
      alignItems: "center",
      paddingHorizontal: layout.bottomNavigation.gutter,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      backgroundColor: colors.canvas,
    },
    container: {
      width: "100%",
      maxWidth: layout.bottomNavigation.width,
      minHeight: layout.bottomNavigation.height,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      padding: spacing.xs,
      borderWidth: 1,
      borderColor: colors.divider,
      borderRadius: radius.navigation,
      backgroundColor: colors.surface,
    },
    tab: {
      flex: 1,
      minHeight: layout.bottomNavigation.height - spacing.md,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xxs,
      borderRadius: radius.navigation,
      paddingHorizontal: spacing.xs,
    },
    tabSelected: {
      backgroundColor: colors.mutedSurface,
    },
    tabPressed: {
      opacity: 0.65,
    },
    label: {
      ...typography.nav,
    },
    active: {
      color: colors.ink,
    },
    inactive: {
      color: colors.stone,
    },
  });

const iconStyles = StyleSheet.create({
  base: {
    width: 20,
    height: 20,
    position: "relative",
  },
  homeRoof: {
    position: "absolute",
    top: 2,
    left: 4,
    width: 12,
    height: 12,
    borderWidth: 1.5,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    transform: [{ rotate: "45deg" }],
  },
  homeBody: {
    position: "absolute",
    top: 8,
    left: 4,
    width: 12,
    height: 9,
    borderWidth: 1.5,
    borderTopWidth: 0,
  },
  homeDoor: {
    position: "absolute",
    top: 12,
    left: 9,
    width: 2,
    height: 5,
  },
  clipboardBody: {
    position: "absolute",
    top: 3,
    left: 4,
    width: 12,
    height: 15,
    borderWidth: 1.5,
    borderRadius: 2,
  },
  clipboardTop: {
    position: "absolute",
    top: 2,
    left: 7,
    width: 6,
    height: 3,
    borderRadius: 1,
  },
  userHead: {
    position: "absolute",
    top: 2,
    left: 6,
    width: 7,
    height: 7,
    borderWidth: 1.5,
    borderRadius: 4,
  },
  userBody: {
    position: "absolute",
    top: 11,
    left: 3,
    width: 13,
    height: 7,
    borderWidth: 1.5,
    borderRadius: 7,
  },
  userSideHead: {
    position: "absolute",
    top: 5,
    left: 14,
    width: 4,
    height: 4,
    borderWidth: 1.5,
    borderRadius: 3,
  },
  userSideBody: {
    position: "absolute",
    top: 12,
    left: 14,
    width: 6,
    height: 5,
    borderWidth: 1.5,
    borderRadius: 5,
  },
  profileHead: {
    position: "absolute",
    top: 2,
    left: 6,
    width: 8,
    height: 8,
    borderWidth: 1.5,
    borderRadius: 8,
  },
  profileBody: {
    position: "absolute",
    top: 12,
    left: 3,
    width: 14,
    height: 7,
    borderWidth: 1.5,
    borderRadius: 8,
  },
});
