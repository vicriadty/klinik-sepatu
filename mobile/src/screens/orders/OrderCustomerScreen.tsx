import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Alert, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "../../components/AppButton";
import EmptyState from "../../components/EmptyState";
import WizardProgress from "../../components/WizardProgress";
import type { AppStackParamList } from "../../navigation/types";
import { useOrderWizardStore } from "../../order/orderWizardStore";
import { deletePhotoFiles } from "../../order/photoFiles";
import { usePhotoStore } from "../../order/photoStore";
import type { Theme } from "../../theme/tokens";
import { useThemedStyles } from "../../theme/useTheme";

type Navigation = NativeStackNavigationProp<AppStackParamList, "OrderCustomer">;

export default function OrderCustomerScreen() {
  const navigation = useNavigation<Navigation>();
  const styles = useThemedStyles(createStyles);
  const customer = useOrderWizardStore((state) => state.customer);
  const items = useOrderWizardStore((state) => state.items);
  const reset = useOrderWizardStore((state) => state.reset);
  const clearDrafts = usePhotoStore((state) => state.clearDrafts);
  const hasDraft = customer !== null || items.length > 0;

  const discardDraft = () => {
    Alert.alert(
      "Mulai order baru?",
      "Draft order yang tersimpan akan dihapus.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Ya, mulai baru",
          style: "destructive",
          onPress: () => {
            const drafts = usePhotoStore.getState().drafts;
            deletePhotoFiles(
              Object.values(drafts)
                .flat()
                .map((photo) => photo.uri)
            );
            clearDrafts();
            reset();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <View style={styles.content}>
        <WizardProgress step={1} />
        <Text style={styles.title}>Pelanggan</Text>

        {hasDraft ? (
          <View style={styles.draftNotice}>
            <Text style={styles.draftText}>
              Draft order tersimpan dan dipulihkan otomatis.
            </Text>
          </View>
        ) : null}

        {customer ? (
          <View style={styles.card}>
            <Text style={styles.cardName}>{customer.name}</Text>
            <Text style={styles.cardPhone}>{customer.phone_display}</Text>
          </View>
        ) : (
          <EmptyState
            title="Belum ada pelanggan dipilih."
            message="Cari pelanggan lama atau buat pelanggan baru."
          />
        )}

        <View style={styles.actions}>
          <AppButton
            title={customer ? "Ganti Pelanggan" : "Pilih Pelanggan"}
            variant={customer ? "secondary" : "primary"}
            onPress={() => navigation.navigate("Customers", { select: true })}
          />
          <AppButton
            title="Lanjut"
            onPress={() => navigation.navigate("OrderItems")}
            disabled={!customer}
          />
          {hasDraft ? (
            <AppButton
              title="Mulai Baru"
              variant="ghost"
              onPress={discardDraft}
            />
          ) : null}
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
    step: {
      ...typography.caption,
      color: colors.mute,
    },
    title: {
      ...typography.headingSm,
      color: colors.ink,
    },
    draftNotice: {
      marginTop: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.bone,
      borderLeftWidth: 3,
      borderLeftColor: colors.ink,
      padding: spacing.lg,
    },
    draftText: {
      ...typography.body,
      color: colors.ink,
    },
    card: {
      marginTop: spacing.xl,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      padding: spacing.lg,
      gap: spacing.xs,
    },
    cardName: {
      ...typography.subtitle,
      color: colors.ink,
    },
    cardPhone: {
      ...typography.body,
      color: colors.mute,
    },
    actions: {
      marginTop: "auto",
      gap: spacing.md,
    },
  });
