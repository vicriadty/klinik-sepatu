import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchOrders, PAYMENT_STATUS_LABELS } from "../../api/orders";
import BottomNavigation from "../../components/BottomNavigation";
import EmptyState from "../../components/EmptyState";
import StatusPill from "../../components/StatusPill";
import type { AppStackParamList } from "../../navigation/types";
import { ORDER_STATUS_LABELS } from "../../order/status";
import type { Theme } from "../../theme/tokens";
import { useTheme, useThemedStyles } from "../../theme/useTheme";
import { formatIDR } from "../../utils/format";

type Navigation = NativeStackNavigationProp<AppStackParamList, "History">;

function formatCurrency(value: number) {
  return formatIDR(value).replace("Rp", "Rp ");
}

async function fetchHistory() {
  const [completed, cancelled] = await Promise.all([
    fetchOrders({ status: "COMPLETED", page: 1, per_page: 50 }),
    fetchOrders({ status: "CANCELLED", page: 1, per_page: 50 }),
  ]);

  return [...completed.data, ...cancelled.data].sort((left, right) => {
    const leftTime = left.created_at ? Date.parse(left.created_at) : 0;
    const rightTime = right.created_at ? Date.parse(right.created_at) : 0;
    return rightTime - leftTime;
  });
}

export default function HistoryScreen() {
  const navigation = useNavigation<Navigation>();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const historyQuery = useQuery({
    queryKey: ["order-history"],
    queryFn: fetchHistory,
  });

  const orders = historyQuery.data ?? [];

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Riwayat</Text>
        <Text style={styles.subtitle}>
          {orders.length} pesanan selesai atau dibatalkan
        </Text>
      </View>

      {historyQuery.isLoading ? (
        <ActivityIndicator color={theme.colors.ink} size="large" style={styles.loader} />
      ) : historyQuery.isError ? (
        <EmptyState
          title="Gagal memuat riwayat."
          message="Periksa koneksi lalu coba lagi."
          actionTitle="Coba lagi"
          onAction={() => void historyQuery.refetch()}
        />
      ) : orders.length === 0 ? (
        <EmptyState
          title="Belum ada riwayat."
          message="Pesanan selesai atau dibatalkan akan muncul di sini."
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={historyQuery.isRefetching}
              onRefresh={() => void historyQuery.refetch()}
              tintColor={theme.colors.ink}
            />
          }
          renderItem={({ item }) => {
            const itemCount = item.items_count ?? item.items?.length ?? 0;
            const isCancelled = item.status === "CANCELLED";

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Order ${item.order_number}`}
                onPress={() => navigation.navigate("OrderDetail", { orderId: item.id })}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.orderNumber}>{item.order_number}</Text>
                  <StatusPill
                    label={ORDER_STATUS_LABELS[item.status].toUpperCase()}
                    tone={isCancelled ? "neutral" : "dark"}
                    appearance="solid"
                    compact
                    style={styles.status}
                  />
                </View>
                <Text style={styles.customer} numberOfLines={1}>
                  {item.customer?.name ?? "Pelanggan"} · {itemCount} sepatu
                </Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.payment}>
                    {PAYMENT_STATUS_LABELS[item.payment_status]}
                  </Text>
                  <Text style={styles.total}>{formatCurrency(item.grand_total)}</Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
      <BottomNavigation active="history" />
    </SafeAreaView>
  );
}

const createStyles = ({ colors, layout, radius, spacing, typography }: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    header: {
      paddingHorizontal: layout.screen.gutter,
      paddingTop: layout.statusBarHeight + spacing.md,
      paddingBottom: spacing.lg,
    },
    title: {
      ...typography.headingLg,
      color: colors.ink,
    },
    subtitle: {
      ...typography.bodyUi,
      marginTop: spacing.xxs,
      color: colors.mute,
    },
    loader: {
      marginTop: spacing.xxl,
    },
    listContent: {
      paddingHorizontal: layout.screen.gutter,
      paddingBottom: spacing.xl,
    },
    card: {
      minHeight: 78,
      marginBottom: spacing.sm,
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.md,
      backgroundColor: colors.card,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    orderNumber: {
      ...typography.mono,
      color: colors.ink,
    },
    customer: {
      ...typography.caption,
      color: colors.mute,
    },
    cardFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    payment: {
      ...typography.caption,
      color: colors.mute,
    },
    total: {
      ...typography.caption,
      color: colors.ink,
    },
    status: {
      minWidth: 86,
      minHeight: 28,
      justifyContent: "center",
    },
    pressed: {
      opacity: 0.85,
    },
  });
