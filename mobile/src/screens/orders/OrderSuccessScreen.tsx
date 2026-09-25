import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "../../components/AppButton";
import type { AppStackParamList } from "../../navigation/types";
import { uploadQueuedPhotos } from "../../order/photoUpload";
import { UPLOAD_STATUS_LABELS, usePhotoStore } from "../../order/photoStore";
import type { Theme } from "../../theme/tokens";
import { useTheme, useThemedStyles } from "../../theme/useTheme";
import { formatIDR } from "../../utils/format";

type Navigation = NativeStackNavigationProp<AppStackParamList, "OrderSuccess">;
type Route = RouteProp<AppStackParamList, "OrderSuccess">;

export default function OrderSuccessScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const theme = useTheme();
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
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.successMark}>
          <SuccessIcon color={theme.colors.success} />
        </View>
        <Text style={styles.title}>Pesanan dibuat</Text>
        <Text style={styles.description}>
          Order aman tersimpan sebagai belum dibayar.
        </Text>

        <View style={styles.orderCard}>
          <Text style={styles.orderLabel}>NOMOR PESANAN</Text>
          <Text style={styles.orderNumber}>{orderNumber}</Text>
          <View style={styles.orderMetaRow}>
            <View style={styles.orderMeta}>
              <Text style={styles.customerName}>{customerName}</Text>
              <Text style={styles.totalValue}>{formatIDR(grandTotal)}</Text>
            </View>
            <View style={styles.paymentBadge}>
              <Text style={styles.paymentBadgeText}>BELUM DIBAYAR</Text>
            </View>
          </View>
        </View>

        {queue.length > 0 ? (
          <View style={styles.uploadCard}>
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
            title="Lihat pesanan"
            variant="secondary"
            onPress={() => navigation.navigate("OrderDetail", { orderId })}
          />
          <AppButton
            title="Pesanan baru"
            variant="link"
            onPress={() => navigation.replace("OrderCustomer")}
          />
          <AppButton
            title="Kembali ke Beranda"
            variant="link"
            onPress={() => navigation.navigate("Home")}
          />
        </View>

        <View style={styles.safeNote}>
          <CloudOffIcon color={theme.colors.mute} />
          <Text style={styles.safeNoteText}>
            Jika koneksi terputus, pembayaran dapat dilanjutkan dari daftar pesanan.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SuccessIcon({ color }: { color: string }) {
  return (
    <View pointerEvents="none" style={iconStyles.successIcon}>
      <View style={[iconStyles.checkLine, { backgroundColor: color }]} />
      <View
        style={[iconStyles.checkLine, iconStyles.checkLineLong, { backgroundColor: color }]}
      />
    </View>
  );
}

function CloudOffIcon({ color }: { color: string }) {
  return (
    <View pointerEvents="none" style={iconStyles.cloudIcon}>
      <View style={[iconStyles.cloudShape, { borderColor: color }]} />
      <View style={[iconStyles.cloudSlash, { backgroundColor: color }]} />
    </View>
  );
}

const createStyles = ({ colors, radius, spacing, typography }: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: spacing.page,
      paddingTop: spacing.xxl,
      paddingBottom: spacing.xxl,
    },
    successMark: {
      width: 100,
      height: 100,
      alignSelf: "center",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.full,
      backgroundColor: colors.successSurface,
    },
    title: {
      ...typography.headingSm,
      color: colors.ink,
      textAlign: "center",
      marginTop: spacing.xxl,
    },
    description: {
      ...typography.bodyUi,
      color: colors.mute,
      textAlign: "center",
      marginTop: spacing.sm,
    },
    orderCard: {
      marginTop: spacing.xxl,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      padding: spacing.md,
      gap: spacing.sm,
    },
    orderLabel: {
      ...typography.overline,
      color: colors.stone,
      letterSpacing: 0.6,
    },
    orderNumber: {
      ...typography.mono,
      color: colors.ink,
      fontSize: 18,
      lineHeight: 22,
      fontWeight: "600",
    },
    orderMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      marginTop: spacing.sm,
    },
    orderMeta: {
      flex: 1,
      gap: spacing.xxs,
    },
    customerName: {
      ...typography.bodyUi,
      color: colors.body,
    },
    totalValue: {
      ...typography.overline,
      color: colors.mute,
    },
    paymentBadge: {
      minHeight: 26,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.pill,
      backgroundColor: colors.warningSurface,
      paddingHorizontal: spacing.sm,
    },
    paymentBadgeText: {
      ...typography.overline,
      color: colors.warning,
    },
    uploadCard: {
      marginTop: spacing.lg,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      padding: spacing.md,
      gap: spacing.md,
    },
    sectionTitle: {
      ...typography.bodyUi,
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
      ...typography.bodyUi,
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
      marginTop: spacing.xxl,
      gap: spacing.sm,
    },
    safeNote: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      borderRadius: radius.card,
      backgroundColor: colors.canvas,
      marginTop: spacing.xxl,
      paddingHorizontal: spacing.md,
    },
    safeNoteText: {
      ...typography.overline,
      color: colors.mute,
      flex: 1,
    },
  });

const iconStyles = StyleSheet.create({
  successIcon: {
    width: 32,
    height: 32,
    position: "relative",
  },
  checkLine: {
    position: "absolute",
    top: 16,
    left: 5,
    width: 9,
    height: 2,
    transform: [{ rotate: "45deg" }],
  },
  checkLineLong: {
    left: 11,
    width: 16,
    transform: [{ rotate: "-45deg" }],
  },
  cloudIcon: {
    width: 18,
    height: 18,
    position: "relative",
  },
  cloudShape: {
    position: "absolute",
    top: 5,
    left: 2,
    width: 14,
    height: 8,
    borderWidth: 1,
    borderRadius: 6,
  },
  cloudSlash: {
    position: "absolute",
    top: 8,
    left: 1,
    width: 18,
    height: 1,
    transform: [{ rotate: "-35deg" }],
  },
});
