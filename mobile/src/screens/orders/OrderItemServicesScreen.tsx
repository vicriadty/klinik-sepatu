import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchServices } from "../../api/services";
import AppButton from "../../components/AppButton";
import EmptyState from "../../components/EmptyState";
import WizardProgress from "../../components/WizardProgress";
import type { AppStackParamList } from "../../navigation/types";
import { useOrderWizardStore } from "../../order/orderWizardStore";
import type { Theme } from "../../theme/tokens";
import { useTheme, useThemedStyles } from "../../theme/useTheme";
import { formatIDR } from "../../utils/format";

type Navigation = NativeStackNavigationProp<
  AppStackParamList,
  "OrderItemServices"
>;
type Route = RouteProp<AppStackParamList, "OrderItemServices">;
type ServiceSelections = Record<string, number[]>;

export default function OrderItemServicesScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const items = useOrderWizardStore((state) => state.items);
  const setItemServices = useOrderWizardStore((state) => state.setItemServices);
  const [activeItemId, setActiveItemId] = useState(route.params.itemId);
  const [selectedByItem, setSelectedByItem] = useState<ServiceSelections>(() =>
    Object.fromEntries(
      items.map((item) => [item.id, item.serviceIds])
    ) as ServiceSelections
  );

  const servicesQuery = useQuery({
    queryKey: ["services", "active"],
    queryFn: () => fetchServices({ active: true }),
  });
  const services = servicesQuery.data ?? [];
  const activeItem = items.find((item) => item.id === activeItemId);
  const activeItemIndex = items.findIndex((item) => item.id === activeItemId);
  const selected = selectedByItem[activeItemId] ?? [];
  const selectedSet = new Set(selected);
  const allItemsReady =
    items.length > 0 &&
    items.every((item) => (selectedByItem[item.id] ?? []).length > 0);
  const subtotal = services
    .filter((service) => selectedSet.has(service.id))
    .reduce((sum, service) => sum + service.price, 0);

  const toggle = (serviceId: number) => {
    setSelectedByItem((current) => {
      const currentSelection = current[activeItemId] ?? [];
      const nextSelection = currentSelection.includes(serviceId)
        ? currentSelection.filter((id) => id !== serviceId)
        : [...currentSelection, serviceId];

      return { ...current, [activeItemId]: nextSelection };
    });
  };

  const commitSelections = () => {
    items.forEach((item) => {
      setItemServices(item.id, selectedByItem[item.id] ?? []);
    });
  };

  const saveDraft = () => {
    commitSelections();
    navigation.goBack();
  };

  const continueToPhotos = () => {
    if (!allItemsReady || !activeItem) {
      return;
    }

    commitSelections();
    navigation.navigate("OrderItemPhotos", { itemId: activeItem.id });
  };

  if (!activeItem) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <View style={styles.emptyContent}>
          <WizardProgress step={3} />
          <EmptyState
            title="Sepatu tidak ditemukan."
            message="Kembali dan pilih sepatu dari daftar."
          />
        </View>
        <View style={styles.footer}>
          <AppButton title="Kembali" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <WizardProgress step={3} />
        <Text style={styles.title}>Layanan</Text>
        <Text style={styles.sectionTitle}>Pilih layanan per sepatu</Text>
        <Text style={styles.helper}>
          Pilih satu atau lebih layanan. Harga berasal dari server.
        </Text>

        <View style={styles.tabs} accessibilityRole="tablist">
          {items.map((item, index) => {
            const isActive = item.id === activeItemId;

            return (
              <Pressable
                key={item.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`Sepatu ${index + 1}`}
                onPress={() => setActiveItemId(item.id)}
                style={[styles.tab, isActive && styles.tabActive]}
              >
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  Sepatu {index + 1}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {servicesQuery.isLoading ? (
          <ActivityIndicator
            size="large"
            color={theme.colors.ink}
            style={styles.loader}
          />
        ) : servicesQuery.isError ? (
          <EmptyState
            title="Gagal memuat layanan."
            message="Periksa koneksi lalu coba lagi."
          />
        ) : services.length === 0 ? (
          <EmptyState
            title="Belum ada layanan aktif."
            message="Tambahkan layanan dari dashboard web terlebih dahulu."
          />
        ) : (
          <View style={styles.serviceList}>
            {services.map((service) => {
              const isSelected = selectedSet.has(service.id);
              const description =
                service.description?.trim() ||
                service.category?.name ||
                "Tanpa kategori";
              const duration =
                service.estimated_duration_days !== null
                  ? `${service.estimated_duration_days} hari`
                  : null;

              return (
                <Pressable
                  key={service.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={`Layanan ${service.name}`}
                  onPress={() => toggle(service.id)}
                  style={({ pressed }) => [
                    styles.serviceCard,
                    isSelected && styles.serviceCardSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <View
                    style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected,
                    ]}
                  >
                    {isSelected ? <CheckIcon color={theme.colors.onPrimary} /> : null}
                  </View>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.serviceMeta}>{description}</Text>
                  </View>
                  <View style={styles.servicePriceGroup}>
                    <Text style={styles.servicePrice}>{formatIDR(service.price)}</Text>
                    {duration ? (
                      <Text style={styles.serviceDuration}>{duration}</Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.subtotalCard}>
          <View style={styles.subtotalInfo}>
            <Text style={styles.subtotalLabel}>
              Subtotal sepatu {activeItemIndex + 1}
            </Text>
            <Text style={styles.subtotalValue}>{formatIDR(subtotal)}</Text>
          </View>
          <Text style={styles.subtotalCount}>{selected.length} layanan</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <AppButton
          title="Lanjut: ambil foto"
          onPress={continueToPhotos}
          disabled={!allItemsReady || servicesQuery.isError}
          fullWidth
        />
        <AppButton
          title="Simpan draft"
          variant="ghost"
          size="compact"
          onPress={saveDraft}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <View pointerEvents="none" style={iconStyles.checkIcon}>
      <View style={[iconStyles.checkLine, { backgroundColor: color }]} />
      <View
        style={[iconStyles.checkLine, iconStyles.checkLineLong, { backgroundColor: color }]}
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
    emptyContent: {
      flex: 1,
      padding: spacing.page,
    },
    title: {
      ...typography.screenTitle,
      color: colors.ink,
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      ...typography.overline,
      color: colors.ink,
      textTransform: "uppercase",
    },
    helper: {
      ...typography.caption,
      color: colors.mute,
      marginTop: spacing.xs,
      marginBottom: spacing.lg,
    },
    tabs: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
      marginBottom: spacing.md,
    },
    tab: {
      flex: 1,
      minHeight: layout.minTouchTarget,
      alignItems: "center",
      justifyContent: "center",
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    tabActive: {
      borderBottomColor: colors.ink,
    },
    tabLabel: {
      ...typography.caption,
      color: colors.mute,
    },
    tabLabelActive: {
      color: colors.ink,
    },
    loader: {
      marginTop: spacing.xxl,
    },
    serviceList: {
      gap: spacing.sm,
    },
    serviceCard: {
      minHeight: layout.serviceRowHeight,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    serviceCardSelected: {
      borderColor: colors.ink,
      backgroundColor: colors.bone,
    },
    checkbox: {
      width: layout.icon.inline,
      height: layout.icon.inline,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.xs,
    },
    checkboxSelected: {
      borderColor: colors.ink,
      backgroundColor: colors.ink,
    },
    serviceInfo: {
      flex: 1,
      gap: spacing.xxs,
    },
    serviceName: {
      ...typography.bodyUi,
      color: colors.ink,
    },
    serviceMeta: {
      ...typography.caption,
      color: colors.mute,
    },
    servicePriceGroup: {
      alignItems: "flex-end",
      gap: spacing.xxs,
    },
    servicePrice: {
      ...typography.bodyUi,
      color: colors.ink,
    },
    serviceDuration: {
      ...typography.caption,
      color: colors.mute,
    },
    subtotalCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.bone,
      padding: spacing.lg,
      marginTop: spacing.lg,
    },
    subtotalInfo: {
      gap: spacing.xxs,
    },
    subtotalLabel: {
      ...typography.caption,
      color: colors.mute,
    },
    subtotalValue: {
      ...typography.subtitle,
      color: colors.ink,
    },
    subtotalCount: {
      ...typography.caption,
      color: colors.mute,
    },
    pressed: {
      opacity: 0.78,
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
  checkIcon: {
    width: 14,
    height: 14,
    position: "relative",
  },
  checkLine: {
    position: "absolute",
    top: 7,
    left: 2,
    width: 5,
    height: 1.5,
    transform: [{ rotate: "45deg" }],
  },
  checkLineLong: {
    left: 5,
    width: 8,
    transform: [{ rotate: "-45deg" }],
  },
});
