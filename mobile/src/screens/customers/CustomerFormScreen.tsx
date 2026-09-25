import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import { useTheme, useThemedStyles } from "../../theme/useTheme";
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

type FormIconName = "back" | "user" | "phone" | "alert";

function FormIcon({
  name,
  color,
  size = 18,
}: {
  name: FormIconName;
  color: string;
  size?: number;
}) {
  if (name === "back") {
    return (
      <View
        pointerEvents="none"
        style={[iconStyles.base, { width: size, height: size }]}
      >
        <View
          style={[
            iconStyles.line,
            { top: size / 2, left: 2, width: size - 4, backgroundColor: color },
          ]}
        />
        <View
          style={[
            iconStyles.line,
            {
              top: size / 2 - 1,
              left: 2,
              width: size * 0.45,
              backgroundColor: color,
              transform: [{ rotate: "-45deg" }],
            },
          ]}
        />
        <View
          style={[
            iconStyles.line,
            {
              top: size / 2 + size * 0.28,
              left: 2,
              width: size * 0.45,
              backgroundColor: color,
              transform: [{ rotate: "45deg" }],
            },
          ]}
        />
      </View>
    );
  }

  if (name === "user") {
    return (
      <View
        pointerEvents="none"
        style={[iconStyles.base, { width: size, height: size }]}
      >
        <View
          style={[
            iconStyles.personHead,
            {
              width: size * 0.35,
              height: size * 0.35,
              left: size * 0.325,
              borderColor: color,
              borderRadius: size,
            },
          ]}
        />
        <View
          style={[
            iconStyles.personBody,
            {
              width: size * 0.7,
              height: size * 0.35,
              left: size * 0.15,
              borderColor: color,
              borderRadius: size,
            },
          ]}
        />
      </View>
    );
  }

  if (name === "phone") {
    return (
      <View
        pointerEvents="none"
        style={[iconStyles.base, { width: size, height: size }]}
      >
        <View
          style={[
            iconStyles.phoneFrame,
            {
              width: size * 0.56,
              height: size * 0.78,
              left: size * 0.22,
              top: size * 0.11,
              borderColor: color,
              borderRadius: size * 0.16,
            },
          ]}
        />
        <View
          style={[
            iconStyles.phoneSpeaker,
            { left: size * 0.42, top: size * 0.2, backgroundColor: color },
          ]}
        />
        <View
          style={[
            iconStyles.phoneSpeaker,
            { left: size * 0.42, top: size * 0.72, backgroundColor: color },
          ]}
        />
      </View>
    );
  }

  return (
    <View
      pointerEvents="none"
      style={[iconStyles.base, { width: size, height: size }]}
    >
      <View
        style={[
          iconStyles.alertCircle,
          { width: size, height: size, borderColor: color, borderRadius: size },
        ]}
      />
      <View
        style={[
          iconStyles.alertLine,
          { left: size / 2 - 1, top: size * 0.22, backgroundColor: color },
        ]}
      />
      <View
        style={[
          iconStyles.alertDot,
          { left: size / 2 - 1, top: size * 0.72, backgroundColor: color },
        ]}
      />
    </View>
  );
}

function formatNormalizedPhone(phone: string) {
  const local = phone.slice(2);
  const groups = [local.slice(0, 3), local.slice(3, 7), local.slice(7)].filter(
    Boolean
  );
  return `+62 ${groups.join(" ")}`;
}

