import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  cancelOrder,
  fetchOrder,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  recordPayment,
  transitionOrder,
  type ApiOrder,
  type ApiOrderItem,
  type OrderStatus,
  type PaymentMethod,
} from "../../api/orders";
import { photoUrl, type ApiPhoto } from "../../api/photos";
import { useAuthStore } from "../../auth/useAuthStore";
import AppButton from "../../components/AppButton";
import AppTextField from "../../components/AppTextField";
import EmptyState from "../../components/EmptyState";
import FilterChip from "../../components/FilterChip";
import FullScreenLoader from "../../components/FullScreenLoader";
import StatusPill from "../../components/StatusPill";
import type { AppStackParamList } from "../../navigation/types";
import {
  clearPaymentIdempotencyKey,
  getPaymentIdempotencyKey,
} from "../../order/paymentIdempotency";
import { uploadQueuedPhotos } from "../../order/photoUpload";
import { UPLOAD_STATUS_LABELS, usePhotoStore } from "../../order/photoStore";
import {
  blockedTransitionHint,
  legalTransitions,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  PAYMENT_STATUS_TONES,
} from "../../order/status";
import type { Theme } from "../../theme/tokens";
import { useTheme, useThemedStyles } from "../../theme/useTheme";
import { apiErrorMessage } from "../../utils/errors";
import { formatDateTimeID, formatIDR } from "../../utils/format";

type Navigation = NativeStackNavigationProp<AppStackParamList, "OrderDetail">;
type Route = RouteProp<AppStackParamList, "OrderDetail">;

type DetailIconName = "arrow-left" | "person" | "image" | "check";

type TimelineStep = {
  status: OrderStatus;
  created_at: string | null;
  note: string | null;
  completed: boolean;
};

const PENDING_STATUS_LABELS: Record<OrderStatus, string> = {
  RECEIVED: "Belum diterima",
  ON_PROCESS: "Belum diproses",
  READY_FOR_PICKUP: "Belum siap diambil",
  COMPLETED: "Belum selesai",
  CANCELLED: "Dibatalkan",
};

function formatDetailCurrency(value: number): string {
  return formatIDR(value).replace("Rp", "Rp ");
}

function formatTimelineDate(value: string): string {
  return formatDateTimeID(value).replace(/(\d{4}) /, "$1 · ");
}

function itemServiceSummary(item: ApiOrderItem): string {
  const services = (item.services ?? []).map((service) => service.service_name);
  if (services.length > 0) return services.join(" + ");

  return [item.shoe_type, item.color].filter(Boolean).join(" · ");
}

function itemTotal(item: ApiOrderItem): number {
  if (item.item_subtotal !== undefined) return item.item_subtotal;
  return (item.services ?? []).reduce((total, service) => total + service.unit_price, 0);
}

function timelineSteps(order: ApiOrder): TimelineStep[] {
  const history = (order.status_histories ?? []).map((entry) => ({
    status: entry.to_status,
    created_at: entry.created_at,
    note: entry.note,
    completed: true,
  }));

  if (!history.some((entry) => entry.status === order.status)) {
    history.push({
      status: order.status,
      created_at: order.created_at,
      note: null,
      completed: true,
    });
  }

  const nextStatus = legalTransitions(order)[0]?.status;
  if (nextStatus && !history.some((entry) => entry.status === nextStatus)) {
    history.push({
      status: nextStatus,
      created_at: null,
      note: null,
      completed: false,
    });
  }

  return history;
}

