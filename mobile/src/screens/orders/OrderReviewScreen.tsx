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
import WizardProgress from "../../components/WizardProgress";
import type { AppStackParamList } from "../../navigation/types";
import {
  discountMeetsMinimum,
  discountValueFor,
  itemSubtotal,
  orderSubtotal,
} from "../../order/pricing";
import { useOrderWizardStore } from "../../order/orderWizardStore";
import { usePhotoStore } from "../../order/photoStore";
import type { Theme } from "../../theme/tokens";
import { useTheme, useThemedStyles } from "../../theme/useTheme";
import { apiErrorMessage } from "../../utils/errors";
import { formatIDR } from "../../utils/format";

type Navigation = NativeStackNavigationProp<AppStackParamList, "OrderReview">;

export default function OrderReviewScreen() {
  const navigation = useNavigation<Navigation>();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const customer = useOrderWizardStore((state) => state.customer);
  const items = useOrderWizardStore((state) => state.items);
  const discountId = useOrderWizardStore((state) => state.discountId);
  const setDiscountId = useOrderWizardStore((state) => state.setDiscountId);
  const ensureIdempotencyKey = useOrderWizardStore(
    (state) => state.ensureIdempotencyKey
  );
  const reset = useOrderWizardStore((state) => state.reset);
  const enqueueFromOrder = usePhotoStore((state) => state.enqueueFromOrder);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showDiscounts, setShowDiscounts] = useState(false);

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
      const createdItems = order.items ?? [];

      enqueueFromOrder(
        items
          .map((item, index) => ({
            itemId: item.id,
            orderItemId: createdItems[index]?.id ?? 0,
          }))
          .filter((entry) => entry.orderItemId > 0),
        order.id
      );

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

  if (
    !customer ||
    items.length === 0 ||
    items.some((item) => item.serviceIds.length === 0)
  ) {
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

  if (servicesQuery.isLoading || discountsQuery.isLoading) {
    return <FullScreenLoader label="Menghitung total…" />;
  }

  if (servicesQuery.isError || discountsQuery.isError) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <EmptyState
          title="Gagal memuat data order."
          message="Periksa koneksi lalu coba lagi."
        />
        <View style={styles.emptyAction}>
          <AppButton
            title="Coba Lagi"
            variant="secondary"
            onPress={() => {
              void servicesQuery.refetch();
              void discountsQuery.refetch();
            }}
          />
          <AppButton title="Kembali" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <WizardProgress step={5} />
        <Text style={styles.title}>Review pesanan</Text>

        <View style={styles.customerCard}>
          <CustomerIcon color={theme.colors.mute} />
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{customer.name}</Text>
            <Text style={styles.customerPhone}>{customer.phone_display}</Text>
          </View>
        </View>

        {items.map((item, index) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>
                {item.brand}
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

        <Text style={styles.sectionTitle}>Diskon terdaftar</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pilih diskon"
          accessibilityState={{ expanded: showDiscounts }}
          onPress={() => setShowDiscounts((visible) => !visible)}
          style={styles.discountSelector}
        >
          <View style={styles.discountInfo}>
            <Text style={styles.discountSelectorLabel}>DISKON TERDAFTAR</Text>
            <Text style={styles.discountSelectorValue}>
              {selectedDiscount?.name ?? "Tidak ada diskon"}
            </Text>
          </View>
          <ChevronIcon color={theme.colors.mute} />
        </Pressable>

        {showDiscounts ? (
          discounts.length === 0 ? (
            <Text style={styles.sectionHint}>Tidak ada diskon aktif.</Text>
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
                  onPress={() => {
                    setDiscountId(selected ? null : discount.id);
                    setShowDiscounts(false);
                  }}
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
          )
        ) : null}

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
            <Text style={styles.grandLabel}>Total</Text>
            <Text style={styles.grandValue}>{formatIDR(grandTotal)}</Text>
          </View>
        </View>

        <View style={styles.serverNote}>
          <ShieldIcon color={theme.colors.mute} />
          <Text style={styles.serverNoteText}>
            Total final dikonfirmasi server saat dibuat.
          </Text>
        </View>

        {submitError ? (
          <Text style={styles.submitError}>{submitError}</Text>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <AppButton
          title="Buat pesanan"
          onPress={submit}
          loading={createMutation.isPending}
          fullWidth
        />
        <AppButton
          title="Simpan draft"
          variant="ghost"
          size="compact"
          onPress={() => navigation.goBack()}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

function CustomerIcon({ color }: { color: string }) {
  return (
    <View pointerEvents="none" style={iconStyles.customerIcon}>
      <View style={[iconStyles.customerHead, { borderColor: color }]} />
      <View style={[iconStyles.customerBody, { borderColor: color }]} />
    </View>
  );
}

function ShieldIcon({ color }: { color: string }) {
  return (
    <View pointerEvents="none" style={[iconStyles.shieldIcon, { borderColor: color }]}>
      <Text style={[iconStyles.shieldCheck, { color }]}>✓</Text>
    </View>
  );
}

function ChevronIcon({ color }: { color: string }) {
  return (
    <View pointerEvents="none" style={iconStyles.chevronIcon}>
      <View style={[iconStyles.chevronLine, { backgroundColor: color }]} />
      <View
        style={[iconStyles.chevronLine, iconStyles.chevronLineLower, { backgroundColor: color }]}
      />
    </View>
  );
}

const createStyles = ({ colors, layout, radius, spacing, typography }: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: spacing.page,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xl,
    },
    emptyAction: {
      padding: spacing.xl,
    },
    title: {
      ...typography.screenTitle,
      color: colors.ink,
      marginBottom: spacing.lg,
    },
    customerCard: {
      minHeight: layout.controlHeight,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      paddingHorizontal: spacing.md,
    },
    customerInfo: {
      flex: 1,
      gap: spacing.xxs,
    },
    customerName: {
      ...typography.bodyUi,
      color: colors.ink,
    },
    customerPhone: {
      ...typography.overline,
      color: colors.mute,
    },
    itemCard: {
      marginTop: spacing.md,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      padding: spacing.md,
      gap: spacing.xs,
    },
    itemHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    itemTitle: {
      ...typography.bodyUi,
      color: colors.ink,
      flexShrink: 1,
    },
    itemSubtotal: {
      ...typography.caption,
      color: colors.ink,
    },
    serviceRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    serviceName: {
      ...typography.overline,
      color: colors.body,
      flexShrink: 1,
    },
    servicePrice: {
      ...typography.overline,
      color: colors.body,
    },
    sectionTitle: {
      marginTop: spacing.xl,
      marginBottom: spacing.sm,
      ...typography.overline,
      color: colors.ink,
      textTransform: "uppercase",
    },
    sectionHint: {
      ...typography.bodyUi,
      color: colors.mute,
    },
    discountSelector: {
      minHeight: 46,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      paddingHorizontal: spacing.md,
    },
    discountSelectorLabel: {
      ...typography.overline,
      color: colors.mute,
    },
    discountSelectorValue: {
      ...typography.bodyUi,
      color: colors.ink,
    },
    discountRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      padding: spacing.md,
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
      ...typography.bodyUi,
      color: colors.ink,
    },
    discountMeta: {
      ...typography.overline,
      color: colors.mute,
    },
    discountState: {
      ...typography.caption,
      color: colors.ink,
    },
    totals: {
      marginTop: spacing.md,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      padding: spacing.md,
      gap: spacing.sm,
    },
    totalRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    totalLabel: {
      ...typography.bodyUi,
      color: colors.mute,
    },
    totalValue: {
      ...typography.bodyUi,
      color: colors.ink,
    },
    grandRow: {
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      paddingTop: spacing.sm,
    },
    grandLabel: {
      ...typography.bodyUi,
      color: colors.ink,
    },
    grandValue: {
      ...typography.title,
      color: colors.ink,
    },
    serverNote: {
      minHeight: 40,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      borderRadius: radius.card,
      backgroundColor: colors.canvas,
      paddingHorizontal: spacing.md,
      marginTop: spacing.md,
    },
    serverNoteText: {
      ...typography.overline,
      color: colors.mute,
      flex: 1,
    },
    submitError: {
      ...typography.caption,
      color: colors.danger,
      marginTop: spacing.md,
    },
    footer: {
      gap: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.hairline,
      backgroundColor: colors.canvas,
      paddingHorizontal: spacing.page,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
  });

const iconStyles = StyleSheet.create({
  customerIcon: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  customerHead: {
    width: 6,
    height: 6,
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 2,
  },
  customerBody: {
    width: 12,
    height: 6,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
  },
  shieldIcon: {
    width: 16,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 5,
  },
  shieldCheck: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "600",
  },
  chevronIcon: {
    width: 16,
    height: 16,
    position: "relative",
  },
  chevronLine: {
    position: "absolute",
    top: 4,
    left: 4,
    width: 7,
    height: 1.5,
    transform: [{ rotate: "45deg" }],
  },
  chevronLineLower: {
    top: 9,
    transform: [{ rotate: "-45deg" }],
  },
});
