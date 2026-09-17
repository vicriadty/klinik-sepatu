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
import EmptyState from "../../components/EmptyState";
import FilterChip from "../../components/FilterChip";
import StatusPill from "../../components/StatusPill";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import type { AppStackParamList } from "../../navigation/types";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  PAYMENT_STATUS_TONES,
} from "../../order/status";
import type { Theme } from "../../theme/tokens";
import { useTheme, useThemedStyles } from "../../theme/useTheme";
import { formatDateTimeID, formatIDR } from "../../utils/format";

type Navigation = NativeStackNavigationProp<AppStackParamList, "Orders">;

const PAGE_SIZE = 15;
const PAYMENT_FILTERS: PaymentStatus[] = ["UNPAID", "PARTIAL", "PAID"];

export default function OrdersScreen() {
  const navigation = useNavigation<Navigation>();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(
    null
  );
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

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <View style={styles.header}>
        <TextInput
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Cari nomor order, nama, atau telepon"
          placeholderTextColor={theme.colors.stone}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.searchInput}
          accessibilityLabel="Cari order"
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <FilterChip
            label="Semua status"
            selected={status === null}
            onPress={() => setStatus(null)}
          />
          {ORDER_STATUSES.map((option) => (
            <FilterChip
              key={option}
              label={ORDER_STATUS_LABELS[option]}
              selected={status === option}
              onPress={() => setStatus(option)}
            />
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <FilterChip
            label="Semua bayar"
            selected={paymentStatus === null}
            onPress={() => setPaymentStatus(null)}
          />
          {PAYMENT_FILTERS.map((option) => (
            <FilterChip
              key={option}
              label={PAYMENT_STATUS_LABELS[option]}
              selected={paymentStatus === option}
              onPress={() => setPaymentStatus(option)}
            />
          ))}
        </ScrollView>
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
                  label={ORDER_STATUS_LABELS[item.status]}
                  tone={ORDER_STATUS_TONES[item.status]}
                />
              </View>
              <Text style={styles.customer}>
                {item.customer?.name ?? "Pelanggan"}
              </Text>
              <View style={styles.rowFooter}>
                <Text style={styles.meta}>
                  {item.items_count ?? 0} item · {formatIDR(item.grand_total)}
                </Text>
                <StatusPill
                  label={PAYMENT_STATUS_LABELS[item.payment_status]}
                  tone={PAYMENT_STATUS_TONES[item.payment_status]}
                />
              </View>
              {item.created_at ? (
                <Text style={styles.date}>
                  {formatDateTimeID(item.created_at)}
                </Text>
              ) : null}
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
    </SafeAreaView>
  );
}

const createStyles = ({ colors, radius, spacing, typography }: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    header: {
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
      gap: spacing.sm,
    },
    searchInput: {
      height: 44,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.sm,
      paddingHorizontal: 20,
      ...typography.body,
      color: colors.ink,
      backgroundColor: colors.card,
      marginHorizontal: spacing.lg,
    },
    chips: {
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    loader: {
      marginTop: spacing.xxl,
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
    },
    row: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      padding: spacing.lg,
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
      color: colors.mute,
    },
    customer: {
      ...typography.subtitle,
      color: colors.ink,
    },
    rowFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    meta: {
      ...typography.body,
      color: colors.mute,
    },
    date: {
      ...typography.caption,
      color: colors.stone,
    },
    footerLoader: {
      marginVertical: spacing.md,
    },
  });
