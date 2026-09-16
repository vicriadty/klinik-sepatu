import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "../../components/AppButton";
import type { AppStackParamList } from "../../navigation/types";
import type { Theme } from "../../theme/tokens";
import { useThemedStyles } from "../../theme/useTheme";
import { formatIDR } from "../../utils/format";

type Navigation = NativeStackNavigationProp<AppStackParamList, "OrderSuccess">;
type Route = RouteProp<AppStackParamList, "OrderSuccess">;

export default function OrderSuccessScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const styles = useThemedStyles(createStyles);
  const { orderNumber, customerName, grandTotal } = route.params;

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <View style={styles.content}>
        <Text style={styles.title}>Order dibuat</Text>
        <Text style={styles.orderNumber}>{orderNumber}</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Pelanggan</Text>
            <Text style={styles.rowValue}>{customerName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Total</Text>
            <Text style={styles.rowValue}>{formatIDR(grandTotal)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Pembayaran</Text>
            <Text style={styles.rowValue}>Belum dibayar</Text>
          </View>
        </View>

        <Text style={styles.note}>
          Pembayaran dan unggah foto akan tersedia pada fase berikutnya.
        </Text>

        <View style={styles.actions}>
          <AppButton
            title="Order Baru"
            onPress={() => navigation.replace("OrderCustomer")}
          />
          <AppButton
            title="Kembali ke Beranda"
            variant="ghost"
            onPress={() => navigation.navigate("Home")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = ({ colors, radius, spacing, typography }: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    content: {
      flex: 1,
      padding: spacing.xl,
      gap: spacing.xs,
    },
    title: {
      ...typography.headingSm,
      color: colors.ink,
    },
    orderNumber: {
      ...typography.mono,
      color: colors.mute,
    },
    card: {
      marginTop: spacing.xl,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      padding: spacing.lg,
      gap: spacing.md,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    rowLabel: {
      ...typography.body,
      color: colors.mute,
    },
    rowValue: {
      ...typography.subtitle,
      color: colors.ink,
      flexShrink: 1,
      textAlign: "right",
    },
    note: {
      ...typography.caption,
      color: colors.mute,
      marginTop: spacing.lg,
    },
    actions: {
      marginTop: "auto",
      gap: spacing.md,
    },
  });
