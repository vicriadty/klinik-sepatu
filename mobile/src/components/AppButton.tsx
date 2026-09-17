import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import type { Theme } from "../theme/tokens";
import { useTheme, useThemedStyles } from "../theme/useTheme";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface AppButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
}

export default function AppButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
}: AppButtonProps) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const isDisabled = disabled || loading;
  const showDisabled = disabled && !loading;

  const spinnerColor =
    variant === "primary" || variant === "danger"
      ? theme.colors.onPrimary
      : theme.colors.ink;
  const pressedStyle =
    variant === "primary"
      ? styles.primaryPressed
      : variant === "danger"
        ? styles.dangerPressed
        : styles.neutralPressed;
  const labelStyle =
    variant === "primary" || variant === "danger"
      ? styles.primaryLabel
      : styles.neutralLabel;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !isDisabled && pressedStyle,
        showDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text
          style={[styles.label, labelStyle, showDisabled && styles.disabledLabel]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const createStyles = ({
  colors,
  radius,
  spacing,
  typography,
}: Theme) =>
  StyleSheet.create({
    base: {
      height: 44,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.xl,
    },
    primary: {
      backgroundColor: colors.primary,
    },
    secondary: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    ghost: {
      backgroundColor: "transparent",
    },
    danger: {
      backgroundColor: colors.danger,
    },
    primaryPressed: {
      backgroundColor: colors.primaryPressed,
    },
    dangerPressed: {
      opacity: 0.85,
    },
    neutralPressed: {
      backgroundColor: colors.bone,
    },
    disabled: {
      backgroundColor: colors.disabledSurface,
      borderColor: colors.hairline,
    },
    label: {
      ...typography.button,
    },
    primaryLabel: {
      color: colors.onPrimary,
    },
    neutralLabel: {
      color: colors.ink,
    },
    disabledLabel: {
      color: colors.disabledText,
    },
  });
