import Feather from "@expo/vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { AppStackParamList } from "../navigation/types";
import type { Theme } from "../theme/tokens";
import { useThemedStyles } from "../theme/useTheme";

type TabKey = "home" | "orders" | "customers" | "new-order";
export type BottomNavigationTab = Exclude<TabKey, "new-order">;

interface BottomNavigationProps {
  active: BottomNavigationTab;
}

const tabs = [
  { key: "home", label: "Beranda", icon: "home" },
  { key: "orders", label: "Pesanan", icon: "clipboard" },
  { key: "customers", label: "Pelanggan", icon: "users" },
  { key: "new-order", label: "Tambah", icon: "plus-circle" },
] as const;

type Navigation = NativeStackNavigationProp<AppStackParamList>;

export default function BottomNavigation({ active }: BottomNavigationProps) {
  const navigation = useNavigation<Navigation>();
  const styles = useThemedStyles(createStyles);

  const navigate = (tab: TabKey) => {
    if (tab === "home") {
      navigation.navigate("Home");
      return;
    }
    if (tab === "orders") {
      navigation.navigate("Orders");
      return;
    }
    if (tab === "customers") {
      navigation.navigate("Customers");
      return;
    }
    navigation.navigate("OrderCustomer");
  };

  return (
    <View style={styles.container} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const selected = active === tab.key;

        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected }}
            onPress={() => navigate(tab.key)}
            style={({ pressed }) => [
              styles.tab,
              selected && styles.tabSelected,
              pressed && styles.tabPressed,
            ]}
          >
            <Feather
              name={tab.icon}
              size={20}
              color={selected ? styles.active.color : styles.inactive.color}
            />
            <Text style={[styles.label, selected ? styles.active : styles.inactive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = ({ colors, radius, spacing, typography }: Theme) =>
  StyleSheet.create({
    container: {
      minHeight: 62,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      backgroundColor: colors.card,
    },
    tab: {
      flex: 1,
      minHeight: 48,
      alignItems: "center",
      justifyContent: "center",
      gap: 3,
      borderRadius: radius.sm,
    },
    tabSelected: {
      backgroundColor: colors.bone,
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
