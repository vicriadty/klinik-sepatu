import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "../../components/AppButton";
import EmptyState from "../../components/EmptyState";
import type { AppStackParamList } from "../../navigation/types";
import { useOrderWizardStore } from "../../order/orderWizardStore";
import {
  angleLabel,
  PHOTO_ANGLES,
  typeForAngle,
  usePhotoStore,
  type DraftPhoto,
  type PhotoAngle,
} from "../../order/photoStore";
import type { Theme } from "../../theme/tokens";
import { useThemedStyles } from "../../theme/useTheme";

type Navigation = NativeStackNavigationProp<
  AppStackParamList,
  "OrderItemPhotos"
>;
type Route = RouteProp<AppStackParamList, "OrderItemPhotos">;

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const EMPTY_PHOTOS: DraftPhoto[] = [];

export default function OrderItemPhotosScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const styles = useThemedStyles(createStyles);
  const itemId = route.params.itemId;
  const item = useOrderWizardStore((state) =>
    state.items.find((entry) => entry.id === itemId)
  );
  const photos = usePhotoStore(
    (state) => state.drafts[itemId] ?? EMPTY_PHOTOS
  );
  const addDraft = usePhotoStore((state) => state.addDraft);
  const removeDraft = usePhotoStore((state) => state.removeDraft);
  const [angle, setAngle] = useState<PhotoAngle>("front");
  const [pickerError, setPickerError] = useState<string | null>(null);

  const pickPhoto = async (source: "camera" | "library") => {
    setPickerError(null);

    try {
      if (source === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setPickerError("Izin kamera diperlukan untuk mengambil foto.");
          return;
        }
      } else {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          setPickerError("Izin galeri diperlukan untuk memilih foto.");
          return;
        }
      }

      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ["images"],
              quality: 0.6,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              quality: 0.6,
            });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      if (
        asset.fileSize !== undefined &&
        asset.fileSize !== null &&
        asset.fileSize > MAX_PHOTO_BYTES
      ) {
        setPickerError("Foto terlalu besar (maks 5 MB). Coba ambil ulang.");
        return;
      }

      addDraft(itemId, {
        uri: asset.uri,
        angle,
        type: typeForAngle(angle),
      });
    } catch {
      setPickerError("Gagal membuka kamera atau galeri.");
    }
  };

  if (!item) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <EmptyState
          title="Sepatu tidak ditemukan."
          message="Kembali dan pilih sepatu dari daftar."
        />
        <View style={styles.emptyAction}>
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
          Foto BEFORE disarankan untuk semua sisi. Pilih sudut, lalu ambil dari
          kamera atau galeri.
        </Text>

        <View style={styles.angles}>
          {PHOTO_ANGLES.map((option) => {
            const selected = option.value === angle;
            const count = photos.filter(
              (photo) => photo.angle === option.value
            ).length;

            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Sudut ${option.label}`}
                onPress={() => setAngle(option.value)}
                style={[
                  styles.angle,
                  selected && styles.angleSelected,
                ]}
              >
                <Text style={styles.angleLabel}>
                  {option.label}
                  {count > 0 ? ` ✓ ${count}` : ""}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.actions}>
          <AppButton
            title="Ambil Foto"
            onPress={() => void pickPhoto("camera")}
          />
          <AppButton
            title="Pilih dari Galeri"
            variant="secondary"
            onPress={() => void pickPhoto("library")}
          />
        </View>

        {pickerError ? (
          <Text style={styles.error}>{pickerError}</Text>
        ) : null}

        {photos.length === 0 ? (
          <EmptyState
            title="Belum ada foto."
            message="Minimal satu foto BEFORE membantu proses cleaning."
          />
        ) : (
          photos.map((photo) => (
            <View key={photo.id} style={styles.photoRow}>
              <Image source={{ uri: photo.uri }} style={styles.thumbnail} />
              <View style={styles.photoInfo}>
                <Text style={styles.photoTitle}>
                  {angleLabel(photo.angle)}
                </Text>
              </View>
              <AppButton
                title="Hapus"
                variant="ghost"
                onPress={() => removeDraft(itemId, photo.id)}
              />
            </View>
          ))
        )}

        <AppButton title="Selesai" variant="secondary" onPress={() => navigation.goBack()} />
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
    title: {
      ...typography.headingSm,
      color: colors.ink,
    },
    subtitle: {
      ...typography.body,
      color: colors.mute,
      marginBottom: spacing.lg,
    },
    angles: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    angle: {
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    angleSelected: {
      borderColor: colors.ink,
      backgroundColor: colors.bone,
    },
    angleLabel: {
      ...typography.button,
      color: colors.ink,
    },
    actions: {
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    error: {
      ...typography.caption,
      color: colors.danger,
      marginBottom: spacing.md,
    },
    photoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    thumbnail: {
      width: 56,
      height: 56,
      borderRadius: radius.sm,
      backgroundColor: colors.bone,
    },
    photoInfo: {
      flex: 1,
      gap: spacing.xxs,
    },
    photoTitle: {
      ...typography.subtitle,
      color: colors.ink,
    },
  });
