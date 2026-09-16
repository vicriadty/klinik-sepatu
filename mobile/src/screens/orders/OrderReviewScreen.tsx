import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchDiscounts, type ApiDiscount } from "../../api/discounts";
import { createOrder } from "../../api/orders";
import { fetchServices } from "../../api/services";
import AppButton from "../../components/AppButton";
import EmptyState from "../../components/EmptyState";
import FullScreenLoader from "../../components/FullScreenLoader";
import type { AppStackParamList } from "../../navigation/types";
import {
  discountMeetsMinimum,
  discountValueFor,
  itemSubtotal,
  orderSubtotal,
} from "../../order/pricing";
import { useOrderWizardStore } from "../../order/orderWizardStore";
import type { Theme } from "../../theme/tokens";
import { useThemedStyles } from "../../theme/useTheme";
import { apiErrorMessage } from "../../utils/errors";
import { formatIDR } from "../../utils/format";

type Navigation = NativeStackNavigationProp<AppStackParamList, "OrderReview">;

export default function OrderReviewScreen() {
  const navigation = useNavigation<Navigation>();
  const styles = useThemedStyles(createStyles);
  const customer = useOrderWizardStore((state) => state.customer);
  const items = useOrderWizardStore((state) => state.items);
  const discountId = useOrderWizardStore((state) => state.discountId);
  const setDiscountId = useOrderWizardStore((state) => state.setDiscountId);
  const ensureIdempotencyKey = useOrderWizardStore(
    (state) => state.ensureIdempotencyKey
  );
  const reset = useOrderWizardStore((state) => state.reset);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const servicesQuery = useQuery({
    queryKey: ["services", "active"],
    queryFn: () => fetchServices({ active: true }),
  });
  const discountsQuery = useQuery({
    queryKey: ["discounts", "active"],
    queryFn: () => fetchDiscounts({ active: true }),
  });

  const services = servicesQuery.data ?? [];
  const discounts = discountsQuery.data ?? [];

  const subtotal = orderSubtotal(items, services);
  const selectedDiscount =
    discounts.find((discount) => discount.id === discountId) ?? null;
  const discountValue = discountValueFor(selectedDiscount, subtotal);
  const grandTotal = subtotal - discountValue;

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!customer) {
        throw new Error("missing customer");
      }
      const key = ensureIdempotencyKey();

      return createOrder(
        {
          customer_id: customer.id,
          ...(discountId !== null ? { discount_id: discountId } : {}),
          items: items.map((item) => ({
            brand: item.brand,
            shoe_type: item.shoeType,
            services: item.serviceIds,
            ...(item.model !== "" ? { model: item.model } : {}),
            ...(item.color !== "" ? { color: item.color } : {}),
            ...(item.customerNote !== ""
              ? { customer_note: item.customerNote }
              : {}),
          })),
        },
        key
      );
    },
    onSuccess: (order) => {
      const customerName = order.customer?.name ?? customer?.name ?? "";
      reset();
      navigation.replace("OrderSuccess", {
        orderId: order.id,
        orderNumber: order.order_number,
        customerName,
        grandTotal: order.grand_total,
      });
    },
    onError: (error: unknown) => {
      setSubmitError(
        apiErrorMessage(error, "Gagal membuat order. Coba lagi.")
      );
    },
  });

  const submit = () => {
    if (createMutation.isPending) return;
    setSubmitError(null);
    createMutation.mutate();
  };

  if (!customer || items.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <EmptyState
          title="Order belum lengkap."
          message="Pilih pelanggan dan tambahkan minimal satu sepatu."
        />
        <View style={styles.emptyAction}>
          <AppButton title="Kembali" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  if (servicesQuery.isLoading) {
    return <FullScreenLoader label="Menghitung total…" />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.step}>Langkah 3 dari 3</Text>
        <Text style={styles.title}>Review</Text>

        <View style={styles.customerCard}>
          <Text style={styles.customerName}>{customer.name}</Text>
          <Text style={styles.customerPhone}>{customer.phone_display}</Text>
        </View>

        {items.map((item, index) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>
                #{index + 1} {item.brand}
                {item.model !== "" ? ` ${item.model}` : ""}
              </Text>
              <Text style={styles.itemSubtotal}>
                {formatIDR(itemSubtotal(item, services))}
              </Text>
            </View>
            {item.serviceIds.map((serviceId) => {
              const service = services.find((entry) => entry.id === serviceId);
              if (!service) return null;
              return (
                <View key={serviceId} style={styles.serviceRow}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.servicePrice}>
                    {formatIDR(service.price)}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}

        <Text style={styles.sectionTitle}>Diskon</Text>
        {discountsQuery.isLoading ? (
          <Text style={styles.sectionHint}>Memuat diskon…</Text>
        ) : discounts.length === 0 ? (
          <Text style={styles.sectionHint}>
            Tidak ada diskon aktif.
          </Text>
        ) : (
          discounts.map((discount: ApiDiscount) => {
            const selected = discount.id === discountId;
            const meetsMinimum = discountMeetsMinimum(discount, subtotal);
            const valueLabel =
              discount.type === "PERCENT"
                ? `${discount.value}%`
                : formatIDR(discount.value);

            return (
              <Pressable
                key={discount.id}
                accessibilityRole="radio"
                accessibilityState={{ selected, disabled: !meetsMinimum }}
                accessibilityLabel={`Diskon ${discount.name}`}
                disabled={!meetsMinimum}
                onPress={() => setDiscountId(selected ? null : discount.id)}
                style={[
                  styles.discountRow,
                  selected && styles.discountSelected,
                  !meetsMinimum && styles.discountDisabled,
                ]}
              >
                <View style={styles.discountInfo}>
                  <Text style={styles.discountName}>{discount.name}</Text>
                  <Text style={styles.discountMeta}>
                    {valueLabel}
                    {discount.min_order_subtotal !== null
                      ? ` · min ${formatIDR(discount.min_order_subtotal)}`
                      : ""}
                  </Text>
                </View>
                <Text style={styles.discountState}>
                  {selected ? "Dipilih" : ""}
                </Text>
              </Pressable>
            );
          })
        )}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatIDR(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Diskon</Text>
            <Text style={styles.totalValue}>
              {discountValue > 0 ? `-${formatIDR(discountValue)}` : formatIDR(0)}
            </Text>
          </View>
          <View style={[styles.totalRow, styles.grandRow]}>
            <Text style={styles.grandLabel}>Grand total</Text>
            <Text style={styles.grandValue}>{formatIDR(grandTotal)}</Text>
          </View>
        </View>

        {submitError ? (
          <Text style={styles.submitError}>{submitError}</Text>
        ) : null}

        <AppButton
          title="Buat Order"
          onPress={submit}
          loading={createMutation.isPending}
        />
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
    },
    step: {
      ...typography.caption,
      color: colors.mute,
    },
    title: {
      ...typography.headingSm,
      color: colors.ink,
    },
    customerCard: {
      marginTop: spacing.lg,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      padding: spacing.lg,
      gap: spacing.xs,
    },
    customerName: {
      ...typography.subtitle,
      color: colors.ink,
    },
    customerPhone: {
      ...typography.body,
      color: colors.mute,
    },
    itemCard: {
      marginTop: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      padding: spacing.lg,
      gap: spacing.xs,
    },
    itemHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    itemTitle: {
      ...typography.subtitle,
      color: colors.ink,
      flexShrink: 1,
    },
    itemSubtotal: {
      ...typography.subtitle,
      color: colors.ink,
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
    sectionTitle: {
      marginTop: spacing.xl,
      marginBottom: spacing.sm,
      ...typography.subtitle,
      color: colors.ink,
    },
    sectionHint: {
      ...typography.body,
      color: colors.mute,
    },
    discountRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      padding: spacing.lg,
      marginBottom: spacing.sm,
    },
    discountSelected: {
      borderColor: colors.ink,
      backgroundColor: colors.bone,
    },
    discountDisabled: {
      opacity: 0.5,
    },
    discountInfo: {
      flexShrink: 1,
      gap: spacing.xxs,
    },
    discountName: {
      ...typography.subtitle,
      color: colors.ink,
    },
    discountMeta: {
      ...typography.caption,
      color: colors.mute,
    },
    discountState: {
      ...typography.caption,
      color: colors.ink,
    },
    totals: {
      marginTop: spacing.xl,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      padding: spacing.lg,
      gap: spacing.sm,
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
    submitError: {
      ...typography.caption,
      color: colors.danger,
      marginTop: spacing.md,
    },
  });