function DetailIcon({
  name,
  color,
  size = 24,
}: {
  name: DetailIconName;
  color: string;
  size?: number;
}) {
  if (name === "arrow-left") {
    return (
      <View pointerEvents="none" style={[iconStyles.base, { width: size, height: size }]}>
        <View style={[iconStyles.line, { top: size / 2, left: 3, width: size - 6, backgroundColor: color }]} />
        <View style={[iconStyles.line, { top: size / 2 - 1, left: 3, width: 10, backgroundColor: color, transform: [{ rotate: "-45deg" }] }]} />
        <View style={[iconStyles.line, { top: size / 2 + 6, left: 3, width: 10, backgroundColor: color, transform: [{ rotate: "45deg" }] }]} />
      </View>
    );
  }

  if (name === "person") {
    return (
      <View pointerEvents="none" style={[iconStyles.base, { width: size, height: size }]}>
        <View style={[iconStyles.personHead, { borderColor: color, width: size * 0.32, height: size * 0.32, left: size * 0.34 }]} />
        <View style={[iconStyles.personBody, { borderColor: color, width: size * 0.7, height: size * 0.38, left: size * 0.15 }]} />
      </View>
    );
  }

  if (name === "image") {
    return (
      <View pointerEvents="none" style={[iconStyles.base, { width: size, height: size }]}>
        <View style={[iconStyles.imageFrame, { borderColor: color, width: size - 4, height: size - 4, left: 2, top: 2 }]} />
        <View style={[iconStyles.imageMountain, { borderColor: color, left: 5, bottom: 5, width: size * 0.45, transform: [{ rotate: "-45deg" }] }]} />
        <View style={[iconStyles.imageMountain, { borderColor: color, right: 4, bottom: 4, width: size * 0.36, transform: [{ rotate: "45deg" }] }]} />
      </View>
    );
  }

  return (
    <View pointerEvents="none" style={[iconStyles.base, { width: size, height: size }]}>
      <View style={[iconStyles.line, { top: size * 0.58, left: size * 0.2, width: size * 0.3, backgroundColor: color, transform: [{ rotate: "45deg" }] }]} />
      <View style={[iconStyles.line, { top: size * 0.48, left: size * 0.42, width: size * 0.48, backgroundColor: color, transform: [{ rotate: "-45deg" }] }]} />
    </View>
  );
}

