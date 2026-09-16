import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchServices } from "../../api/services";
import AppButton from "../../components/AppButton";
import EmptyState from "../../components/EmptyState";
import type { AppStackParamList } from "../../navigation/types";
import { itemSubtotal } from "../../order/pricing";
import { useOrderWizardStore } from "../../order/orderWizardStore";
import { usePhotoStore } from "../../order/photoStore";
import type { Theme } from "../../theme/tokens";
import { useThemedStyles } from "../../theme/useTheme";
import { formatIDR } from "../../utils/format";

type Navigation = NativeStackNavigationProp<AppStackParamList, "OrderItems">;

export default function OrderItemsScreen() {
  const navigation = useNavigation<Navigation>();
  const styles = useThemedStyles(createStyles);
  const customer = useOrderWizardStore((state) => state.customer);
  const items = useOrderWizardStore((state) => state.items);
  const removeItem = useOrderWizardStore((state) => state.removeItem);
  const photoDrafts = usePhotoStore((state) => state.drafts);

  const servicesQuery = useQuery({
    queryKey: ["services", "active"],
    queryFn: () => fetchServices({ active: true }),
  });
  const services = servicesQuery.data ?? [];

  const ready =
    items.length > 0 && items.every((item) => item.serviceIds.length > 0);

  const confirmRemove = (id: string, label: string) => {
    Alert.alert("Hapus sepatu?", `"${label}" akan dihapus dari order.`, [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: () => removeItem(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.step}>Langkah 2 dari 3</Text>
        <Text style={styles.title}>Sepatu & Layanan</Text>
        {customer ? (
          <Text style={styles.customer}>{customer.name}</Text>
        ) : null}

        {items.length === 0 ? (
          <EmptyState
            title="Belum ada sepatu."
            message="Tambahkan minimal satu sepatu beserta layanannya."
          />
        ) : (
          items.map((item, index) => {
            const subtotal = itemSubtotal(item, services);
            const label = `${item.brand}${item.model ? ` ${item.model}` : ""}`;

            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`Atur layanan ${label}`}
                onPress={() =>
                  navigation.navigate("OrderItemServices", { itemId: item.id })
                }
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>
                    #{index + 1} {label}
                  </Text>
                  <Text style={styles.cardSubtotal}>{formatIDR(subtotal)}</Text>
                </View>
                <Text style={styles.cardMeta}>
                  {item.serviceIds.length > 0
                    ? `${item.serviceIds.length} layanan`
                    : "Belum ada layanan — tap untuk memilih"}
                </Text>
                <View style={styles.cardActions}>
                  <AppButton
                    title={`Foto (${(photoDrafts[item.id] ?? []).length})`}
                    variant="ghost"
                    onPress={() =>
                      navigation.navigate("OrderItemPhotos", {
                        itemId: item.id,
                      })
                    }
                  />
                  <AppButton
                    title="Ubah"
                    variant="ghost"
                    onPress={() =>
                      navigation.navigate("OrderItemForm", { itemId: item.id })
                    }
                  />
                  <AppButton
                    title="Hapus"
                    variant="ghost"
                    onPress={() => confirmRemove(item.id, label)}
                  />
                </View>
              </Pressable>
            );
          })
        )}

        <AppButton
          title="Tambah Sepatu"
          variant="secondary"
          onPress={() => navigation.navigate("OrderItemForm")}
        />

        {items.length > 0 && !ready ? (
          <Text style={styles.hint}>
            Setiap sepatu harus memiliki minimal satu layanan.
          </Text>
        ) : null}

        <AppButton
          title="Lanjut ke Review"
          onPress={() => navigation.navigate("OrderReview")}
          disabled={!ready}
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
    step: {
      ...typography.caption,
      color: colors.mute,
    },
    title: {
      ...typography.headingSm,
      color: colors.ink,
    },
    customer: {
      ...typography.body,
      color: colors.mute,
      marginBottom: spacing.lg,
    },
    card: {
      marginTop: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      padding: spacing.lg,
      gap: spacing.xs,
    },
    pressed: {
      opacity: 0.85,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    cardTitle: {
      ...typography.subtitle,
      color: colors.ink,
      flexShrink: 1,
    },
    cardSubtotal: {
      ...typography.subtitle,
      color: colors.ink,
    },
    cardMeta: {
      ...typography.body,
      color: colors.mute,
    },
    cardActions: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    hint: {
      ...typography.caption,
      color: colors.warning,
      marginTop: spacing.sm,
    },
  });
