import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "../../components/AppButton";
import EmptyState from "../../components/EmptyState";
import type { AppStackParamList } from "../../navigation/types";
import { useOrderWizardStore } from "../../order/orderWizardStore";
import type { Theme } from "../../theme/tokens";
import { useThemedStyles } from "../../theme/useTheme";

type Navigation = NativeStackNavigationProp<AppStackParamList, "OrderCustomer">;

export default function OrderCustomerScreen() {
  const navigation = useNavigation<Navigation>();
  const styles = useThemedStyles(createStyles);
  const customer = useOrderWizardStore((state) => state.customer);

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <View style={styles.content}>
        <Text style={styles.step}>Langkah 1 dari 3</Text>
        <Text style={styles.title}>Pelanggan</Text>

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
