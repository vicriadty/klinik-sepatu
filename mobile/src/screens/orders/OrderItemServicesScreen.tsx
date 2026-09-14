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

export default function OrderItemServicesScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const item = useOrderWizardStore((state) =>
    state.items.find((entry) => entry.id === route.params.itemId)
  );
  const setItemServices = useOrderWizardStore((state) => state.setItemServices);
  const [selected, setSelected] = useState<number[]>(item?.serviceIds ?? []);

  const servicesQuery = useQuery({
    queryKey: ["services", "active"],
    queryFn: () => fetchServices({ active: true }),
  });
  const services = servicesQuery.data ?? [];

  const selectedSet = new Set(selected);
  const subtotal = services
    .filter((service) => selectedSet.has(service.id))
    .reduce((sum, service) => sum + service.price, 0);

  const toggle = (serviceId: number) => {
    setSelected((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId]
    );
  };

  const save = () => {
    if (item) {
      setItemServices(item.id, selected);
    }
    navigation.goBack();
  };

  if (!item) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <EmptyState
          title="Sepatu tidak ditemukan."
          message="Kembali dan pilih sepatu dari daftar."
        />
        <View style={styles.footer}>
          <AppButton title="Kembali" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          {item.brand}
          {item.model ? ` ${item.model}` : ""}
        </Text>
        <Text style={styles.subtitle}>
          Pilih satu atau lebih layanan untuk sepatu ini.
        </Text>

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
          services.map((service) => {
            const isSelected = selectedSet.has(service.id);

            return (
              <Pressable
                key={service.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={`Layanan ${service.name}`}
                onPress={() => toggle(service.id)}
                style={[
                  styles.serviceCard,
                  isSelected && styles.serviceCardSelected,
                ]}
              >
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceMeta}>
                    {service.category?.name ?? "Tanpa kategori"}
                    {service.estimated_duration_days !== null
                      ? ` · ${service.estimated_duration_days} hari`
                      : ""}
                  </Text>
                </View>
                <Text style={styles.servicePrice}>
                  {formatIDR(service.price)}
                </Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerTotal}>
          {selected.length} layanan · {formatIDR(subtotal)}
        </Text>
        <AppButton
          title="Simpan Layanan"
          onPress={save}
          disabled={selected.length === 0}
        />
      </View>
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
    title: {
      ...typography.headingSm,
      color: colors.ink,
    },
    subtitle: {
      ...typography.body,
      color: colors.mute,
      marginBottom: spacing.lg,
    },
    loader: {
      marginTop: spacing.xxl,
    },
    serviceCard: {
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
    serviceCardSelected: {
      borderColor: colors.ink,
      backgroundColor: colors.bone,
    },
    serviceInfo: {
      flexShrink: 1,
      gap: spacing.xxs,
    },
    serviceName: {
      ...typography.subtitle,
      color: colors.ink,
    },
    serviceMeta: {
      ...typography.caption,
      color: colors.mute,
    },
    servicePrice: {
      ...typography.subtitle,
      color: colors.ink,
    },
    footer: {
      padding: spacing.xl,
      gap: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.hairline,
      backgroundColor: colors.canvas,
    },
    footerTotal: {
      ...typography.subtitle,
      color: colors.ink,
    },
  });
