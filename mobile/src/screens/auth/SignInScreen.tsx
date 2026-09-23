import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Constants from "expo-constants";
import { Controller, useForm } from "react-hook-form";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import { login } from "../../api/auth";
import { useAuthStore } from "../../auth/useAuthStore";
import AppButton from "../../components/AppButton";
import AppTextField from "../../components/AppTextField";
import SurfaceCard from "../../components/SurfaceCard";
import type { Theme } from "../../theme/tokens";
import { useTheme, useThemedStyles } from "../../theme/useTheme";
import { loginErrorMessage } from "../../utils/errors";

export const signInSchema = z.object({
  username: z.string().trim().min(1, "Username wajib diisi."),
  password: z.string().min(1, "Password wajib diisi."),
});

export type SignInValues = z.infer<typeof signInSchema>;

export default function SignInScreen() {
  const signIn = useAuthStore((state) => state.signIn);
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const [showPassword, setShowPassword] = useState(false);
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
  const wordmarkWidth = Math.min(
    theme.layout.auth.wordmark.width,
    width - theme.layout.auth.gutter * 2
  );
  const wordmarkHeight =
    wordmarkWidth *
    (theme.layout.auth.wordmark.height / theme.layout.auth.wordmark.width);
  const version = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.main}>
            <View style={styles.brand}>
              <Image
                accessibilityLabel="Logo Klinik Sepatu"
                resizeMode="cover"
                source={
                  theme.isDark
                    ? require("../../../assets/splash-icon-dark.png")
                    : require("../../../assets/splash-icon.png")
                }
                style={[styles.wordmark, { width: wordmarkWidth, height: wordmarkHeight }]}
              />
              <View style={styles.titleGroup}>
                <Text style={styles.title}>Masuk ke Klinik Sepatu</Text>
                <Text style={styles.subtitle}>
                  Kelola penerimaan dan pembayaran dengan cepat.
                </Text>
              </View>
            </View>

            <View style={styles.form}>
              <Controller
                control={control}
                name="username"
                render={({ field: { onChange, onBlur, value, ref } }) => (
                  <AppTextField
                    ref={ref}
                    accessibilityLabel="Username"
                    label="USERNAME"
                    placeholder="admin"
                    leading={<UserIcon color={theme.colors.mute} size={theme.layout.icon.action} />}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.username?.message}
                    editable={!pending}
                    returnKeyType="next"
                  />
                )}
              />
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value, ref } }) => (
                  <AppTextField
                    ref={ref}
                    accessibilityLabel="Password"
                    label="KATA SANDI"
                    placeholder="••••••••"
                    leading={<LockIcon color={theme.colors.mute} size={theme.layout.icon.action} />}
                    trailing={
                      <Pressable
                        accessibilityLabel={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                        accessibilityRole="button"
                        accessibilityState={{ selected: showPassword }}
                        disabled={pending}
                        onPress={() => setShowPassword((visible) => !visible)}
                        style={styles.visibilityButton}
                      >
                        <EyeIcon color={theme.colors.mute} size={theme.layout.icon.action} />
                      </Pressable>
                    }
                    secureTextEntry={!showPassword}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.password?.message}
                    editable={!pending}
                    onSubmitEditing={onSubmit}
                    returnKeyType="done"
                  />
                )}
              />

              {loginMutation.isError ? (
                <Text accessibilityRole="alert" style={styles.submitError}>
                  {loginErrorMessage(loginMutation.error)}
                </Text>
              ) : null}

              <AppButton
                fullWidth
                size="large"
                title="Masuk"
                onPress={onSubmit}
                loading={pending}
              />
            </View>

            <SurfaceCard style={styles.sessionCard} variant="muted">
              <ShieldCheckIcon color={theme.colors.mute} size={theme.layout.icon.action} />
              <Text style={styles.sessionText}>
                Sesi dipulihkan otomatis di perangkat ini.
              </Text>
            </SurfaceCard>
          </View>
          <Text style={styles.footer}>KLINIK SEPATU POS • v{version}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = ({ colors, layout, spacing, typography }: Theme) =>
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
      justifyContent: "space-between",
      paddingHorizontal: layout.auth.gutter,
      paddingTop: spacing.xl,
      paddingBottom: spacing.lg,
    },
    main: {
      alignItems: "center",
      width: "100%",
      paddingTop: spacing.lg,
    },
    brand: {
      alignItems: "center",
      width: "100%",
    },
    wordmark: {
      overflow: "hidden",
      marginBottom: spacing.xxl,
    },
    titleGroup: {
      alignItems: "center",
      gap: spacing.xs,
      width: "100%",
    },
    title: {
      ...typography.headingLg,
      color: colors.ink,
      textAlign: "center",
    },
    subtitle: {
      ...typography.body,
      color: colors.mute,
      textAlign: "center",
    },
    form: {
      width: "100%",
      marginTop: spacing.xxl,
      gap: spacing.lg,
    },
    visibilityButton: {
      width: layout.minTouchTarget,
      height: layout.minTouchTarget,
      alignItems: "center",
      justifyContent: "center",
      marginRight: -spacing.sm,
    },
    submitError: {
      ...typography.caption,
      color: colors.danger,
    },
    sessionCard: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      marginTop: spacing.xl,
    },
    sessionText: {
      ...typography.body,
      flex: 1,
      color: colors.mute,
    },
    footer: {
      ...typography.caption,
      color: colors.mute,
      textAlign: "center",
      textTransform: "uppercase",
    },
  });

interface IconProps {
  color: string;
  size: number;
}

function UserIcon({ color, size }: IconProps) {
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          position: "absolute",
          top: size * 0.08,
          left: size * 0.3,
          width: size * 0.4,
          height: size * 0.4,
          borderWidth: 2,
          borderColor: color,
          borderRadius: size,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: size * 0.08,
          left: size * 0.12,
          width: size * 0.76,
          height: size * 0.36,
          borderWidth: 2,
          borderColor: color,
          borderRadius: size,
        }}
      />
    </View>
  );
}

function LockIcon({ color, size }: IconProps) {
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          position: "absolute",
          top: size * 0.36,
          left: size * 0.12,
          width: size * 0.76,
          height: size * 0.5,
          borderWidth: 2,
          borderColor: color,
          borderRadius: size * 0.12,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: size * 0.08,
          left: size * 0.28,
          width: size * 0.44,
          height: size * 0.46,
          borderWidth: 2,
          borderColor: color,
          borderBottomWidth: 0,
          borderTopLeftRadius: size,
          borderTopRightRadius: size,
        }}
      />
    </View>
  );
}

function EyeIcon({ color, size }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: size * 0.9,
          height: size * 0.56,
          borderWidth: 2,
          borderColor: color,
          borderRadius: size,
        }}
      >
        <View
          style={{
            alignSelf: "center",
            width: size * 0.24,
            height: size * 0.24,
            marginTop: size * 0.14,
            borderRadius: size,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}

function ShieldCheckIcon({ color, size }: IconProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: color,
        borderRadius: size * 0.25,
      }}
    >
      <View
        style={{
          width: size * 0.34,
          height: size * 0.18,
          borderLeftWidth: 2,
          borderBottomWidth: 2,
          borderColor: color,
          transform: [{ rotate: "-45deg" }, { translateY: -size * 0.04 }],
        }}
      />
    </View>
  );
}