export default function OrderDetailScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const orderId = route.params.orderId;

  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>("CASH");
  const [refundAmount, setRefundAmount] = useState<string | null>(null);

  const orderQuery = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => fetchOrder(orderId),
  });
  const order = orderQuery.data;
  const photoQueue = usePhotoStore((state) => state.queue);

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["order", orderId] }),
      queryClient.invalidateQueries({ queryKey: ["orders"] }),
      queryClient.invalidateQueries({ queryKey: ["home-recent-orders"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
    ]);
  };

  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) => transitionOrder(orderId, status),
    onSuccess: async (updated) => {
      setError(null);
      setFeedback(`Status diperbarui: ${ORDER_STATUS_LABELS[updated.status]}.`);
      await invalidate();
    },
    onError: (mutationError: unknown) => {
      setFeedback(null);
      setError(apiErrorMessage(mutationError, "Gagal mengubah status."));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(orderId),
    onSuccess: async () => {
      setError(null);
      setFeedback("Order dibatalkan.");
      await invalidate();
    },
    onError: (mutationError: unknown) => {
      setFeedback(null);
      setError(apiErrorMessage(mutationError, "Gagal membatalkan order."));
    },
  });

  const refundMutation = useMutation({
    mutationFn: async (payload: { method: PaymentMethod; amount: number }) => {
      const requestPayload = {
        type: "refund" as const,
        method: payload.method,
        amount: payload.amount,
      };
      const idempotencyKey = await getPaymentIdempotencyKey(
        orderId,
        "refund",
        JSON.stringify(requestPayload)
      );

      return recordPayment(orderId, requestPayload, idempotencyKey);
    },
    onSuccess: async (payment) => {
      await clearPaymentIdempotencyKey(orderId, "refund");
      setError(null);
      setFeedback(`Refund ${formatIDR(payment.amount)} tercatat.`);
      setRefundAmount(null);
      await invalidate();
    },
    onError: (mutationError: unknown) => {
      setFeedback(null);
      setError(apiErrorMessage(mutationError, "Gagal mencatat refund."));
    },
  });

  const confirmCancel = () => {
    Alert.alert(
      "Batalkan order?",
      "Order yang dibatalkan tidak bisa dikembalikan.",
      [
        { text: "Tidak", style: "cancel" },
        {
          text: "Ya, batalkan",
          style: "destructive",
          onPress: () => cancelMutation.mutate(),
        },
      ]
    );
  };

  const runTransition = (status: OrderStatus) => {
    if (status === "CANCELLED") {
      confirmCancel();
      return;
    }

    if (status === "COMPLETED") {
      Alert.alert("Selesaikan order?", "Order akan ditandai selesai.", [
        { text: "Batal", style: "cancel" },
        {
          text: "Ya, selesaikan",
          onPress: () => statusMutation.mutate(status),
        },
      ]);
      return;
    }

    statusMutation.mutate(status);
  };

  if (orderQuery.isLoading) {
    return <FullScreenLoader label="Memuat order…" />;
  }

  if (orderQuery.isError || !order) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <EmptyState
          title="Gagal memuat order."
          message="Periksa koneksi lalu coba lagi."
        />
        <View style={styles.emptyAction}>
          <AppButton
            title="Coba Lagi"
            variant="secondary"
            onPress={() => orderQuery.refetch()}
          />
          <AppButton title="Kembali" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const transitions = legalTransitions(order);
  const hint = blockedTransitionHint(order);
  const orderItemIds = (order.items ?? []).map((item) => item.id);
  const items = order.items ?? [];
  const beforePhotos = items.flatMap((item) =>
    (item.photos ?? []).filter((photo) => photo.type === "BEFORE")
  );
  const otherPhotos = items.flatMap((item) =>
    (item.photos ?? []).filter((photo) => photo.type !== "BEFORE")
  );
  const steps = timelineSteps(order);
  const pendingUploads = photoQueue.filter(
    (entry) =>
      orderItemIds.includes(entry.orderItemId) && entry.status !== "uploaded"
  );

  const retryUploads = async () => {
    await uploadQueuedPhotos({ onlyItemIds: orderItemIds });
    await invalidate();
  };

  const canRefund =
    (user?.role === "owner" || user?.role === "admin") &&
    order.paid_total > 0 &&
    order.status !== "CANCELLED";
  const refundValue = refundAmount ?? String(order.paid_total);
  const refundParsed = Number(refundValue);
  const refundError =
    refundValue.trim() === ""
      ? null
      : !Number.isInteger(refundParsed) || refundParsed < 1
        ? "Jumlah tidak valid."
        : refundParsed > order.paid_total
          ? "Melebihi total dibayar."
          : null;

  const submitRefund = () => {
    if (refundMutation.isPending) return;
    if (refundValue.trim() === "" || refundError !== null) {
      setError(refundError ?? "Jumlah tidak valid.");
      return;
    }
    setError(null);
    refundMutation.mutate({ method: refundMethod, amount: refundParsed });
  };

  const renderPhotoTile = (photo: ApiPhoto) => {
    const uri = photoUrl(photo.thumbnail_url ?? photo.url);
    return uri ? (
      <Image
        key={photo.id}
        source={{ uri }}
        style={styles.photoTile}
        accessibilityLabel={`Foto ${photo.type}`}
      />
    ) : (
      <View key={photo.id} style={styles.photoTile}>
        <DetailIcon name="image" color={theme.colors.mute} size={24} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kembali"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <DetailIcon name="arrow-left" color={theme.colors.ink} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Detail pesanan</Text>
            <Text style={styles.subtitle}>{order.order_number}</Text>
          </View>
        </View>

        <View style={styles.pills}>
          <StatusPill
            label={ORDER_STATUS_LABELS[order.status].toUpperCase()}
            tone={ORDER_STATUS_TONES[order.status]}
          />
          <StatusPill
            label={PAYMENT_STATUS_LABELS[order.payment_status].toUpperCase()}
            tone={PAYMENT_STATUS_TONES[order.payment_status]}
          />
        </View>

        {feedback ? (
          <View style={styles.successNotice}>
            <Text style={styles.noticeText}>{feedback}</Text>
          </View>
        ) : null}
        {error ? (
          <View style={styles.errorNotice}>
            <Text style={styles.noticeText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.customerCard}>
          <DetailIcon name="person" color={theme.colors.mute} size={34} />
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>
              {order.customer?.name ?? "Pelanggan"}
            </Text>
            {order.customer ? (
              <Text style={styles.customerPhone}>
                {order.customer.phone_display}
              </Text>
            ) : null}
          </View>
          {order.customer ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Lihat pelanggan"
              onPress={() =>
                navigation.navigate("Customers", {
                  search: order.customer?.phone ?? "",
                })
              }
            >
              <Text style={styles.customerAction}>Lihat pelanggan</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>
          ITEM SEPATU <Text style={styles.sectionCount}>· {items.length}</Text>
        </Text>

        <View style={styles.itemList}>
          {items.map((item, index) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>
                {item.brand}
                {item.model ? ` ${item.model}` : ""}
              </Text>
              <Text style={styles.itemSubtotal}>
                {formatDetailCurrency(itemTotal(item))}
              </Text>
            </View>
            <Text style={styles.itemMeta}>{itemServiceSummary(item)}</Text>
            {item.customer_note ? (
              <Text style={styles.itemNote}>{item.customer_note}</Text>
            ) : null}
          </View>
          ))}
        </View>

        {beforePhotos.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>FOTO BEFORE</Text>
            <View style={styles.photoCard}>
              <View style={styles.photoTiles}>
                {beforePhotos.map(renderPhotoTile)}
              </View>
              <Text style={styles.photoCount}>{beforePhotos.length} foto BEFORE</Text>
            </View>
          </View>
        ) : null}

        {otherPhotos.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>FOTO LAINNYA</Text>
            <View style={styles.photoCard}>
              <View style={styles.photoTiles}>{otherPhotos.map(renderPhotoTile)}</View>
              <Text style={styles.photoCount}>{otherPhotos.length} foto</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.summaryCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatDetailCurrency(order.subtotal)}</Text>
          </View>
          {order.discount_value > 0 ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Diskon</Text>
              <Text style={styles.totalValue}>
                -{formatDetailCurrency(order.discount_value)}
              </Text>
            </View>
          ) : null}
          <View style={[styles.totalRow, styles.grandRow]}>
            <Text style={styles.grandLabel}>Total</Text>
            <Text style={styles.grandValue}>
              {formatDetailCurrency(order.grand_total)}
            </Text>
          </View>
          {order.payment_status !== "UNPAID" ? (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Dibayar</Text>
                <Text style={styles.totalValue}>{formatDetailCurrency(order.paid_total)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Sisa</Text>
                <Text style={styles.totalValue}>{formatDetailCurrency(order.remaining_balance)}</Text>
              </View>
            </>
          ) : null}
        </View>

        {(order.payments ?? []).length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Pembayaran</Text>
            {(order.payments ?? []).map((payment) => (
              <View key={payment.id} style={styles.paymentRow}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentMethod}>
                    {payment.type === "refund"
                      ? `Refund · ${PAYMENT_METHOD_LABELS[payment.method]}`
                      : PAYMENT_METHOD_LABELS[payment.method]}
                  </Text>
                  {payment.created_at ? (
                    <Text style={styles.paymentMeta}>
                      {formatDateTimeID(payment.created_at)}
                      {payment.receiver ? ` · ${payment.receiver.name}` : ""}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.paymentAmount}>
                  {payment.type === "refund" ? "-" : ""}
                  {formatIDR(payment.amount)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {steps.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>RIWAYAT STATUS</Text>
            <View style={styles.timeline}>
              {steps.map((step, index) => (
                <View key={`${step.status}-${index}`} style={styles.timelineRow}>
                  <View style={styles.timelineMarker}>
                    <View
                      style={[
                        styles.timelineDot,
                        step.completed
                          ? styles.timelineDotComplete
                          : styles.timelineDotPending,
                      ]}
                    >
                      {step.completed ? (
                        <DetailIcon
                          name="check"
                          color={theme.colors.success}
                          size={16}
                        />
                      ) : null}
                    </View>
                    {index < steps.length - 1 ? <View style={styles.timelineLine} /> : null}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text
                      style={[
                        styles.timelineTitle,
                        !step.completed && styles.timelinePending,
                      ]}
                    >
                      {step.completed
                        ? ORDER_STATUS_LABELS[step.status]
                        : PENDING_STATUS_LABELS[step.status]}
                    </Text>
                    {step.created_at ? (
                      <Text style={styles.timelineMeta}>
                        {formatTimelineDate(step.created_at)}
                      </Text>
                    ) : null}
                    {step.note ? (
                      <Text style={styles.timelineMeta}>{step.note}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {pendingUploads.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Foto belum terunggah ({pendingUploads.length})
            </Text>
            {pendingUploads.map((entry) => (
              <View key={entry.id} style={styles.uploadRow}>
                <Image source={{ uri: entry.uri }} style={styles.uploadPhoto} />
                <View style={styles.uploadInfo}>
                  <Text style={styles.paymentMethod}>
                    {entry.type === "DAMAGE" ? "Kerusakan" : "Before"}
                  </Text>
                  <Text
                    style={[
                      styles.paymentMeta,
                      entry.status === "failed" && styles.uploadError,
                    ]}
                  >
                    {entry.error ?? UPLOAD_STATUS_LABELS[entry.status]}
                  </Text>
                </View>
              </View>
            ))}
            <AppButton
              title="Unggah Sekarang"
              variant="secondary"
              onPress={() => void retryUploads()}
            />
          </View>
        ) : null}

        {transitions.length > 0 ? (
          <View style={styles.actions}>
            {transitions.map((transition) => (
              <AppButton
                key={transition.status}
                title={
                  transition.status === "ON_PROCESS"
                    ? "Mulai diproses"
                    : transition.label
                }
                variant={
                  transition.status === "CANCELLED" ? "danger" : "primary"
                }
                fullWidth
                size="large"
                loading={
                  statusMutation.isPending &&
                  statusMutation.variables === transition.status
                }
                onPress={() => runTransition(transition.status)}
              />
            ))}
          </View>
        ) : null}

        {hint ? <Text style={styles.hint}>{hint}</Text> : null}

        {order.remaining_balance > 0 && order.status !== "CANCELLED" ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Catat Pembayaran"
            onPress={() => navigation.navigate("OrderPayment", { orderId })}
            style={styles.paymentLink}
          >
            <Text style={styles.paymentHint}>
              Pembayaran dapat dicatat dari halaman ini kapan saja.
            </Text>
          </Pressable>
        ) : null}

        {canRefund ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Refund</Text>
            <Text style={styles.refundHint}>
              Kembalikan pembayaran sebelum membatalkan order berbayar.
            </Text>
            <View style={styles.methods}>
              {PAYMENT_METHODS.map((option) => (
                <FilterChip
                  key={option}
                  label={PAYMENT_METHOD_LABELS[option]}
                  selected={refundMethod === option}
                  onPress={() => setRefundMethod(option)}
                />
              ))}
            </View>
            <AppTextField
              label="Jumlah refund"
              placeholder="0"
              keyboardType="number-pad"
              value={refundValue}
              onChangeText={setRefundAmount}
              error={refundError ?? undefined}
            />
            <AppButton
              title="Catat Refund"
              variant="danger"
              loading={refundMutation.isPending}
              onPress={submitRefund}
            />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = ({ colors, layout, radius, spacing, typography }: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    content: {
      paddingHorizontal: layout.screen.gutter,
      paddingTop: layout.statusBarHeight,
      paddingBottom: spacing.xxxl,
      gap: spacing.xs,
    },
    emptyAction: {
      padding: spacing.xl,
      gap: spacing.md,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.lg,
      marginBottom: spacing.lg,
    },
    backButton: {
      width: layout.minTouchTarget,
      height: layout.minTouchTarget,
      alignItems: "center",
      justifyContent: "center",
    },
    headerCopy: {
      flex: 1,
      gap: spacing.xxs,
    },
    title: {
      ...typography.headingSm,
      color: colors.ink,
    },
    subtitle: {
      ...typography.body,
      color: colors.mute,
    },
    pills: {
      flexDirection: "row",
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    successNotice: {
      marginBottom: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.bone,
      borderLeftWidth: 1,
      borderLeftColor: colors.success,
      padding: spacing.lg,
    },
    errorNotice: {
      marginBottom: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.bone,
      borderLeftWidth: 1,
      borderLeftColor: colors.danger,
      padding: spacing.lg,
    },
    noticeText: {
      ...typography.body,
      color: colors.ink,
    },
    customerCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.lg,
      minHeight: 64,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      padding: spacing.lg,
    },
    customerInfo: {
      flex: 1,
      gap: spacing.xxs,
    },
    customerName: {
      ...typography.title,
      color: colors.ink,
    },
    customerPhone: {
      ...typography.body,
      color: colors.mute,
    },
    customerAction: {
      ...typography.subtitle,
      color: colors.link,
      flexShrink: 1,
      textAlign: "right",
    },
    sectionTitle: {
      ...typography.section,
      color: colors.ink,
      marginTop: spacing.xl,
      marginBottom: spacing.sm,
      textTransform: "uppercase",
    },
    sectionCount: {
      color: colors.ink,
    },
    itemList: {
      gap: spacing.sm,
    },
    itemCard: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: spacing.xs,
    },
    itemHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    itemTitle: {
      ...typography.title,
      color: colors.ink,
      flex: 1,
    },
    itemSubtotal: {
      ...typography.subtitle,
      color: colors.ink,
    },
    itemMeta: {
      ...typography.body,
      color: colors.mute,
    },
    itemNote: {
      ...typography.caption,
      color: colors.body,
    },
    photoCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      minHeight: 54,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    photoTiles: {
      flex: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    photoTile: {
      width: layout.photoTile.compactWidth,
      height: layout.photoTile.compactHeight,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.sm,
      backgroundColor: colors.mutedSurface,
    },
    photoCount: {
      ...typography.body,
      color: colors.mute,
      flexShrink: 0,
    },
    summaryCard: {
      marginTop: spacing.xl,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      padding: spacing.lg,
      gap: spacing.md,
    },
    card: {
      marginTop: spacing.xl,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    cardTitle: {
      ...typography.subtitle,
      color: colors.ink,
      flexShrink: 1,
    },
    totalRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    totalLabel: {
      ...typography.body,
      color: colors.mute,
    },
    totalValue: {
      ...typography.body,
      color: colors.ink,
    },
    grandRow: {
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      paddingTop: spacing.md,
    },
    grandLabel: {
      ...typography.subtitle,
      color: colors.ink,
    },
    grandValue: {
      ...typography.title,
      color: colors.ink,
    },
    paymentRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    paymentInfo: {
      flexShrink: 1,
      gap: spacing.xxs,
    },
    paymentMethod: {
      ...typography.body,
      color: colors.ink,
    },
    paymentMeta: {
      ...typography.caption,
      color: colors.mute,
    },
    paymentAmount: {
      ...typography.subtitle,
      color: colors.ink,
    },
    timeline: {
      gap: spacing.xs,
    },
    timelineRow: {
      flexDirection: "row",
      alignItems: "stretch",
      minHeight: 56,
    },
    timelineMarker: {
      width: 24,
      alignItems: "center",
      alignSelf: "stretch",
    },
    timelineDot: {
      width: 20,
      height: 20,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.full,
      borderWidth: 2,
    },
    timelineDotComplete: {
      borderColor: colors.success,
      backgroundColor: colors.card,
    },
    timelineDotPending: {
      borderColor: colors.divider,
      backgroundColor: colors.card,
    },
    timelineLine: {
      flex: 1,
      width: 1,
      marginTop: spacing.xs,
      backgroundColor: colors.divider,
    },
    timelineContent: {
      flex: 1,
      paddingLeft: spacing.lg,
      paddingBottom: spacing.lg,
      gap: spacing.xxs,
    },
    timelineTitle: {
      ...typography.body,
      color: colors.ink,
    },
    timelinePending: {
      color: colors.mute,
    },
    timelineMeta: {
      ...typography.body,
      color: colors.mute,
    },
    uploadRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    uploadPhoto: {
      width: 44,
      height: 44,
      borderRadius: radius.sm,
      backgroundColor: colors.bone,
    },
    uploadInfo: {
      flex: 1,
      gap: spacing.xxs,
    },
    uploadError: {
      color: colors.danger,
    },
    actions: {
      marginTop: spacing.xl,
      gap: spacing.md,
    },
    hint: {
      ...typography.caption,
      color: colors.warning,
      marginTop: spacing.md,
    },
    paymentLink: {
      minHeight: layout.minTouchTarget,
      alignItems: "center",
      justifyContent: "center",
      marginTop: spacing.sm,
    },
    paymentHint: {
      ...typography.body,
      color: colors.mute,
      textAlign: "center",
    },
    refundHint: {
      ...typography.caption,
      color: colors.mute,
    },
    methods: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
  });

const iconStyles = StyleSheet.create({
  base: {
    position: "relative",
  },
  line: {
    position: "absolute",
    height: 2,
    borderRadius: 2,
  },
  personHead: {
    position: "absolute",
    top: 1,
    borderWidth: 2,
    borderRadius: 99,
  },
  personBody: {
    position: "absolute",
    bottom: 1,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderTopLeftRadius: 99,
    borderTopRightRadius: 99,
  },
  imageFrame: {
    position: "absolute",
    borderWidth: 2,
    borderRadius: 3,
  },
  imageMountain: {
    position: "absolute",
    height: 2,
    borderTopWidth: 2,
  },
});
