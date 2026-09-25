import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "../../components/AppButton";
import EmptyState from "../../components/EmptyState";
import PhotoTile from "../../components/PhotoTile";
import WizardProgress from "../../components/WizardProgress";
import type { AppStackParamList } from "../../navigation/types";
import { useOrderWizardStore } from "../../order/orderWizardStore";
import { deletePhotoFile, persistPhotoFile } from "../../order/photoFiles";
import {
  angleLabel,
  PHOTO_ANGLES,
  typeForAngle,
  usePhotoStore,
  type DraftPhoto,
  type PhotoAngle,
} from "../../order/photoStore";
import type { Theme } from "../../theme/tokens";
import { useTheme, useThemedStyles } from "../../theme/useTheme";

type Navigation = NativeStackNavigationProp<
  AppStackParamList,
  "OrderItemPhotos"
>;
type Route = RouteProp<AppStackParamList, "OrderItemPhotos">;

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_PHOTO_COUNT = 5;
const EMPTY_PHOTOS: DraftPhoto[] = [];

export default function OrderItemPhotosScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const theme = useTheme();
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

  const photoCountByAngle = photos.reduce<Partial<Record<PhotoAngle, number>>>(
    (counts, photo) => {
      counts[photo.angle] = (counts[photo.angle] ?? 0) + 1;
      return counts;
    },
    {}
  );

  const pickPhoto = async (source: "camera" | "library") => {
    setPickerError(null);
    if (photos.length >= MAX_PHOTO_COUNT) {
      setPickerError("Maksimal 5 foto per sepatu.");
      return;
    }

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

      const currentPhotos =
        usePhotoStore.getState().drafts[itemId] ?? EMPTY_PHOTOS;
      if (currentPhotos.length >= MAX_PHOTO_COUNT) {
        setPickerError("Maksimal 5 foto per sepatu.");
        return;
      }

      const durableUri = await persistPhotoFile(asset.uri);
      addDraft(itemId, {
        uri: durableUri,
        angle,
        type: typeForAngle(angle),
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      });
    } catch {
      setPickerError("Gagal membuka kamera atau galeri.");
    }
  };

  const removePhoto = (photo: DraftPhoto) => {
    deletePhotoFile(photo.uri);
    removeDraft(itemId, photo.id);
  };

  if (!item) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <View style={styles.emptyContent}>
          <WizardProgress step={4} />
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

  const itemLabel = `${item.brand}${item.model ? ` ${item.model}` : ""}`;

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <WizardProgress step={4} />
        <Text style={styles.title}>Foto kondisi</Text>
        <Text style={styles.sectionTitle}>Foto before · {itemLabel}</Text>

        <View style={styles.infoCard}>
          <InfoIcon color={theme.colors.mute} />
          <View style={styles.infoCopy}>
            <Text style={styles.infoTitle}>
              Ambil foto sebelum untuk mencatat kondisi awal.
            </Text>
            <Text style={styles.infoMessage}>
              Checklist ini hanya panduan, tipe foto tetap BEFORE.
            </Text>
          </View>
        </View>

        <View style={styles.angleGrid}>
          {PHOTO_ANGLES.map((option) => {
            const count = photoCountByAngle[option.value] ?? 0;
            const selected = option.value === angle;

            return (
              <Pressable
                key={option.value}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: count > 0 }}
                accessibilityLabel={`Sudut ${option.label}`}
                onPress={() => setAngle(option.value)}
                style={[
                  styles.angleOption,
                  selected && styles.angleOptionSelected,
                ]}
              >
                <View
                  style={[
                    styles.angleCheckbox,
                    count > 0 && styles.angleCheckboxChecked,
                  ]}
                >
                  {count > 0 ? <CheckIcon color={theme.colors.onPrimary} /> : null}
                </View>
                <View style={styles.angleCopy}>
                  <Text style={styles.angleLabel}>{option.label}</Text>
                  {option.value === "damage" ? (
                    <Text style={styles.angleOptional}>opsional</Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.savedLabel}>
          Foto tersimpan · {photos.length} / {MAX_PHOTO_COUNT}
        </Text>
        <View style={styles.photoGrid}>
          {photos.map((photo) => (
            <PhotoTile
              key={photo.id}
              label={angleLabel(photo.angle)}
              state="captured"
              imageUri={photo.uri}
              onRemove={() => removePhoto(photo)}
            />
          ))}
          {photos.length < MAX_PHOTO_COUNT ? (
            <>
              <PhotoTile
                label="Pilih dari Galeri"
                subtitle="Dari perangkat"
                onPress={() => void pickPhoto("library")}
              />
              <PhotoTile
                label="Ambil Foto"
                subtitle="Kamera"
                onPress={() => void pickPhoto("camera")}
              />
            </>
          ) : null}
        </View>

        {pickerError ? <Text style={styles.error}>{pickerError}</Text> : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tambah foto kerusakan"
          onPress={() => setAngle("damage")}
          style={styles.damageRow}
        >
          <View style={styles.damageCopy}>
            <Text style={styles.damageTitle}>Tambah foto kerusakan</Text>
            <Text style={styles.damageMeta}>Opsional</Text>
          </View>
          <ChevronIcon color={theme.colors.mute} />
        </Pressable>

        <Text style={styles.uploadNote}>
          Foto akan diunggah setelah order berhasil dibuat.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <AppButton
          title="Lanjut: tinjau pesanan"
          onPress={() => navigation.navigate("OrderReview")}
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

function InfoIcon({ color }: { color: string }) {
  return (
    <View pointerEvents="none" style={[iconStyles.infoIcon, { borderColor: color }]}>
      <View style={[iconStyles.infoDot, { backgroundColor: color }]} />
      <View style={[iconStyles.infoLine, { backgroundColor: color }]} />
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
      marginBottom: spacing.md,
    },
    infoCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.md,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.bone,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    infoIcon: {
      width: layout.icon.inline,
      height: layout.icon.inline,
      alignItems: "center",
      borderWidth: 1,
      borderRadius: radius.full,
      marginTop: spacing.xxs,
    },
    infoDot: {
      width: 2,
      height: 2,
      borderRadius: radius.full,
      marginTop: spacing.xxs,
    },
    infoLine: {
      width: 2,
      height: spacing.xs,
      borderRadius: radius.full,
      marginTop: spacing.xxs,
    },
    infoCopy: {
      flex: 1,
      gap: spacing.xxs,
    },
    infoTitle: {
      ...typography.bodyUi,
      color: colors.ink,
    },
    infoMessage: {
      ...typography.caption,
      color: colors.mute,
    },
    angleGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    angleOption: {
      width: "48%",
      minHeight: layout.minTouchTarget,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    angleOptionSelected: {
      borderColor: colors.ink,
      backgroundColor: colors.bone,
    },
    angleCheckbox: {
      width: layout.icon.inline,
      height: layout.icon.inline,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.xs,
    },
    angleCheckboxChecked: {
      borderColor: colors.ink,
      backgroundColor: colors.ink,
    },
    angleCopy: {
      flex: 1,
      gap: spacing.xxs,
    },
    angleLabel: {
      ...typography.caption,
      color: colors.ink,
    },
    angleOptional: {
      ...typography.overline,
      color: colors.mute,
    },
    savedLabel: {
      ...typography.overline,
      color: colors.ink,
      marginBottom: spacing.sm,
      textTransform: "uppercase",
    },
    photoGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    error: {
      ...typography.caption,
      color: colors.danger,
      marginTop: spacing.md,
    },
    damageRow: {
      minHeight: layout.minTouchTarget,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      paddingHorizontal: spacing.md,
      marginTop: spacing.lg,
    },
    damageCopy: {
      flex: 1,
      gap: spacing.xxs,
    },
    damageTitle: {
      ...typography.bodyUi,
      color: colors.ink,
    },
    damageMeta: {
      ...typography.caption,
      color: colors.mute,
    },
    uploadNote: {
      ...typography.caption,
      color: colors.mute,
      textAlign: "center",
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
  infoIcon: {
    width: 16,
    height: 16,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
  },
  infoDot: {
    width: 2,
    height: 2,
    borderRadius: 2,
    marginTop: 3,
  },
  infoLine: {
    width: 2,
    height: 5,
    borderRadius: 2,
    marginTop: 2,
  },
  chevronIcon: {
    width: 16,
    height: 16,
    position: "relative",
  },
  chevronLine: {
    position: "absolute",
    top: 5,
    left: 4,
    width: 7,
    height: 1.5,
    transform: [{ rotate: "45deg" }],
  },
  chevronLineLower: {
    top: 10,
    transform: [{ rotate: "-45deg" }],
  },
});
