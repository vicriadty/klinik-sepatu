import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "../../components/AppButton";
import type { AppStackParamList } from "../../navigation/types";
import { uploadQueuedPhotos } from "../../order/photoUpload";
import { UPLOAD_STATUS_LABELS, usePhotoStore } from "../../order/photoStore";
import type { Theme } from "../../theme/tokens";
import { useThemedStyles } from "../../theme/useTheme";
import { formatIDR } from "../../utils/format";

type Navigation = NativeStackNavigationProp<AppStackParamList, "OrderSuccess">;
type Route = RouteProp<AppStackParamList, "OrderSuccess">;

export default function OrderSuccessScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const styles = useThemedStyles(createStyles);
  const { orderId, orderNumber, customerName, grandTotal } = route.params;
  const queue = usePhotoStore((state) => {
    const hasTaggedEntries = state.queue.some(
      (entry) => entry.orderId !== undefined
    );
    return hasTaggedEntries
      ? state.queue.filter(
          (entry) => entry.orderId === orderId || entry.orderId === undefined
        )
      : state.queue;
  });
  const hasTaggedQueue = usePhotoStore((state) =>
    state.queue.some((entry) => entry.orderId !== undefined)
  );

  useEffect(() => {
    void uploadQueuedPhotos(
      hasTaggedQueue ? { onlyOrderId: orderId } : undefined
    );
  }, [hasTaggedQueue, orderId]);

  const uploadedCount = queue.filter(
    (entry) => entry.status === "uploaded"
  ).length;
  const hasFailed = queue.some((entry) => entry.status === "failed");

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <View style={styles.content}>
        <Text style={styles.title}>Order dibuat</Text>
        <Text style={styles.orderNumber}>{orderNumber}</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Pelanggan</Text>
            <Text style={styles.rowValue}>{customerName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Total</Text>
            <Text style={styles.rowValue}>{formatIDR(grandTotal)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Pembayaran</Text>
            <Text style={styles.rowValue}>Belum dibayar</Text>
          </View>
        </View>

        {queue.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Foto ({uploadedCount}/{queue.length} terunggah)
            </Text>
            {queue.map((entry) => (
              <View key={entry.id} style={styles.photoRow}>
                <Image source={{ uri: entry.uri }} style={styles.thumbnail} />
                <View style={styles.photoInfo}>
                  <Text style={styles.photoTitle}>
                    {entry.type === "DAMAGE" ? "Kerusakan" : "Before"}
                  </Text>
                  <Text
                    style={[
                      styles.photoMeta,
                      entry.status === "failed" && styles.photoError,
                    ]}
                  >
                    {entry.error ?? UPLOAD_STATUS_LABELS[entry.status]}
                  </Text>
                </View>
              </View>
            ))}
            {hasFailed ? (
              <AppButton
                title="Unggah Ulang"
                variant="secondary"
                onPress={() =>
                  void uploadQueuedPhotos(
                    hasTaggedQueue ? { onlyOrderId: orderId } : undefined
                  )
                }
              />
            ) : null}
          </View>
        ) : null}

        <View style={styles.actions}>
          <AppButton
            title="Lanjut ke Pembayaran"
            onPress={() => navigation.navigate("OrderPayment", { orderId })}
          />
          <AppButton
            title="Order Baru"
            variant="secondary"
            onPress={() => navigation.replace("OrderCustomer")}
          />
          <AppButton
            title="Kembali ke Beranda"
            variant="ghost"
            onPress={() => navigation.navigate("Home")}
          />
        </View>
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
      flex: 1,
      padding: spacing.xl,
      gap: spacing.xs,
    },
    title: {
      ...typography.headingSm,
      color: colors.ink,
    },
    orderNumber: {
      ...typography.mono,
      color: colors.mute,
    },
    card: {
      marginTop: spacing.lg,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      padding: spacing.lg,
      gap: spacing.md,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    rowLabel: {
      ...typography.body,
      color: colors.mute,
    },
    rowValue: {
      ...typography.subtitle,
      color: colors.ink,
      flexShrink: 1,
      textAlign: "right",
    },
    sectionTitle: {
      ...typography.subtitle,
      color: colors.ink,
    },
    photoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    thumbnail: {
      width: 44,
      height: 44,
      borderRadius: radius.sm,
      backgroundColor: colors.bone,
    },
    photoInfo: {
      flex: 1,
      gap: spacing.xxs,
    },
    photoTitle: {
      ...typography.body,
      color: colors.ink,
    },
    photoMeta: {
      ...typography.caption,
      color: colors.mute,
    },
    photoError: {
      color: colors.danger,
    },
    actions: {
      marginTop: "auto",
      gap: spacing.md,
    },
  });
