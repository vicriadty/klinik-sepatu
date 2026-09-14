import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
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
import { login } from "../../api/auth";
import { useAuthStore } from "../../auth/useAuthStore";
import AppButton from "../../components/AppButton";
import AppTextField from "../../components/AppTextField";
import type { Theme } from "../../theme/tokens";
import { useThemedStyles } from "../../theme/useTheme";
import { loginErrorMessage } from "../../utils/errors";

export const signInSchema = z.object({
  username: z.string().trim().min(1, "Username wajib diisi."),
  password: z.string().min(1, "Password wajib diisi."),
});

export type SignInValues = z.infer<typeof signInSchema>;

export default function SignInScreen() {
  const signIn = useAuthStore((state) => state.signIn);
  const styles = useThemedStyles(createStyles);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { username: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: (values: SignInValues) =>
      login(values.username.trim(), values.password),
    onSuccess: (result) => signIn(result.user, result.token),
  });

  const onSubmit = handleSubmit((values) => {
    if (loginMutation.isPending) return;
    loginMutation.mutate(values);
  });

  const pending = loginMutation.isPending;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Masuk</Text>
          <Text style={styles.subtitle}>
            Masuk ke aplikasi kasir Klinik Sepatu.
          </Text>

          <View style={styles.form}>
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value, ref } }) => (
                <AppTextField
                  ref={ref}
                  label="Username"
                  placeholder="cth: kasir1"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.username?.message}
                  editable={!pending}
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value, ref } }) => (
                <AppTextField
                  ref={ref}
                  label="Password"
                  placeholder="Masukkan password"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  editable={!pending}
                  onSubmitEditing={onSubmit}
                />
              )}
            />

            {loginMutation.isError ? (
              <Text style={styles.submitError}>
                {loginErrorMessage(loginMutation.error)}
              </Text>
            ) : null}

            <AppButton title="Masuk" onPress={onSubmit} loading={pending} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = ({ colors, spacing, typography }: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    flex: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      justifyContent: "center",
      padding: spacing.xl,
      gap: spacing.xs,
    },
    title: {
      ...typography.headingSm,
      color: colors.ink,
    },
    subtitle: {
      ...typography.body,
      color: colors.mute,
    },
    form: {
      marginTop: spacing.xl,
      gap: spacing.lg,
    },
    submitError: {
      ...typography.caption,
      color: colors.danger,
    },
  });
