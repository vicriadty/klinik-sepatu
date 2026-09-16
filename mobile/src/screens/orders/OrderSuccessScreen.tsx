import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useRef } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { uploadItemPhoto } from "../../api/photos";
import AppButton from "../../components/AppButton";
import type { AppStackParamList } from "../../navigation/types";
import { usePhotoStore, type UploadStatus } from "../../order/photoStore";
import type { Theme } from "../../theme/tokens";
import { useThemedStyles } from "../../theme/useTheme";
import { apiErrorMessage } from "../../utils/errors";
import { formatIDR } from "../../utils/format";

type Navigation = NativeStackNavigationProp<AppStackParamList, "OrderSuccess">;
type Route = RouteProp<AppStackParamList, "OrderSuccess">;

const UPLOAD_STATUS_LABELS: Record<UploadStatus, string> = {
  pending: "Menunggu",
  uploading: "Mengunggah…",
  uploaded: "Terunggah",
  failed: "Gagal",
};

export default function OrderSuccessScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const styles = useThemedStyles(createStyles);
  const { orderId, orderNumber, customerName, grandTotal } = route.params;
  const queue = usePhotoStore((state) => state.queue);
  const setStatus = usePhotoStore((state) => state.setStatus);
  const uploadingRef = useRef(false);

  const uploadPending = async () => {
    if (uploadingRef.current) {
      return;
    }
    uploadingRef.current = true;

    try {
      const pending = usePhotoStore
        .getState()
        .queue.filter(
          (entry) => entry.status === "pending" || entry.status === "failed"
        );

      for (const entry of pending) {
        setStatus(entry.id, "uploading");
        try {
          await uploadItemPhoto(entry.orderItemId, {
            uri: entry.uri,
            type: entry.type,
          });
          setStatus(entry.id, "uploaded");
        } catch (error) {
          setStatus(
            entry.id,
            "failed",
            apiErrorMessage(error, "Gagal mengunggah foto.")
          );
        }
      }
    } finally {
      uploadingRef.current = false;
    }
  };

  useEffect(() => {
    void uploadPending();
  }, []);

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
                onPress={() => void uploadPending()}
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
