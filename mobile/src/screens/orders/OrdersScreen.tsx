import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  fetchOrders,
  PAYMENT_STATUS_LABELS,
  type ApiOrder,
  type OrderStatus,
  type PaymentStatus,
} from "../../api/orders";
import AppButton from "../../components/AppButton";
import BottomNavigation from "../../components/BottomNavigation";
import EmptyState from "../../components/EmptyState";
import FilterChip from "../../components/FilterChip";
import StatusPill, { type PillTone } from "../../components/StatusPill";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import type { AppStackParamList } from "../../navigation/types";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
} from "../../order/status";
import type { Theme } from "../../theme/tokens";
import { useTheme, useThemedStyles } from "../../theme/useTheme";
import { formatIDR } from "../../utils/format";

type Navigation = NativeStackNavigationProp<AppStackParamList, "Orders">;

const PAGE_SIZE = 15;
const PAYMENT_FILTERS: PaymentStatus[] = ["UNPAID", "PARTIAL", "PAID"];
type OpenFilter = "status" | "payment" | null;

const PAYMENT_DISPLAY_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "BELUM DIBAYAR",
  PARTIAL: "SEBAGIAN",
  PAID: "LUNAS",
};

function formatOrderCurrency(value: number) {
  return formatIDR(value).replace("Rp", "Rp ");
}

function statusTone(status: OrderStatus): PillTone {
  if (status === "ON_PROCESS") return "dark";
  if (status === "READY_FOR_PICKUP") return "success";
  if (status === "COMPLETED") return "neutral";
  return ORDER_STATUS_TONES[status];
}

function paymentTone(status: PaymentStatus): PillTone {
  return status === "PAID" ? "success" : "warning";
}

type OrdersIconName = "search" | "plus" | "calendar" | "chevron";

function OrdersIcon({
  name,
  color,
  size = 18,
}: {
  name: OrdersIconName;
  color: string;
  size?: number;
}) {
  if (name === "plus") {
    return (
      <View
        pointerEvents="none"
        style={[iconStyles.base, { width: size, height: size }]}
      >
        <View style={[iconStyles.line, { top: size / 2, left: 1, width: size - 2, backgroundColor: color }]} />
        <View style={[iconStyles.line, { top: 1, left: size / 2, height: size - 2, backgroundColor: color }]} />
      </View>
    );
  }

  if (name === "search") {
    return (
      <View
        pointerEvents="none"
        style={[iconStyles.base, { width: size, height: size }]}
      >
        <View style={[iconStyles.circle, { width: size - 5, height: size - 5, borderColor: color }]} />
        <View style={[iconStyles.line, { top: size - 4, left: size - 5, width: 7, backgroundColor: color, transform: [{ rotate: "45deg" }] }]} />
      </View>
    );
  }

  if (name === "calendar") {
    return (
      <View
        pointerEvents="none"
        style={[iconStyles.base, { width: size, height: size }]}
      >
        <View style={[iconStyles.calendar, { width: size - 2, height: size - 3, borderColor: color }]} />
        <View style={[iconStyles.line, { top: 5, left: 1, width: size - 4, backgroundColor: color }]} />
        <View style={[iconStyles.line, { top: 1, left: 4, height: 4, backgroundColor: color }]} />
        <View style={[iconStyles.line, { top: 1, right: 4, height: 4, backgroundColor: color }]} />
      </View>
    );
  }

  return (
    <View
      pointerEvents="none"
      style={[iconStyles.base, { width: size, height: size }]}
    >
      <View style={[iconStyles.line, { top: 6, left: 4, width: 8, backgroundColor: color, transform: [{ rotate: "45deg" }] }]} />
      <View style={[iconStyles.line, { top: 11, left: 4, width: 8, backgroundColor: color, transform: [{ rotate: "-45deg" }] }]} />
    </View>
  );
}

