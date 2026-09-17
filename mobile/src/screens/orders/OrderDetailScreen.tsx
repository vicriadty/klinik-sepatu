import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import { useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  cancelOrder,
  fetchOrder,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  recordPayment,
  transitionOrder,
  type OrderStatus,
  type PaymentMethod,
} from "../../api/orders";
import { photoUrl } from "../../api/photos";
import { useAuthStore } from "../../auth/useAuthStore";
import AppButton from "../../components/AppButton";
import AppTextField from "../../components/AppTextField";
import EmptyState from "../../components/EmptyState";
import FilterChip from "../../components/FilterChip";
import FullScreenLoader from "../../components/FullScreenLoader";
import StatusPill from "../../components/StatusPill";
import type { AppStackParamList } from "../../navigation/types";
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
import { useThemedStyles } from "../../theme/useTheme";
import { apiErrorMessage } from "../../utils/errors";
import { formatDateTimeID, formatIDR } from "../../utils/format";

type Navigation = NativeStackNavigationProp<AppStackParamList, "OrderDetail">;
type Route = RouteProp<AppStackParamList, "OrderDetail">;

export default function OrderDetailScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
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
    await queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    await queryClient.invalidateQueries({ queryKey: ["orders"] });
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
    mutationFn: (payload: { method: PaymentMethod; amount: number }) =>
      recordPayment(
        orderId,
        { type: "refund", method: payload.method, amount: payload.amount },
        Crypto.randomUUID()
      ),
    onSuccess: async (payment) => {
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

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.orderNumber}>{order.order_number}</Text>
        <View style={styles.pills}>
          <StatusPill
            label={ORDER_STATUS_LABELS[order.status]}
            tone={ORDER_STATUS_TONES[order.status]}
          />
          <StatusPill
            label={PAYMENT_STATUS_LABELS[order.payment_status]}
            tone={PAYMENT_STATUS_TONES[order.payment_status]}
          />
        </View>
        {order.created_at ? (
          <Text style={styles.date}>{formatDateTimeID(order.created_at)}</Text>
        ) : null}

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

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pelanggan</Text>
          <Text style={styles.customerName}>
            {order.customer?.name ?? "Pelanggan"}
          </Text>
          {order.customer ? (
            <Text style={styles.customerPhone}>
              {order.customer.phone_display}
            </Text>
          ) : null}
        </View>

        {(order.items ?? []).map((item, index) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.itemHeader}>
              <Text style={styles.cardTitle}>
                #{index + 1} {item.brand}
                {item.model ? ` ${item.model}` : ""}
              </Text>
              <Text style={styles.itemSubtotal}>
                {formatIDR(item.item_subtotal ?? 0)}
              </Text>
            </View>
            <Text style={styles.itemMeta}>
              {item.shoe_type}
              {item.color ? ` · ${item.color}` : ""}
            </Text>
            {item.customer_note ? (
              <Text style={styles.itemNote}>{item.customer_note}</Text>
            ) : null}
            {(item.services ?? []).map((service) => (
              <View key={service.service_id} style={styles.serviceRow}>
                <Text style={styles.serviceName}>{service.service_name}</Text>
                <Text style={styles.servicePrice}>
                  {formatIDR(service.unit_price)}
                </Text>
              </View>
            ))}
            {item.photos && item.photos.length > 0 ? (
              <View style={styles.photos}>
                {item.photos.map((photo) => {
                  const uri = photoUrl(photo.thumbnail_url ?? photo.url);
                  if (!uri) return null;
                  return (
                    <Image
                      key={photo.id}
                      source={{ uri }}
                      style={styles.photo}
                      accessibilityLabel={`Foto ${photo.type}`}
                    />
                  );
                })}
              </View>
            ) : null}
          </View>
        ))}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ringkasan biaya</Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatIDR(order.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Diskon</Text>
            <Text style={styles.totalValue}>
              {order.discount_value > 0
                ? `-${formatIDR(order.discount_value)}`
                : formatIDR(0)}
            </Text>
          </View>
          <View style={[styles.totalRow, styles.grandRow]}>
            <Text style={styles.grandLabel}>Grand total</Text>
            <Text style={styles.grandValue}>
              {formatIDR(order.grand_total)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Dibayar</Text>
            <Text style={styles.totalValue}>{formatIDR(order.paid_total)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sisa</Text>
            <Text style={styles.totalValue}>
              {formatIDR(order.remaining_balance)}
            </Text>
          </View>
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

        {(order.status_histories ?? []).length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Riwayat status</Text>
            {(order.status_histories ?? []).map((history, index) => (
              <View key={`${history.to_status}-${index}`} style={styles.historyRow}>
                <Text style={styles.historyText}>
                  {history.from_status
                    ? `${ORDER_STATUS_LABELS[history.from_status]} → ${ORDER_STATUS_LABELS[history.to_status]}`
                    : ORDER_STATUS_LABELS[history.to_status]}
                </Text>
                {history.created_at ? (
                  <Text style={styles.paymentMeta}>
                    {formatDateTimeID(history.created_at)}
                  </Text>
                ) : null}
                {history.note ? (
                  <Text style={styles.paymentMeta}>{history.note}</Text>
                ) : null}
              </View>
            ))}
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
                title={transition.label}
                variant={
                  transition.status === "CANCELLED" ? "danger" : "primary"
                }
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
          <AppButton
            title="Catat Pembayaran"
            variant="secondary"
            onPress={() => navigation.navigate("OrderPayment", { orderId })}
          />
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

const createStyles = ({ colors, radius, spacing, typography }: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    content: {
      padding: spacing.xl,
      gap: spacing.xs,
      paddingBottom: spacing.xxxl,
    },
    emptyAction: {
      padding: spacing.xl,
      gap: spacing.md,
    },
    orderNumber: {
      ...typography.mono,
      color: colors.mute,
    },
    pills: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    date: {
      ...typography.caption,
      color: colors.stone,
    },
    successNotice: {
      marginTop: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.bone,
      borderLeftWidth: 3,
      borderLeftColor: colors.success,
      padding: spacing.lg,
    },
    errorNotice: {
      marginTop: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.bone,
      borderLeftWidth: 3,
      borderLeftColor: colors.danger,
      padding: spacing.lg,
    },
    noticeText: {
      ...typography.body,
      color: colors.ink,
    },
    card: {
      marginTop: spacing.lg,
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
    customerName: {
      ...typography.body,
      color: colors.ink,
    },
    customerPhone: {
      ...typography.body,
      color: colors.mute,
    },
    itemHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    itemSubtotal: {
      ...typography.subtitle,
      color: colors.ink,
    },
    itemMeta: {
      ...typography.caption,
      color: colors.mute,
    },
    itemNote: {
      ...typography.caption,
      color: colors.body,
    },
    serviceRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    serviceName: {
      ...typography.body,
      color: colors.body,
      flexShrink: 1,
    },
    servicePrice: {
      ...typography.body,
      color: colors.body,
    },
    photos: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginTop: spacing.xs,
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
    photo: {
      width: 64,
      height: 64,
      borderRadius: radius.sm,
      backgroundColor: colors.bone,
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
      paddingTop: spacing.sm,
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
    historyRow: {
      gap: spacing.xxs,
    },
    historyText: {
      ...typography.body,
      color: colors.ink,
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
