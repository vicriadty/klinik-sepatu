import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import {
  createCustomer,
  duplicateCustomerFrom,
  type ApiCustomer,
} from "../../api/customers";
import AppButton from "../../components/AppButton";
import AppTextField from "../../components/AppTextField";
import type { AppStackParamList } from "../../navigation/types";
import { useOrderWizardStore } from "../../order/orderWizardStore";
import type { Theme } from "../../theme/tokens";
import { useThemedStyles } from "../../theme/useTheme";
import { apiErrorMessage } from "../../utils/errors";
import { normalizePhone } from "../../utils/phone";

type Navigation = NativeStackNavigationProp<AppStackParamList, "CustomerForm">;
type Route = RouteProp<AppStackParamList, "CustomerForm">;

export const customerSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi."),
  phone: z
    .string()
    .trim()
    .min(1, "Nomor telepon wajib diisi.")
    .refine(
      (value) => normalizePhone(value) !== null,
      "Nomor tidak valid. Gunakan format Indonesia (cth: 0812…)."
    ),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

export default function CustomerFormScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const queryClient = useQueryClient();
  const styles = useThemedStyles(createStyles);
  const selectMode = route.params?.select === true;
  const setWizardCustomer = useOrderWizardStore((state) => state.setCustomer);
  const [duplicate, setDuplicate] = useState<ApiCustomer | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: "", phone: "" },
  });

  const phoneValue = watch("phone");
  const normalizedPhone = normalizePhone(phoneValue);

  const createMutation = useMutation({
    mutationFn: (values: CustomerFormValues) =>
      createCustomer({
        name: values.name.trim(),
        phone: normalizePhone(values.phone) as string,
      }),
    onSuccess: (customer) => {
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      if (selectMode) {
        setWizardCustomer(customer);
        navigation.navigate("OrderCustomer");
        return;
      }
      navigation.navigate("Customers", {
        created: customer.name,
        search: customer.phone,
      });
    },
    onError: (error: unknown) => {
      const existing = duplicateCustomerFrom(error);
      if (existing) {
        setDuplicate(existing);
        return;
      }
      setSubmitError(apiErrorMessage(error, "Gagal menyimpan pelanggan."));
    },
  });

  const onSubmit = handleSubmit((values) => {
    if (createMutation.isPending) return;
    setDuplicate(null);
    setSubmitError(null);
    createMutation.mutate(values);
  });

  const pending = createMutation.isPending;

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
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
            name="name"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <AppTextField
                ref={ref}
                label="Nama"
                placeholder="cth: Budi Santoso"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
                editable={!pending}
              />
            )}
          />
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <AppTextField
                ref={ref}
                label="Nomor telepon"
                placeholder="cth: 0812-3456-7890"
                keyboardType="phone-pad"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.phone?.message}
                editable={!pending}
              />
            )}
          />

          {phoneValue.trim() !== "" && !errors.phone ? (
            <Text style={styles.preview}>
              {normalizedPhone
                ? `Nomor tersimpan: ${"+".concat(normalizedPhone)}`
                : "Nomor belum valid."}
            </Text>
          ) : null}

          {duplicate ? (
            <View style={styles.duplicate}>
              <Text style={styles.duplicateTitle}>
                Nomor sudah terdaftar
              </Text>
              <Text style={styles.duplicateBody}>
                {duplicate.name} · {duplicate.phone_display}
              </Text>
              <AppButton
                title="Cari pelanggan ini"
                variant="secondary"
                onPress={() =>
                  navigation.navigate("Customers", {
                    search: duplicate.phone,
                    ...(selectMode ? { select: true } : {}),
                  })
                }
              />
            </View>
          ) : null}

          {submitError ? (
            <Text style={styles.submitError}>{submitError}</Text>
          ) : null}

          <AppButton title="Simpan" onPress={onSubmit} loading={pending} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = ({
  colors,
  radius,
  spacing,
  typography,
}: Theme) =>
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
    preview: {
      ...typography.caption,
      color: colors.mute,
    },
    duplicate: {
      borderRadius: radius.lg,
      backgroundColor: colors.bone,
      borderLeftWidth: 3,
      borderLeftColor: colors.ink,
      padding: spacing.lg,
      gap: spacing.md,
    },
    duplicateTitle: {
      ...typography.subtitle,
      color: colors.ink,
    },
    duplicateBody: {
      ...typography.body,
      color: colors.mute,
    },
    submitError: {
      ...typography.caption,
      color: colors.danger,
    },
  });
