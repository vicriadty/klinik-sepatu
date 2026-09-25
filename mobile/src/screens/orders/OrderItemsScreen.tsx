import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "../../components/AppButton";
import EmptyState from "../../components/EmptyState";
import ScreenHeader from "../../components/ScreenHeader";
import WizardProgress from "../../components/WizardProgress";
import type { AppStackParamList } from "../../navigation/types";
import { useOrderWizardStore } from "../../order/orderWizardStore";
import { deletePhotoFiles } from "../../order/photoFiles";
import { usePhotoStore } from "../../order/photoStore";
import type { Theme } from "../../theme/tokens";
import { useTheme, useThemedStyles } from "../../theme/useTheme";

type Navigation = NativeStackNavigationProp<AppStackParamList, "OrderItems">;

export default function OrderItemsScreen() {
  const navigation = useNavigation<Navigation>();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const customer = useOrderWizardStore((state) => state.customer);
  const items = useOrderWizardStore((state) => state.items);
  const removeItem = useOrderWizardStore((state) => state.removeItem);
  const photoDrafts = usePhotoStore((state) => state.drafts);
  const removeDraftsForItem = usePhotoStore((state) => state.removeDraftsForItem);

  const continueOrder = () => {
    const itemWithoutServices = items.find(
      (item) => item.serviceIds.length === 0
    );

    if (itemWithoutServices) {
      navigation.navigate("OrderItemServices", {
        itemId: itemWithoutServices.id,
      });
      return;
    }

    navigation.navigate("OrderReview");
  };

  const confirmRemove = (id: string, label: string) => {
    Alert.alert("Hapus sepatu?", `"${label}" akan dihapus dari order.`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: () => {
          const drafts = usePhotoStore.getState().drafts[id] ?? [];
          deletePhotoFiles(drafts.map((photo) => photo.uri));
          removeDraftsForItem(id);
          removeItem(id);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScreenHeader
        title="Pesanan baru"
        subtitle="Sepatu"
        onBack={() => navigation.goBack()}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <WizardProgress step={2} />
        <Text style={styles.title}>Sepatu</Text>

        {customer ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ubah pelanggan ${customer.name}`}
            onPress={() => navigation.navigate("OrderCustomer")}
            style={({ pressed }) => [
              styles.customerCard,
              pressed && styles.pressed,
            ]}
          >
            <UserIcon color={theme.colors.ink} />
            <View style={styles.customerCopy}>
              <Text style={styles.customerName}>{customer.name}</Text>
              <Text style={styles.customerPhone}>{customer.phone_display}</Text>
            </View>
            <Text style={styles.customerAction}>Ubah</Text>
          </Pressable>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daftar sepatu</Text>
          <Text style={styles.sectionCount}>• {items.length} item</Text>
        </View>

        {items.length === 0 ? (
          <EmptyState
            title="Belum ada sepatu."
            message="Tambahkan minimal satu sepatu untuk melanjutkan."
          />
        ) : (
          items.map((item, index) => {
            const label = `${item.brand}${item.model ? ` ${item.model}` : ""}`;
            const photos = (photoDrafts[item.id] ?? []).length;

            return (
              <View
                key={item.id}
                style={styles.shoeCard}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Sepatu {index + 1}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Hapus"
                    onPress={() => confirmRemove(item.id, label)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteLabel}>Hapus</Text>
                  </Pressable>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Atur layanan ${label}`}
                  onPress={() =>
                    navigation.navigate("OrderItemServices", {
                      itemId: item.id,
                    })
                  }
                  style={({ pressed }) => [
                    styles.cardBody,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.detailsGrid}>
                    <Detail label="Merek" value={item.brand} styles={styles} />
                    <Detail
                      label="Model / nama"
                      value={item.model}
                      styles={styles}
                    />
                    <Detail label="Warna" value={item.color} styles={styles} />
                    <Detail
                      label="Jenis sepatu"
                      value={item.shoeType}
                      styles={styles}
                    />
                  </View>
                  {item.customerNote ? (
                    <Text style={styles.note}>Catatan: {item.customerNote}</Text>
                  ) : null}
                </Pressable>

                <View style={styles.cardActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Foto (${photos})`}
                    onPress={() =>
                      navigation.navigate("OrderItemPhotos", {
                        itemId: item.id,
                      })
                    }
                    style={styles.actionButton}
                  >
                    <Text style={styles.actionLabel}>Foto ({photos})</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Ubah"
                    onPress={() =>
                      navigation.navigate("OrderItemForm", { itemId: item.id })
                    }
                    style={styles.actionButton}
                  >
                    <Text style={styles.actionLabel}>Ubah</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}

        <AppButton
          title="Tambah sepatu"
          variant="secondary"
          fullWidth
          leftIcon={<PlusIcon color={theme.colors.ink} />}
          onPress={() => navigation.navigate("OrderItemForm")}
        />
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.draftStatus}>Draft tersimpan otomatis</Text>
        <AppButton
          title="Lanjut: pilih layanan"
          onPress={continueOrder}
          disabled={items.length === 0}
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

function Detail({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: {
    detail: StyleProp<ViewStyle>;
    detailLabel: StyleProp<TextStyle>;
    detailValue: StyleProp<TextStyle>;
  };
}) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || "-"}</Text>
    </View>
  );
}

function PlusIcon({ color }: { color: string }) {
  return (
    <View pointerEvents="none" style={iconStyles.icon}>
      <View style={[iconStyles.line, { backgroundColor: color }]} />
      <View
        style={[iconStyles.line, iconStyles.verticalLine, { backgroundColor: color }]}
      />
    </View>
  );
}

function UserIcon({ color }: { color: string }) {
  return (
    <View pointerEvents="none" style={iconStyles.icon}>
      <View style={[iconStyles.userHead, { borderColor: color }]} />
      <View style={[iconStyles.userBody, { borderColor: color }]} />
    </View>
  );
}

const createStyles = ({ colors, radius, spacing, typography }: Theme) =>
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
    title: {
      ...typography.screenTitle,
      color: colors.ink,
      marginBottom: spacing.md,
    },
    customerCard: {
      minHeight: 64,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.card,
      backgroundColor: colors.card,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.xl,
    },
    customerCopy: {
      flex: 1,
      gap: spacing.xxs,
    },
    customerName: {
      ...typography.bodyUi,
      color: colors.ink,
    },
    customerPhone: {
      ...typography.caption,
      color: colors.mute,
    },
    customerAction: {
      ...typography.caption,
      color: colors.link,
      padding: spacing.sm,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    sectionTitle: {
      ...typography.overline,
      color: colors.ink,
      textTransform: "uppercase",
    },
    sectionCount: {
      ...typography.overline,
      color: colors.mute,
      textTransform: "uppercase",
    },
    shoeCard: {
      marginBottom: spacing.md,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      padding: spacing.lg,
    },
    pressed: {
      opacity: 0.85,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.md,
    },
    cardTitle: {
      ...typography.subtitle,
      color: colors.ink,
    },
    deleteButton: {
      minHeight: 44,
      justifyContent: "center",
      paddingHorizontal: spacing.sm,
    },
    deleteLabel: {
      ...typography.caption,
      color: colors.danger,
    },
    cardBody: {
      gap: spacing.md,
    },
    detailsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      columnGap: spacing.md,
      rowGap: spacing.md,
    },
    detail: {
      width: "46%",
      gap: spacing.xxs,
    },
    detailLabel: {
      ...typography.overline,
      color: colors.mute,
      textTransform: "uppercase",
    },
    detailValue: {
      ...typography.bodyUi,
      color: colors.ink,
    },
    note: {
      ...typography.caption,
      color: colors.mute,
    },
    cardActions: {
      flexDirection: "row",
      gap: spacing.xs,
      marginTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.hairline,
      paddingTop: spacing.sm,
    },
    actionButton: {
      minHeight: 44,
      justifyContent: "center",
      paddingHorizontal: spacing.sm,
    },
    actionLabel: {
      ...typography.caption,
      color: colors.link,
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
    draftStatus: {
      ...typography.caption,
      color: colors.mute,
      textAlign: "center",
    },
  });

const iconStyles = StyleSheet.create({
  icon: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  line: {
    position: "absolute",
    width: 14,
    height: 1.5,
  },
  verticalLine: {
    transform: [{ rotate: "90deg" }],
  },
  userHead: {
    position: "absolute",
    top: 2,
    width: 6,
    height: 6,
    borderWidth: 1,
    borderRadius: 6,
  },
  userBody: {
    position: "absolute",
    bottom: 2,
    width: 14,
    height: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
});
