import { type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import type { Theme } from "../theme/tokens";
import { useTheme, useThemedStyles } from "../theme/useTheme";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "link";
export type ButtonSize = "compact" | "standard" | "large";

interface AppButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

export default function AppButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  size = "standard",
  fullWidth = false,
  leftIcon,
  rightIcon,
  accessibilityLabel,
  style,
  labelStyle,
}: AppButtonProps) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const isDisabled = disabled || loading;
  const showDisabled = disabled && !loading;

  const spinnerColor =
    variant === "primary" || variant === "danger"
      ? theme.colors.onPrimary
      : variant === "link"
        ? theme.colors.link
        : theme.colors.ink;
  const pressedStyle =
    variant === "primary"
      ? styles.primaryPressed
      : variant === "danger"
        ? styles.dangerPressed
      : variant === "link"
        ? styles.linkPressed
        : styles.neutralPressed;
  const variantLabelStyle =
    variant === "primary" || variant === "danger"
      ? styles.primaryLabel
      : variant === "link"
        ? styles.linkLabel
        : styles.neutralLabel;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        fullWidth && styles.fullWidth,
        styles[variant],
        pressed && !isDisabled && pressedStyle,
        showDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <View style={styles.content}>
          {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
          <Text
            style={[styles.label, variantLabelStyle, showDisabled && styles.disabledLabel, labelStyle]}
          >
            {title}
          </Text>
          {rightIcon ? <View style={styles.icon}>{rightIcon}</View> : null}
        </View>
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
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.xl,
    },
    compact: {
      minHeight: 36,
      paddingHorizontal: spacing.lg,
    },
    standard: {
      minHeight: 48,
    },
    large: {
      minHeight: 50,
      paddingHorizontal: spacing.xxl,
    },
    fullWidth: {
      width: "100%",
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
    link: {
      minWidth: 0,
      backgroundColor: "transparent",
      paddingHorizontal: spacing.xs,
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
    linkPressed: {
      backgroundColor: colors.infoSurface,
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
    linkLabel: {
      color: colors.link,
    },
    disabledLabel: {
      color: colors.disabledText,
    },
    content: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
    },
    icon: {
      alignItems: "center",
      justifyContent: "center",
    },
  });
