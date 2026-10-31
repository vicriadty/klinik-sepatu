import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, View } from "react-native";
import NativeIcon from "./NativeIcon";
import type { AppStackParamList } from "../navigation/types";
import type { Theme } from "../theme/tokens";
import { useThemedStyles } from "../theme/useTheme";

type TabKey = "home" | "orders" | "customers" | "history";
type NavigationRoute = "Home" | "Orders" | "Customers" | "History";
export type BottomNavigationTab = TabKey;

interface TabDefinition {
  key: TabKey;
  label: string;
  icon: "home" | "clipboard" | "users" | "history";
  route: NavigationRoute;
}

interface BottomNavigationProps {
  active: BottomNavigationTab;
}

const tabs: readonly TabDefinition[] = [
  { key: "home", label: "Beranda", icon: "home", route: "Home" },
  { key: "orders", label: "Pesanan", icon: "clipboard", route: "Orders" },
  { key: "customers", label: "Pelanggan", icon: "users", route: "Customers" },
  { key: "history", label: "Riwayat", icon: "history", route: "History" },
];

type Navigation = NativeStackNavigationProp<AppStackParamList>;

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
    if (route === "Customers") {
      navigation.navigate("Customers");
      return;
    }
    navigation.navigate("History");
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.container} accessibilityRole="tablist">
        {tabs.map((tab) => {
          const selected = active === tab.key;
          const color = selected ? styles.active.color : styles.inactive.color;

          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected }}
              onPress={() => navigate(tab.route)}
              style={({ pressed }) => [
                styles.tab,
                selected && styles.tabSelected,
                pressed && styles.tabPressed,
              ]}
            >
              <NativeIcon name={tab.icon} color={color} size={20} />
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
