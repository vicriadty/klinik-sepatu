import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
import StatusPill from "../../components/StatusPill";
import type { AppStackParamList } from "../../navigation/types";
import {
  clearPaymentIdempotencyKey,
  getPaymentIdempotencyKey,
} from "../../order/paymentIdempotency";
import { PAYMENT_STATUS_TONES } from "../../order/status";
import type { Theme } from "../../theme/tokens";
import { useTheme, useThemedStyles } from "../../theme/useTheme";
import { apiErrorMessage } from "../../utils/errors";
import { formatIDR } from "../../utils/format";

type Navigation = NativeStackNavigationProp<AppStackParamList, "OrderPayment">;
type Route = RouteProp<AppStackParamList, "OrderPayment">;

type PaymentIconName = "arrow-left" | "cash" | "qris" | "transfer" | "check";

const PAYMENT_METHOD_DESCRIPTIONS: Record<PaymentMethod, string> = {
  CASH: "Catat nominal diterima",
  QRIS: "Verifikasi manual oleh kasir",
  TRANSFER: "Verifikasi mutasi rekening",
};

function formatPaymentCurrency(value: number): string {
  return formatIDR(value).replace("Rp", "Rp ");
}

function PaymentIcon({
  name,
  color,
  size = 20,
}: {
  name: PaymentIconName;
  color: string;
  size?: number;
}) {
  if (name === "arrow-left") {
    return (
      <View pointerEvents="none" style={[iconStyles.base, { width: size, height: size }]}>
        <View style={[iconStyles.line, { top: size / 2, left: 2, width: size - 4, backgroundColor: color }]} />
        <View style={[iconStyles.line, { top: size / 2 - 1, left: 2, width: size * 0.45, backgroundColor: color, transform: [{ rotate: "-45deg" }] }]} />
        <View style={[iconStyles.line, { top: size / 2 + size * 0.28, left: 2, width: size * 0.45, backgroundColor: color, transform: [{ rotate: "45deg" }] }]} />
      </View>
    );
  }

  if (name === "cash") {
    return (
      <View pointerEvents="none" style={[iconStyles.base, { width: size, height: size }]}>
        <View style={[iconStyles.moneyFrame, { borderColor: color, width: size - 2, height: size * 0.58, left: 1, top: size * 0.21 }]} />
        <View style={[iconStyles.moneyDot, { borderColor: color, width: size * 0.2, height: size * 0.2, left: size * 0.4, top: size * 0.4 }]} />
        <View style={[iconStyles.line, { top: size * 0.34, left: size * 0.18, width: size * 0.16, backgroundColor: color, transform: [{ rotate: "45deg" }] }]} />
        <View style={[iconStyles.line, { top: size * 0.58, left: size * 0.66, width: size * 0.16, backgroundColor: color, transform: [{ rotate: "45deg" }] }]} />
      </View>
    );
  }

  if (name === "qris") {
    return (
      <View pointerEvents="none" style={[iconStyles.base, { width: size, height: size }]}>
        {[
          [0.08, 0.08],
          [0.58, 0.08],
          [0.08, 0.58],
          [0.58, 0.58],
        ].map(([left, top], index) => (
          <View
            key={index}
            style={[
              iconStyles.qrisCell,
              {
                borderColor: color,
                width: size * 0.3,
                height: size * 0.3,
                left: size * left,
                top: size * top,
              },
            ]}
          />
        ))}
      </View>
    );
  }

  if (name === "transfer") {
    return (
      <View pointerEvents="none" style={[iconStyles.base, { width: size, height: size }]}>
        <View style={[iconStyles.transferFrame, { borderColor: color, width: size * 0.7, height: size * 0.72, left: size * 0.15, top: size * 0.18 }]} />
        <View style={[iconStyles.line, { top: size * 0.58, left: size * 0.28, width: size * 0.18, backgroundColor: color }]} />
        <View style={[iconStyles.line, { top: size * 0.58, left: size * 0.55, width: size * 0.18, backgroundColor: color }]} />
        <View style={[iconStyles.line, { top: size * 0.33, left: size * 0.34, width: size * 0.32, backgroundColor: color }]} />
      </View>
    );
  }

  return (
    <View pointerEvents="none" style={[iconStyles.base, { width: size, height: size }]}>
      <View style={[iconStyles.line, { top: size * 0.58, left: size * 0.18, width: size * 0.28, backgroundColor: color, transform: [{ rotate: "45deg" }] }]} />
      <View style={[iconStyles.line, { top: size * 0.46, left: size * 0.4, width: size * 0.5, backgroundColor: color, transform: [{ rotate: "-45deg" }] }]} />
    </View>
  );
}

