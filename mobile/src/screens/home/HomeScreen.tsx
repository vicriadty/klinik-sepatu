import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ROLE_LABELS } from "../../api/auth";
import { fetchDashboardSummary } from "../../api/dashboard";
import {
  fetchOrders,
  PAYMENT_STATUS_LABELS,
  type ApiOrder,
} from "../../api/orders";
import { useAuthStore } from "../../auth/useAuthStore";
import AppButton from "../../components/AppButton";
import BottomNavigation from "../../components/BottomNavigation";
import EmptyState from "../../components/EmptyState";
import FullScreenLoader from "../../components/FullScreenLoader";
import LogoutButton from "../../components/LogoutButton";
import SummaryCard from "../../components/SummaryCard";
import StatusPill from "../../components/StatusPill";
import type { AppStackParamList } from "../../navigation/types";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  PAYMENT_STATUS_TONES,
} from "../../order/status";
import type { Theme } from "../../theme/tokens";
import { useTheme, useThemedStyles } from "../../theme/useTheme";
import { formatIDR } from "../../utils/format";

type Navigation = NativeStackNavigationProp<AppStackParamList, "Home">;
type HomeIconName =
  | "clipboard"
  | "loader"
  | "package"
  | "clock"
  | "plus"
  | "search"
  | "chevron";

function getInitials(name?: string) {
  const words = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  const initials = words.slice(0, 2).map((word) => word[0]).join("");

  return initials.toUpperCase() || "U";
}

function formatHomeCurrency(value: number) {
  return formatIDR(value).replace("Rp", "Rp ");
}