export default function CustomerFormScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const theme = useTheme();
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

  const openExistingCustomer = () => {
    if (!duplicate) return;
    navigation.navigate("Customers", {
      search: duplicate.phone,
      ...(selectMode ? { select: true } : {}),
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kembali"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <FormIcon name="back" color={theme.colors.ink} size={20} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Pelanggan baru</Text>
            <Text style={styles.subtitle}>Data pelanggan</Text>
          </View>
        </View>

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
                label="NAMA"
                placeholder="cth: Budi Santoso"
                leading={<FormIcon name="user" color={theme.colors.mute} />}
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
                label="NOMOR HP"
                placeholder="cth: 0812-3456-7890"
                keyboardType="phone-pad"
                leading={<FormIcon name="phone" color={theme.colors.mute} />}
                inputContainerStyle={duplicate ? styles.duplicateInput : undefined}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.phone?.message}
                editable={!pending}
              />
            )}
          />

          {duplicate ? (
            <View style={styles.duplicate}>
              <FormIcon name="alert" color={theme.colors.warning} size={18} />
              <View style={styles.duplicateCopy}>
                <Text style={styles.duplicateTitle}>Nomor sudah terdaftar.</Text>
                <Text style={styles.duplicateBody}>
                  {duplicate.name} · {duplicate.phone_display}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cari pelanggan ini"
                onPress={openExistingCustomer}
                style={styles.duplicateAction}
              >
                <Text style={styles.duplicateActionText}>Gunakan yang ada</Text>
              </Pressable>
            </View>
          ) : null}

          {normalizedPhone ? (
            <View style={styles.previewCard}>
              <Text style={styles.previewLabel}>FORMAT TERSIMPAN</Text>
              <Text style={styles.previewValue}>
                {formatNormalizedPhone(normalizedPhone)}
              </Text>
            </View>
          ) : null}

          {submitError ? (
            <Text style={styles.submitError}>{submitError}</Text>
          ) : null}

          <Text style={styles.serverNote}>
            Server memvalidasi format dan keunikan nomor.
          </Text>

          <View style={styles.actions}>
            <AppButton
              title="Simpan pelanggan"
              accessibilityLabel="Simpan"
              onPress={onSubmit}
              loading={pending}
              fullWidth
            />
            <AppButton
              title="Batal"
              accessibilityLabel="Batal"
              variant="ghost"
              size="compact"
              onPress={() => navigation.goBack()}
              fullWidth
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = ({
  colors,
  layout,
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
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingTop: layout.statusBarHeight + spacing.md,
      paddingHorizontal: layout.screen.gutter,
    },
    backButton: {
      width: 24,
      height: 28,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.md,
      marginTop: spacing.xxs,
    },
    headerCopy: {
      flex: 1,
      gap: spacing.xxs,
    },
    title: {
      ...typography.screenTitle,
      color: colors.ink,
    },
    subtitle: {
      ...typography.caption,
      color: colors.mute,
      fontWeight: "400",
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: layout.screen.gutter,
      paddingTop: spacing.xxxl,
      paddingBottom: spacing.xl,
      gap: spacing.lg,
    },
    duplicateInput: {
      borderColor: colors.danger,
    },
    duplicate: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.warning,
      borderRadius: radius.sm,
      backgroundColor: colors.warningSurface,
    },
    duplicateCopy: {
      flex: 1,
      gap: spacing.xxs,
    },
    duplicateTitle: {
      ...typography.caption,
      color: colors.warningText,
    },
    duplicateBody: {
      ...typography.overline,
      color: colors.warningText,
      fontWeight: "400",
    },
    duplicateAction: {
      minHeight: 36,
      justifyContent: "center",
      paddingLeft: spacing.xs,
    },
    duplicateActionText: {
      ...typography.overline,
      color: colors.warningText,
      textAlign: "right",
    },
    previewCard: {
      minHeight: 56,
      justifyContent: "center",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.md,
      backgroundColor: colors.card,
      gap: spacing.xs,
    },
    previewLabel: {
      ...typography.overline,
      color: colors.stone,
      letterSpacing: 0.6,
    },
    previewValue: {
      ...typography.caption,
      color: colors.ink,
    },
    submitError: {
      ...typography.caption,
      color: colors.danger,
    },
    serverNote: {
      ...typography.overline,
      color: colors.mute,
      fontWeight: "400",
    },
    actions: {
      marginTop: "auto",
      paddingTop: spacing.xxl,
      gap: spacing.sm,
    },
  });

const iconStyles = StyleSheet.create({
  base: {
    position: "relative",
  },
  line: {
    position: "absolute",
    height: 1.5,
  },
  personHead: {
    position: "absolute",
    top: 1,
    borderWidth: 1.5,
  },
  personBody: {
    position: "absolute",
    bottom: 1,
    borderWidth: 1.5,
  },
  phoneFrame: {
    position: "absolute",
    borderWidth: 1.5,
  },
  phoneSpeaker: {
    position: "absolute",
    width: 2,
    height: 2,
    borderRadius: 2,
  },
  alertCircle: {
    position: "absolute",
    borderWidth: 1.5,
  },
  alertLine: {
    position: "absolute",
    width: 2,
    height: 6,
    borderRadius: 2,
  },
  alertDot: {
    position: "absolute",
    width: 2,
    height: 2,
    borderRadius: 2,
  },
});