export default function OrdersScreen() {
  const navigation = useNavigation<Navigation>();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(
    null
  );
  const [openFilter, setOpenFilter] = useState<OpenFilter>(null);
  const search = useDebouncedValue(searchInput.trim(), 300);

  const ordersQuery = useInfiniteQuery({
    queryKey: ["orders", search, status, paymentStatus],
    queryFn: ({ pageParam }) =>
      fetchOrders({
        ...(search !== "" ? { search } : {}),
        ...(status !== null ? { status } : {}),
        ...(paymentStatus !== null ? { payment_status: paymentStatus } : {}),
        page: pageParam,
        per_page: PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.last_page
        ? lastPage.meta.page + 1
        : undefined,
  });

  const orders: ApiOrder[] =
    ordersQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const isEmpty =
    !ordersQuery.isLoading && !ordersQuery.isError && orders.length === 0;
  const totalOrders = ordersQuery.data?.pages[0]?.meta.total ?? orders.length;

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Pesanan</Text>
            <Text style={styles.count}>{totalOrders} pesanan aktif</Text>
          </View>
          <AppButton
            title="Baru"
            size="compact"
            onPress={() => navigation.navigate("OrderCustomer")}
            accessibilityLabel="Buat pesanan baru"
            style={styles.newButton}
            leftIcon={<OrdersIcon name="plus" color={theme.colors.onPrimary} />}
          />
        </View>

        <View style={styles.searchContainer}>
          <OrdersIcon name="search" color={theme.colors.mute} />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Cari nomor atau pelanggan"
            placeholderTextColor={theme.colors.stone}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={styles.searchInput}
            accessibilityLabel="Cari order"
          />
        </View>

        <View style={styles.filterRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Hari ini"
            accessibilityState={{ disabled: true }}
            disabled
            style={[styles.filterButton, styles.dateFilter]}
          >
            <OrdersIcon name="calendar" color={theme.colors.mute} size={16} />
            <Text style={styles.filterLabel}>Hari ini</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Status"
            accessibilityState={{ selected: openFilter === "status" }}
            onPress={() => setOpenFilter(openFilter === "status" ? null : "status")}
            style={[styles.filterButton, styles.statusFilter]}
          >
            <Text style={styles.filterLabel} numberOfLines={1}>
              {status ? ORDER_STATUS_LABELS[status] : "Status"}
            </Text>
            <OrdersIcon name="chevron" color={theme.colors.stone} size={16} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Pembayaran"
            accessibilityState={{ selected: openFilter === "payment" }}
            onPress={() =>
              setOpenFilter(openFilter === "payment" ? null : "payment")
            }
            style={[styles.filterButton, styles.paymentFilter]}
          >
            <Text style={styles.filterLabel} numberOfLines={1}>
              {paymentStatus
                ? PAYMENT_STATUS_LABELS[paymentStatus]
                : "Pembayaran"}
            </Text>
            <OrdersIcon name="chevron" color={theme.colors.stone} size={16} />
          </Pressable>
        </View>

        {openFilter ? (
          <View style={styles.filterMenu}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.menuOptions}
            >
              {openFilter === "status" ? (
                <>
                  <FilterChip
                    label="Semua status"
                    selected={status === null}
                    onPress={() => {
                      setStatus(null);
                      setOpenFilter(null);
                    }}
                  />
                  {ORDER_STATUSES.map((option) => (
                    <FilterChip
                      key={option}
                      label={ORDER_STATUS_LABELS[option]}
                      selected={status === option}
                      onPress={() => {
                        setStatus(option);
                        setOpenFilter(null);
                      }}
                    />
                  ))}
                </>
              ) : (
                <>
                  <FilterChip
                    label="Semua bayar"
                    selected={paymentStatus === null}
                    onPress={() => {
                      setPaymentStatus(null);
                      setOpenFilter(null);
                    }}
                  />
                  {PAYMENT_FILTERS.map((option) => (
                    <FilterChip
                      key={option}
                      label={PAYMENT_STATUS_LABELS[option]}
                      selected={paymentStatus === option}
                      onPress={() => {
                        setPaymentStatus(option);
                        setOpenFilter(null);
                      }}
                    />
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        ) : null}
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Daftar pesanan</Text>
        <Text style={styles.sortLabel}>Terbaru</Text>
      </View>

      {ordersQuery.isLoading ? (
        <ActivityIndicator
          size="large"
          color={theme.colors.ink}
          style={styles.loader}
        />
      ) : ordersQuery.isError ? (
        <EmptyState
          title="Gagal memuat order."
          message="Periksa koneksi lalu coba lagi."
        />
      ) : isEmpty ? (
        <EmptyState
          title="Belum ada order."
          message="Order baru akan muncul di sini."
        />
      ) : (
        <FlatList
          style={styles.list}
          data={orders}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (ordersQuery.hasNextPage && !ordersQuery.isFetchingNextPage) {
              void ordersQuery.fetchNextPage();
            }
          }}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Order ${item.order_number}`}
              onPress={() =>
                navigation.navigate("OrderDetail", { orderId: item.id })
              }
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <View style={styles.rowHeader}>
                <Text style={styles.orderNumber}>{item.order_number}</Text>
                <StatusPill
                  label={ORDER_STATUS_LABELS[item.status].toUpperCase()}
                  tone={statusTone(item.status)}
                  appearance="solid"
                  compact
                  style={styles.orderStatus}
                />
              </View>
              <Text style={styles.customer} numberOfLines={1}>
                {item.customer?.name ?? "Pelanggan"} · {item.items_count ?? item.items?.length ?? 0} sepatu
              </Text>
              <View style={styles.rowFooter}>
                <StatusPill
                  label={PAYMENT_DISPLAY_LABELS[item.payment_status]}
                  tone={paymentTone(item.payment_status)}
                  appearance="text"
                  style={styles.paymentStatus}
                />
                <Text style={styles.total}>{formatOrderCurrency(item.grand_total)}</Text>
              </View>
            </Pressable>
          )}
          ListFooterComponent={
            ordersQuery.isFetchingNextPage ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.ink}
                style={styles.footerLoader}
              />
            ) : null
          }
        />
      )}
      <BottomNavigation active="orders" />
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
      paddingTop: layout.statusBarHeight + spacing.md,
      paddingBottom: spacing.sm,
      gap: spacing.md,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      paddingHorizontal: layout.screen.gutter,
    },
    title: {
      ...typography.headingLg,
      color: colors.ink,
    },
    count: {
      ...typography.bodyUi,
      color: colors.mute,
    },
    newButton: {
      minWidth: 88,
      paddingHorizontal: spacing.md,
    },
    searchContainer: {
      height: 46,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.lg,
      marginHorizontal: layout.screen.gutter,
      paddingHorizontal: spacing.lg,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.sm,
      backgroundColor: colors.card,
    },
    searchInput: {
      flex: 1,
      height: 44,
      paddingHorizontal: 0,
      ...typography.body,
      color: colors.ink,
    },
    filterRow: {
      flexDirection: "row",
      gap: spacing.sm,
      paddingHorizontal: layout.screen.gutter,
    },
    filterButton: {
      height: 32,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.full,
      backgroundColor: colors.card,
    },
    dateFilter: {
      width: 110,
      justifyContent: "flex-start",
    },
    statusFilter: {
      width: 102,
    },
    paymentFilter: {
      flex: 1,
    },
    filterLabel: {
      ...typography.button,
      color: colors.ink,
    },
    filterMenu: {
      paddingTop: spacing.xs,
    },
    menuOptions: {
      gap: spacing.sm,
      paddingHorizontal: layout.screen.gutter,
    },
    listHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: spacing.xl,
      marginBottom: spacing.sm,
      paddingHorizontal: layout.screen.gutter,
    },
    listTitle: {
      ...typography.section,
      color: colors.ink,
    },
    sortLabel: {
      ...typography.bodyUi,
      color: colors.mute,
    },
    loader: {
      marginTop: spacing.xxl,
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
    },
    list: {
      flex: 1,
    },
    row: {
      minHeight: 78,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.sm,
      gap: spacing.xs,
    },
    rowPressed: {
      opacity: 0.85,
    },
    rowHeader: {
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
    rowFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    orderStatus: {
      minWidth: 100,
      minHeight: 28,
      justifyContent: "center",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xxs,
    },
    paymentStatus: {
      alignSelf: "center",
    },
    total: {
      ...typography.caption,
      color: colors.ink,
    },
    footerLoader: {
      marginVertical: spacing.md,
    },
  });

const iconStyles = StyleSheet.create({
  base: {
    position: "relative",
  },
  line: {
    position: "absolute",
    height: 1.5,
  },
  circle: {
    position: "absolute",
    borderWidth: 1.5,
    borderRadius: 99,
  },
  calendar: {
    position: "absolute",
    top: 2,
    left: 1,
    borderWidth: 1.5,
    borderRadius: 2,
  },
});