function HomeIcon({
  name,
  color,
  size = 22,
}: {
  name: HomeIconName;
  color: string;
  size?: number;
}) {
  const scale = size / 22;
  const px = (value: number) => value * scale;
  const stroke = Math.max(1, 1.5 * scale);
  const baseStyle = { width: size, height: size };

  if (name === "plus") {
    return (
      <View style={[iconStyles.base, baseStyle]}>
        <View
          style={[iconStyles.line, {
            top: px(10),
            left: px(2),
            width: px(18),
            height: stroke,
            backgroundColor: color,
          }]}
        />
        <View
          style={[iconStyles.line, {
            top: px(2),
            left: px(10),
            width: stroke,
            height: px(18),
            backgroundColor: color,
          }]}
        />
      </View>
    );
  }

  if (name === "search") {
    return (
      <View style={[iconStyles.base, baseStyle]}>
        <View
          style={[iconStyles.circle, {
            top: px(2),
            left: px(2),
            width: px(15),
            height: px(15),
            borderColor: color,
            borderWidth: stroke,
          }]}
        />
        <View
          style={[iconStyles.line, {
            top: px(15),
            left: px(15),
            width: px(7),
            height: stroke,
            backgroundColor: color,
            transform: [{ rotate: "45deg" }],
          }]}
        />
      </View>
    );
  }

  if (name === "chevron") {
    return (
      <View style={[iconStyles.base, baseStyle]}>
        <View
          style={[iconStyles.line, {
            top: px(7),
            left: px(5),
            width: px(9),
            height: stroke,
            backgroundColor: color,
            transform: [{ rotate: "45deg" }],
          }]}
        />
        <View
          style={[iconStyles.line, {
            top: px(13),
            left: px(5),
            width: px(9),
            height: stroke,
            backgroundColor: color,
            transform: [{ rotate: "-45deg" }],
          }]}
        />
      </View>
    );
  }

  if (name === "clock") {
    return (
      <View style={[iconStyles.base, baseStyle]}>
        <View
          style={[iconStyles.circle, {
            top: px(3),
            left: px(3),
            width: px(16),
            height: px(16),
            borderColor: color,
            borderWidth: stroke,
          }]}
        />
        <View
          style={[iconStyles.line, {
            top: px(7),
            left: px(10),
            width: stroke,
            height: px(6),
            backgroundColor: color,
          }]}
        />
        <View
          style={[iconStyles.line, {
            top: px(12),
            left: px(10),
            width: px(5),
            height: stroke,
            backgroundColor: color,
          }]}
        />
      </View>
    );
  }

  if (name === "loader") {
    return (
      <View style={[iconStyles.base, baseStyle]}>
        <View
          style={[iconStyles.circle, {
            top: px(3),
            left: px(3),
            width: px(16),
            height: px(16),
            borderColor: color,
            borderTopColor: "transparent",
            borderWidth: stroke,
            transform: [{ rotate: "35deg" }],
          }]}
        />
      </View>
    );
  }

  if (name === "package") {
    return (
      <View style={[iconStyles.base, baseStyle]}>
        <View
          style={[iconStyles.box, {
            top: px(5),
            left: px(3),
            width: px(16),
            height: px(13),
            borderColor: color,
            borderWidth: stroke,
          }]}
        />
        <View
          style={[iconStyles.line, {
            top: px(3),
            left: px(7),
            width: px(8),
            height: stroke,
            backgroundColor: color,
          }]}
        />
        <View
          style={[iconStyles.line, {
            top: px(13),
            left: px(8),
            width: px(4),
            height: stroke,
            backgroundColor: color,
            transform: [{ rotate: "45deg" }],
          }]}
        />
        <View
          style={[iconStyles.line, {
            top: px(11),
            left: px(11),
            width: px(7),
            height: stroke,
            backgroundColor: color,
            transform: [{ rotate: "-45deg" }],
          }]}
        />
      </View>
    );
  }

  return (
    <View style={[iconStyles.base, baseStyle]}>
      <View style={[iconStyles.clipboardBody, {
        top: px(3),
        left: px(4),
        width: px(14),
        height: px(17),
        borderColor: color,
        borderWidth: stroke,
        borderRadius: px(2),
      }]} />
      <View style={[iconStyles.line, {
        top: px(2),
        left: px(7),
        width: px(8),
        height: px(3),
        borderRadius: px(1),
        backgroundColor: color,
      }]} />
    </View>
  );
}

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const navigation = useNavigation<Navigation>();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: fetchDashboardSummary,
  });
  const recentOrdersQuery = useQuery({
    queryKey: ["home-recent-orders"],
    queryFn: () => fetchOrders({ page: 1, per_page: 2 }),
  });
  const recentOrders = recentOrdersQuery.data?.data ?? [];
  const roleLabel = user?.role ? ROLE_LABELS[user.role].toUpperCase() : "";
  const userName = user?.name ?? "Pengguna";
  const refresh = () => {
    void Promise.all([summaryQuery.refetch(), recentOrdersQuery.refetch()]);
  };

  if (summaryQuery.isLoading) {
    return <FullScreenLoader label="Memuat ringkasan…" />;
  }

  const summary = summaryQuery.data;

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={summaryQuery.isRefetching || recentOrdersQuery.isRefetching}
            onRefresh={refresh}
            tintColor={theme.colors.ink}
          />
        }
      >
        <View style={styles.greetingHeader}>
          <View style={styles.greetingCopy}>
            <Text style={styles.greetingEyebrow}>Selamat pagi</Text>
            <Text style={styles.greetingName}>{userName}</Text>
            {roleLabel ? <Text style={styles.role}>{roleLabel}</Text> : null}
          </View>
          <View style={styles.greetingActions}>
            <View
              accessible
              accessibilityLabel={`Profil ${userName}`}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
            </View>
            <LogoutButton />
          </View>
        </View>

        <Text style={styles.summaryHeading}>Ringkasan hari ini</Text>

        {summaryQuery.isError || !summary ? (
          <EmptyState
            title="Gagal memuat ringkasan."
            message="Tarik ke bawah atau coba lagi."
          />
        ) : (
          <View style={styles.summaryGrid}>
            <SummaryCard
              label="Pesanan hari ini"
              value={String(summary.orders_today)}
              icon={<HomeIcon name="clipboard" color={theme.colors.mute} size={18} />}
            />
            <SummaryCard
              label="Sedang diproses"
              value={String(summary.in_progress)}
              icon={<HomeIcon name="loader" color={theme.colors.mute} size={18} />}
            />
            <SummaryCard
              label="Siap diambil"
              value={String(summary.ready_for_pickup)}
              icon={<HomeIcon name="package" color={theme.colors.success} size={18} />}
              tone="success"
            />
            <SummaryCard
              label="Belum dibayar"
              value={formatHomeCurrency(summary.outstanding_payment)}
              highlight={summary.outstanding_payment > 0}
              icon={<HomeIcon name="clock" color={theme.colors.warning} size={18} />}
              tone="warning"
            />
            {summary.revenue_today !== undefined && (
              <SummaryCard
                label="Pendapatan hari ini"
                value={formatHomeCurrency(summary.revenue_today)}
              />
            )}
          </View>
        )}

        <Text style={[styles.sectionTitle, styles.actionsHeading]}>Aksi cepat</Text>
        <View style={styles.quickActions}>
          <AppButton
            title="Pesanan baru"
            onPress={() => navigation.navigate("OrderCustomer")}
            size="large"
            style={styles.quickButton}
            leftIcon={<HomeIcon name="plus" color={theme.colors.onPrimary} />}
          />
          <AppButton
            title="Cari pelanggan"
            variant="secondary"
            onPress={() => navigation.navigate("Customers")}
            size="large"
            style={styles.quickButton}
            leftIcon={<HomeIcon name="search" color={theme.colors.ink} />}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Lihat semua pesanan"
          onPress={() => navigation.navigate("Orders")}
          style={({ pressed }) => [styles.ordersAction, pressed && styles.pressed]}
        >
          <HomeIcon name="clipboard" color={theme.colors.ink} size={20} />
          <Text style={styles.ordersActionLabel}>Lihat semua pesanan</Text>
          <HomeIcon name="chevron" color={theme.colors.stone} size={18} />
        </Pressable>

        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>Pesanan terbaru</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Lihat semua pesanan"
            onPress={() => navigation.navigate("Orders")}
            hitSlop={8}
          >
            <Text style={styles.recentLink}>Lihat semua</Text>
          </Pressable>
        </View>

        {recentOrdersQuery.isLoading ? (
          <ActivityIndicator
            color={theme.colors.ink}
            size="small"
            style={styles.recentLoader}
          />
        ) : recentOrdersQuery.isError ? (
          <Text style={styles.recentState}>Gagal memuat pesanan terbaru.</Text>
        ) : recentOrders.length === 0 ? (
          <Text style={styles.recentState}>Belum ada pesanan terbaru.</Text>
        ) : (
          <View style={styles.recentList}>
            {recentOrders.map((order: ApiOrder) => {
              const orderTone =
                order.status === "READY_FOR_PICKUP"
                  ? "success"
                  : ORDER_STATUS_TONES[order.status];
              const paymentTone =
                order.payment_status === "UNPAID"
                  ? "warning"
                  : PAYMENT_STATUS_TONES[order.payment_status];
              const itemCount = order.items_count ?? order.items?.length ?? 0;

              return (
                <Pressable
                  key={order.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Order ${order.order_number}`}
                  onPress={() =>
                    navigation.navigate("OrderDetail", { orderId: order.id })
                  }
                  style={({ pressed }) => [styles.recentCard, pressed && styles.pressed]}
                >
                  <View style={styles.recentCardHeader}>
                    <Text style={styles.orderNumber}>{order.order_number}</Text>
                    <StatusPill
                      label={ORDER_STATUS_LABELS[order.status].toUpperCase()}
                      tone={orderTone}
                      appearance="outline"
                      compact
                      style={styles.recentStatus}
                    />
                  </View>
                  <View style={styles.recentCardFooter}>
                    <Text style={styles.customerSummary} numberOfLines={1}>
                      {order.customer?.name ?? "Pelanggan"} · {itemCount} sepatu
                    </Text>
                    {order.payment_status === "PAID" ? (
                      <Text style={styles.recentTotal}>
                        {formatHomeCurrency(order.grand_total)}
                      </Text>
                    ) : (
                      <StatusPill
                        label={PAYMENT_STATUS_LABELS[order.payment_status]}
                        tone={paymentTone}
                        appearance="outline"
                        compact
                        style={styles.recentStatus}
                      />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
      <BottomNavigation active="home" />
    </SafeAreaView>
  );
}

const createStyles = ({ colors, layout, radius, spacing, typography }: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      paddingHorizontal: layout.screen.gutter,
      paddingTop: layout.statusBarHeight + spacing.md,
      paddingBottom: spacing.xl,
    },
    greetingHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: spacing.xl,
    },
    greetingCopy: {
      gap: spacing.xxs,
    },
    greetingActions: {
      alignItems: "flex-end",
      gap: spacing.xxs,
    },
    greetingEyebrow: {
      ...typography.bodyUi,
      color: colors.mute,
    },
    greetingName: {
      ...typography.headingLg,
      color: colors.ink,
    },
    role: {
      ...typography.nav,
      color: colors.mute,
      letterSpacing: 0.8,
    },
    avatar: {
      width: layout.avatarSize,
      height: layout.avatarSize,
      borderRadius: radius.avatar,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
    },
    avatarText: {
      ...typography.button,
      color: colors.onPrimary,
    },
    summaryHeading: {
      ...typography.section,
      color: colors.ink,
    },
    summaryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
      marginTop: spacing.sm,
    },
    sectionTitle: {
      ...typography.section,
      color: colors.ink,
    },
    actionsHeading: {
      marginTop: spacing.xxl,
    },
    quickActions: {
      flexDirection: "row",
      gap: spacing.sm,
      padding: spacing.sm,
      marginTop: spacing.sm,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.md,
      backgroundColor: colors.card,
    },
    quickButton: {
      flex: 1,
      minHeight: 62,
      paddingHorizontal: spacing.md,
    },
    ordersAction: {
      minHeight: layout.controlHeight + spacing.xs,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.lg,
      paddingHorizontal: spacing.lg,
      marginTop: spacing.sm,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.md,
      backgroundColor: colors.card,
    },
    ordersActionLabel: {
      ...typography.button,
      flex: 1,
      color: colors.ink,
    },
    pressed: {
      opacity: 0.7,
    },
    recentHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: spacing.xl,
    },
    recentLink: {
      ...typography.button,
      color: colors.link,
    },
    recentList: {
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    recentCard: {
      minHeight: 58,
      justifyContent: "center",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.md,
      backgroundColor: colors.card,
    },
    recentCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    recentCardFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      marginTop: spacing.xxs,
    },
    orderNumber: {
      ...typography.mono,
      color: colors.ink,
    },
    customerSummary: {
      ...typography.caption,
      flex: 1,
      color: colors.mute,
    },
    recentTotal: {
      ...typography.caption,
      color: colors.ink,
    },
    recentStatus: {
      minHeight: 0,
      alignSelf: "center",
      borderWidth: 0,
      paddingHorizontal: 0,
      paddingVertical: 0,
      backgroundColor: "transparent",
    },
    recentLoader: {
      paddingVertical: spacing.lg,
    },
    recentState: {
      ...typography.bodyUi,
      paddingVertical: spacing.lg,
      color: colors.mute,
    },
  });

const iconStyles = StyleSheet.create({
  base: {
    position: "relative",
  },
  line: {
    position: "absolute",
  },
  circle: {
    position: "absolute",
    borderRadius: 99,
  },
  box: {
    position: "absolute",
    borderRadius: 2,
  },
  clipboardBody: {
    position: "absolute",
  },
});
