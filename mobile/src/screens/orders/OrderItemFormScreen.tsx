import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import AppButton from "../../components/AppButton";
import AppTextField from "../../components/AppTextField";
import ScreenHeader from "../../components/ScreenHeader";
import type { AppStackParamList } from "../../navigation/types";
import {
  useOrderWizardStore,
  type WizardItemInput,
} from "../../order/orderWizardStore";
import type { Theme } from "../../theme/tokens";
import { useThemedStyles } from "../../theme/useTheme";

type Navigation = NativeStackNavigationProp<AppStackParamList, "OrderItemForm">;
type Route = RouteProp<AppStackParamList, "OrderItemForm">;

export const orderItemSchema = z.object({
  brand: z.string().trim().min(1, "Merek wajib diisi."),
  shoeType: z.string().trim().min(1, "Jenis sepatu wajib diisi."),
  model: z.string().trim().max(100, "Maksimal 100 karakter."),
  color: z.string().trim().max(50, "Maksimal 50 karakter."),
  customerNote: z.string().trim().max(1000, "Maksimal 1000 karakter."),
});

export type OrderItemFormValues = z.infer<typeof orderItemSchema>;

const BLANK_ITEM: OrderItemFormValues = {
  brand: "",
  shoeType: "",
  model: "",
  color: "",
  customerNote: "",
};

export default function OrderItemFormScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const styles = useThemedStyles(createStyles);
  const itemId = route.params?.itemId;
  const existing = useOrderWizardStore((state) =>
    state.items.find((item) => item.id === itemId)
  );
  const addItem = useOrderWizardStore((state) => state.addItem);
  const updateItem = useOrderWizardStore((state) => state.updateItem);

  useEffect(() => {
    navigation.setOptions({
      title: itemId ? "Ubah Sepatu" : "Tambah Sepatu",
    });
  }, [itemId, navigation]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OrderItemFormValues>({
    resolver: zodResolver(orderItemSchema),
    defaultValues: existing
      ? {
          brand: existing.brand,
          shoeType: existing.shoeType,
          model: existing.model,
          color: existing.color,
          customerNote: existing.customerNote,
        }
      : BLANK_ITEM,
  });

  const onSubmit = handleSubmit((values) => {
    const input: WizardItemInput = {
      brand: values.brand.trim(),
      shoeType: values.shoeType.trim(),
      model: values.model.trim(),
      color: values.color.trim(),
      customerNote: values.customerNote.trim(),
    };

    if (itemId) {
      updateItem(itemId, input);
    } else {
      addItem(input);
    }
    navigation.goBack();
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScreenHeader
        title={itemId ? "Ubah sepatu" : "Tambah sepatu"}
        onBack={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Controller
            control={control}
            name="brand"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <AppTextField
                ref={ref}
                label="Merek"
                placeholder="cth: Nike"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.brand?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="model"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <AppTextField
                ref={ref}
                label="Model / nama"
                placeholder="cth: Air Max 90"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.model?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="color"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <AppTextField
                ref={ref}
                label="Warna"
                placeholder="cth: Putih"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.color?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="shoeType"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <AppTextField
                ref={ref}
                label="Jenis sepatu"
                placeholder="cth: Sneakers"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.shoeType?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="customerNote"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <AppTextField
                ref={ref}
                label="Catatan"
                placeholder="cth: Ada noda di bagian tumit"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.customerNote?.message}
                multiline
                numberOfLines={3}
                style={styles.noteInput}
              />
            )}
          />

          <AppButton title="Simpan" onPress={onSubmit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = ({ colors, spacing }: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    flex: {
      flex: 1,
    },
    content: {
      padding: spacing.xl,
      gap: spacing.lg,
    },
    noteInput: {
      height: 88,
      textAlignVertical: "top",
      paddingTop: spacing.md,
    },
  });