export default function OrderPaymentScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const queryClient = useQueryClient();
  const orderId = route.params.orderId;

  const orderQuery = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => fetchOrder(orderId),
  });

  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [amountText, setAmountText] = useState<string | null>(null);
  const [amountFocused, setAmountFocused] = useState(false);
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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
  const displayAmountValue =
    amountValue.trim() === ""
      ? ""
      : amountFocused
        ? amountValue
        : formatPaymentCurrency(amount);

  const handleAmountChange = (value: string) => {
    setAmountText(value.replace(/\D/g, ""));
  };

  const paymentMutation = useMutation({
    mutationFn: async () => {
      if (!order) {
        throw new Error("missing order");
      }

      const payload = {
        method,
        amount,
        ...(note.trim() !== "" ? { note: note.trim() } : {}),
      };
      const idempotencyKey = await getPaymentIdempotencyKey(
        order.id,
        "payment",
        JSON.stringify(payload)
      );

      return recordPayment(
        order.id,
        payload,
        idempotencyKey
      );
    },
    onSuccess: async (payment) => {
      await clearPaymentIdempotencyKey(orderId, "payment");
      setAmountText(null);
      setNote("");
      setFormError(null);
      setSuccessMessage(`Pembayaran ${formatIDR(payment.amount)} tercatat.`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["order", orderId] }),
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["home-recent-orders"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
      ]);
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
            <PaymentIcon name="arrow-left" color={theme.colors.ink} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Pembayaran</Text>
            <Text style={styles.subtitle}>{order.order_number}</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>TOTAL TAGIHAN</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryValue}>
              {formatPaymentCurrency(order.grand_total)}
            </Text>
            <StatusPill
              label={PAYMENT_STATUS_LABELS[order.payment_status].toUpperCase()}
              tone={
                order.payment_status === "UNPAID"
                  ? "warning"
                  : PAYMENT_STATUS_TONES[order.payment_status]
              }
            />
          </View>
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
            <Text style={styles.sectionTitle}>METODE PEMBAYARAN</Text>
            <View style={styles.methods}>
              {PAYMENT_METHODS.map((option) => {
                const selected = option === method;
                const iconName =
                  option === "CASH"
                    ? "cash"
                    : option === "QRIS"
                      ? "qris"
                      : "transfer";

                return (
                  <Pressable
                    key={option}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Metode ${PAYMENT_METHOD_LABELS[option]}`}
                    onPress={() => setMethod(option)}
                    style={[styles.method, selected && styles.methodSelected]}
                  >
                    <View style={styles.methodIcon}>
                      <PaymentIcon
                        name={iconName}
                        color={selected ? theme.colors.ink : theme.colors.mute}
                      />
                    </View>
                    <View style={styles.methodCopy}>
                      <Text style={styles.methodLabel}>
                        {PAYMENT_METHOD_LABELS[option]}
                      </Text>
                      <Text style={styles.methodDescription}>
                        {PAYMENT_METHOD_DESCRIPTIONS[option]}
                      </Text>
                    </View>
                    {selected ? (
                      <View style={styles.methodCheck}>
                        <PaymentIcon
                          name="check"
                          color={theme.colors.onPrimary}
                          size={14}
                        />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            {method === "QRIS" ? (
              <View style={styles.qrisPanel}>
                <PaymentIcon
                  name="qris"
                  color={theme.colors.primary}
                  size={46}
                />
                <View style={styles.qrisCopy}>
                  <Text style={styles.qrisTitle}>QRIS TOKO</Text>
                  <Text style={styles.qrisNote}>
                    Minta pelanggan scan QRIS statis, lalu cek aplikasi acquirer.
                  </Text>
                </View>
              </View>
            ) : null}

            <AppTextField
              label="JUMLAH DIBAYAR"
              placeholder="0"
              keyboardType="number-pad"
              value={displayAmountValue}
              onChangeText={handleAmountChange}
              error={amountError ?? undefined}
              containerStyle={styles.amountField}
              inputContainerStyle={styles.amountInput}
              onFocus={() => setAmountFocused(true)}
              onBlur={() => setAmountFocused(false)}
            />
            <AppButton
              title="Uang pas"
              variant="ghost"
              size="compact"
              style={styles.exactButton}
              onPress={() => setAmountText(String(remaining))}
            />

            <AppTextField
              label="Catatan (opsional)"
              placeholder="cth: Diterima kasir pagi"
              value={note}
              onChangeText={setNote}
              containerStyle={styles.noteField}
            />

            {formError ? (
              <Text style={styles.formError}>{formError}</Text>
            ) : null}

            <AppButton
              title="Catat pembayaran"
              accessibilityLabel="Catat Pembayaran"
              onPress={submit}
              loading={paymentMutation.isPending}
              fullWidth
              size="large"
            />
            <Text style={styles.authorityNote}>
              Status PAID hanya ditetapkan server setelah pembayaran tercatat.
            </Text>
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
                  {formatPaymentCurrency(payment.amount)}
                </Text>
              </View>
            ))}
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
      marginBottom: spacing.xl,
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
    summaryCard: {
      minHeight: 92,
      justifyContent: "space-between",
      borderRadius: radius.lg,
      backgroundColor: colors.primary,
      padding: spacing.lg,
    },
    summaryLabel: {
      ...typography.overline,
      color: colors.onPrimary,
    },
    summaryRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    summaryValue: {
      ...typography.headingSm,
      color: colors.onPrimary,
    },
    successNotice: {
      marginTop: spacing.lg,
      borderRadius: radius.md,
      backgroundColor: colors.bone,
      borderLeftWidth: 1,
      borderLeftColor: colors.success,
      padding: spacing.lg,
    },
    successText: {
      ...typography.body,
      color: colors.ink,
    },
    notice: {
      marginTop: spacing.lg,
      borderRadius: radius.md,
      backgroundColor: colors.bone,
      borderLeftWidth: 1,
      borderLeftColor: colors.ink,
      padding: spacing.lg,
    },
    noticeText: {
      ...typography.body,
      color: colors.ink,
    },
    paidCard: {
      marginTop: spacing.xl,
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
      ...typography.section,
      color: colors.ink,
    },
    methods: {
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    method: {
      minHeight: 52,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      paddingHorizontal: spacing.lg,
    },
    methodSelected: {
      borderColor: colors.ink,
    },
    methodIcon: {
      width: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    methodCopy: {
      flex: 1,
      gap: spacing.xxs,
    },
    methodLabel: {
      ...typography.subtitle,
      color: colors.ink,
    },
    methodDescription: {
      ...typography.bodyUi,
      color: colors.mute,
    },
    methodCheck: {
      width: 24,
      height: 24,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.full,
      backgroundColor: colors.primary,
    },
    qrisPanel: {
      minHeight: 94,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.lg,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      padding: spacing.lg,
    },
    qrisCopy: {
      flex: 1,
      gap: spacing.xs,
    },
    qrisTitle: {
      ...typography.title,
      color: colors.ink,
    },
    qrisNote: {
      ...typography.bodyUi,
      color: colors.mute,
    },
    amountField: {
      marginTop: spacing.xl,
    },
    amountInput: {
      minHeight: 46,
      borderRadius: radius.md,
      backgroundColor: colors.card,
    },
    exactButton: {
      alignSelf: "flex-start",
      marginTop: -spacing.xs,
    },
    noteField: {
      marginTop: spacing.sm,
    },
    formError: {
      ...typography.caption,
      color: colors.danger,
    },
    authorityNote: {
      ...typography.bodyUi,
      color: colors.mute,
      marginTop: spacing.md,
      textAlign: "center",
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

const iconStyles = StyleSheet.create({
  base: {
    position: "relative",
  },
  line: {
    position: "absolute",
    height: 2,
    borderRadius: 2,
  },
  moneyFrame: {
    position: "absolute",
    borderWidth: 2,
    borderRadius: 3,
  },
  moneyDot: {
    position: "absolute",
    borderWidth: 1.5,
    borderRadius: 99,
  },
  qrisCell: {
    position: "absolute",
    borderWidth: 2,
    borderRadius: 2,
  },
  transferFrame: {
    position: "absolute",
    borderWidth: 2,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
});
