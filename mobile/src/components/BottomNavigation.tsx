import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { AppStackParamList } from "../navigation/types";
import type { Theme } from "../theme/tokens";
import { useThemedStyles } from "../theme/useTheme";

type TabKey = "home" | "orders" | "customers" | "new-order";
export type BottomNavigationTab = Exclude<TabKey, "new-order">;

type IconName = "home" | "clipboard" | "users" | "plus";

interface BottomNavigationProps {
  active: BottomNavigationTab;
}

const tabs = [
  { key: "home", label: "Beranda", icon: "home" },
  { key: "orders", label: "Pesanan", icon: "clipboard" },
  { key: "customers", label: "Pelanggan", icon: "users" },
  { key: "new-order", label: "Tambah", icon: "plus" },
] as const;

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
    <View style={[iconStyles.base, iconStyles.plusCircle, { borderColor: color }]}>
      <View style={[iconStyles.plusHorizontal, { backgroundColor: color }]} />
      <View style={[iconStyles.plusVertical, { backgroundColor: color }]} />
    </View>
  );
}

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
        const isNewOrder = tab.key === "new-order";
        const color = isNewOrder
          ? styles.newOrderIcon.color
          : selected
            ? styles.active.color
            : styles.inactive.color;

        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected }}
            onPress={() => navigate(tab.key)}
            style={({ pressed }) => [
              styles.tab,
              isNewOrder && styles.newOrderTab,
              selected && styles.tabSelected,
              pressed && styles.tabPressed,
            ]}
          >
            <NavIcon name={tab.icon} color={color} />
            <Text
              style={[
                styles.label,
                isNewOrder ? styles.newOrderIcon : selected ? styles.active : styles.inactive,
              ]}
            >
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
    newOrderTab: {
      backgroundColor: colors.primary,
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
    newOrderIcon: {
      color: colors.onPrimary,
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
  plusCircle: {
    borderWidth: 1.5,
    borderRadius: 10,
  },
  plusHorizontal: {
    position: "absolute",
    top: 9,
    left: 5,
    width: 7,
    height: 1.5,
  },
  plusVertical: {
    position: "absolute",
    top: 5,
    left: 8,
    width: 1.5,
    height: 7,
  },
});
