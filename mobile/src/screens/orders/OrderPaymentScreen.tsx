import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import { useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  fetchOrder,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  recordPayment,
  type PaymentMethod,
} from "../../api/orders";
import AppButton from "../../components/AppButton";
import AppTextField from "../../components/AppTextField";
import EmptyState from "../../components/EmptyState";
import FullScreenLoader from "../../components/FullScreenLoader";
import type { AppStackParamList } from "../../navigation/types";
import type { Theme } from "../../theme/tokens";
import { useThemedStyles } from "../../theme/useTheme";
import { apiErrorMessage } from "../../utils/errors";
import { formatIDR } from "../../utils/format";

type Navigation = NativeStackNavigationProp<AppStackParamList, "OrderPayment">;
type Route = RouteProp<AppStackParamList, "OrderPayment">;

export default function OrderPaymentScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const styles = useThemedStyles(createStyles);
  const queryClient = useQueryClient();
  const orderId = route.params.orderId;

  const orderQuery = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => fetchOrder(orderId),
  });

  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [amountText, setAmountText] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const idempotencyKey = useRef<string | null>(null);

  const order = orderQuery.data;
  const remaining = order?.remaining_balance ?? 0;
  const amountValue = amountText ?? String(remaining);
  const amount = Number(amountValue);
  const amountError =
    amountValue.trim() === ""
      ? null
      : !Number.isInteger(amount) || amount < 1
        ? "Jumlah tidak valid."
        : amount > remaining
          ? "Jumlah melebihi sisa tagihan."
          : null;
  const amountIsValid = amountError === null && amountValue.trim() !== "";

  const paymentMutation = useMutation({
    mutationFn: () => {
      if (!order) {
        throw new Error("missing order");
      }
      idempotencyKey.current = idempotencyKey.current ?? Crypto.randomUUID();

      return recordPayment(
        order.id,
        {
          method,
          amount,
          ...(note.trim() !== "" ? { note: note.trim() } : {}),
        },
        idempotencyKey.current
      );
    },
    onSuccess: async (payment) => {
      idempotencyKey.current = null;
      setAmountText(null);
      setNote("");
      setFormError(null);
      setSuccessMessage(`Pembayaran ${formatIDR(payment.amount)} tercatat.`);
      await queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    },
    onError: (error: unknown) => {
      setSuccessMessage(null);
      setFormError(apiErrorMessage(error, "Gagal mencatat pembayaran."));
    },
  });

  const submit = () => {
    if (paymentMutation.isPending) return;
    if (!amountIsValid) {
      if (!amountError) {
        setFormError("Jumlah tidak valid.");
      }
      return;
    }
    setFormError(null);
    paymentMutation.mutate();
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

  const payments = order.payments ?? [];
  const isPaid = order.payment_status === "PAID";
  const isCancelled = order.status === "CANCELLED";

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.orderNumber}>{order.order_number}</Text>
        <Text style={styles.customer}>
          {order.customer?.name ?? "Pelanggan"}
        </Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Grand total</Text>
            <Text style={styles.rowValue}>{formatIDR(order.grand_total)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Sudah dibayar</Text>
            <Text style={styles.rowValue}>{formatIDR(order.paid_total)}</Text>
          </View>
          <View style={[styles.row, styles.rowDivider]}>
            <Text style={styles.rowStrongLabel}>Sisa</Text>
            <Text
              style={[
                styles.rowStrongValue,
                order.remaining_balance > 0 && styles.remaining,
              ]}
            >
              {formatIDR(order.remaining_balance)}
            </Text>
          </View>
          <Text style={styles.status}>
            Status: {PAYMENT_STATUS_LABELS[order.payment_status]}
          </Text>
        </View>

        {successMessage ? (
          <View style={styles.successNotice}>
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}

        {isCancelled ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              Order dibatalkan — pembayaran tidak dapat dicatat.
            </Text>
          </View>
        ) : isPaid ? (
          <View style={styles.paidCard}>
            <Text style={styles.paidTitle}>Order lunas</Text>
            <Text style={styles.paidBody}>
              Seluruh tagihan sudah dibayar. Terima kasih.
            </Text>
            <AppButton
              title="Selesai"
              onPress={() => navigation.navigate("Home")}
            />
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Metode pembayaran</Text>
            <View style={styles.methods}>
              {PAYMENT_METHODS.map((option) => {
                const selected = option === method;

                return (
                  <Pressable
                    key={option}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Metode ${PAYMENT_METHOD_LABELS[option]}`}
                    onPress={() => setMethod(option)}
                    style={[
                      styles.method,
                      selected && styles.methodSelected,
                    ]}
                  >
                    <Text style={styles.methodLabel}>
                      {PAYMENT_METHOD_LABELS[option]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {method === "QRIS" ? (
              <View style={styles.notice}>
                <Text style={styles.noticeText}>
                  Tampilkan QRIS statis toko, minta pelanggan scan, pastikan
                  pembayaran masuk, lalu catat di sini.
                </Text>
              </View>
            ) : null}

            <AppTextField
              label="Jumlah"
              placeholder="0"
              keyboardType="number-pad"
              value={amountValue}
              onChangeText={setAmountText}
              error={amountError ?? undefined}
            />
            <AppButton
              title="Uang pas"
              variant="ghost"
              onPress={() => setAmountText(String(remaining))}
            />

            <AppTextField
              label="Catatan (opsional)"
              placeholder="cth: Diterima kasir pagi"
              value={note}
              onChangeText={setNote}
            />

            {formError ? (
              <Text style={styles.formError}>{formError}</Text>
            ) : null}

            <AppButton
              title="Catat Pembayaran"
              onPress={submit}
              loading={paymentMutation.isPending}
            />
          </>
        )}

        {payments.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Riwayat pembayaran</Text>
            {payments.map((payment) => (
              <View key={payment.id} style={styles.paymentRow}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentMethod}>
                    {payment.type === "refund"
                      ? `Refund · ${PAYMENT_METHOD_LABELS[payment.method]}`
                      : PAYMENT_METHOD_LABELS[payment.method]}
                  </Text>
                  {payment.note ? (
                    <Text style={styles.paymentNote}>{payment.note}</Text>
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
    },
    emptyAction: {
      padding: spacing.xl,
      gap: spacing.md,
    },
    orderNumber: {
      ...typography.mono,
      color: colors.mute,
    },
    customer: {
      ...typography.headingSm,
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
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    rowDivider: {
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      paddingTop: spacing.sm,
    },
    rowLabel: {
      ...typography.body,
      color: colors.mute,
    },
    rowValue: {
      ...typography.body,
      color: colors.ink,
    },
    rowStrongLabel: {
      ...typography.subtitle,
      color: colors.ink,
    },
    rowStrongValue: {
      ...typography.title,
      color: colors.ink,
    },
    remaining: {
      color: colors.warning,
    },
    status: {
      ...typography.caption,
      color: colors.mute,
    },
    successNotice: {
      marginTop: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.bone,
      borderLeftWidth: 3,
      borderLeftColor: colors.success,
      padding: spacing.lg,
    },
    successText: {
      ...typography.body,
      color: colors.ink,
    },
    notice: {
      marginTop: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.bone,
      borderLeftWidth: 3,
      borderLeftColor: colors.ink,
      padding: spacing.lg,
    },
    noticeText: {
      ...typography.body,
      color: colors.ink,
    },
    paidCard: {
      marginTop: spacing.lg,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.success,
      backgroundColor: colors.card,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    paidTitle: {
      ...typography.title,
      color: colors.ink,
    },
    paidBody: {
      ...typography.body,
      color: colors.mute,
      marginBottom: spacing.sm,
    },
    sectionTitle: {
      marginTop: spacing.xl,
      marginBottom: spacing.sm,
      ...typography.subtitle,
      color: colors.ink,
    },
    methods: {
      flexDirection: "row",
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    method: {
      flex: 1,
      alignItems: "center",
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      paddingVertical: spacing.md,
    },
    methodSelected: {
      borderColor: colors.ink,
      backgroundColor: colors.bone,
    },
    methodLabel: {
      ...typography.button,
      color: colors.ink,
    },
    formError: {
      ...typography.caption,
      color: colors.danger,
    },
    paymentRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    paymentInfo: {
      flexShrink: 1,
      gap: spacing.xxs,
    },
    paymentMethod: {
      ...typography.body,
      color: colors.ink,
    },
    paymentNote: {
      ...typography.caption,
      color: colors.mute,
    },
    paymentAmount: {
      ...typography.subtitle,
      color: colors.ink,
    },
  });
