import { type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
} from "react-native";
import type {
  AccessibilityRole,
  StyleProp,
  ViewStyle,
} from "react-native";
import type { Theme } from "../theme/tokens";
import { useThemedStyles } from "../theme/useTheme";

export type SurfaceCardVariant = "default" | "compact" | "muted" | "dark" | "flat";

interface SurfaceCardProps {
  children: ReactNode;
  variant?: SurfaceCardVariant;
  onPress?: (event: GestureResponderEvent) => void;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  style?: StyleProp<ViewStyle>;
}

export default function SurfaceCard({
  children,
  variant = "default",
  onPress,
  accessibilityLabel,
  accessibilityRole,
  style,
}: SurfaceCardProps) {
  const styles = useThemedStyles(createStyles);
  const cardStyle = [styles.base, styles[variant], style];

  if (onPress) {
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole ?? "button"}
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View accessibilityLabel={accessibilityLabel} style={cardStyle}>
      {children}
    </View>
  );
}

const createStyles = ({ colors, radius, shadows, spacing }: Theme) =>
  StyleSheet.create({
    base: {
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.divider,
      backgroundColor: colors.surface,
      padding: spacing.lg,
      ...shadows.none,
    },
    default: {},
    compact: {
      padding: spacing.md,
    },
    muted: {
      borderColor: "transparent",
      backgroundColor: colors.bone,
    },
    dark: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    flat: {
      borderColor: "transparent",
      backgroundColor: "transparent",
      padding: 0,
    },
    pressed: {
      opacity: 0.78,
    },
  });
