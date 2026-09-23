import { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import type { Theme } from "../theme/tokens";
import { useThemedStyles } from "../theme/useTheme";

interface PaymentMethodRowProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function PaymentMethodRow({
  title,
  description,
  icon,
  selected = false,
  disabled = false,
  onPress,
  style,
}: PaymentMethodRowProps) {
  const styles = useThemedStyles(createStyles);
  const interactive = Boolean(onPress) && !disabled;

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ disabled, selected }}
      disabled={!interactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        selected && styles.selected,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <View style={[styles.selector, selected && styles.selectorSelected]}>
        {selected ? <Text style={styles.check}>✓</Text> : null}
      </View>
    </Pressable>
  );
}

const createStyles = ({ colors, layout, radius, spacing, typography }: Theme) =>
  StyleSheet.create({
    container: {
      minHeight: layout.controlHeight,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      borderWidth: 1,
      borderColor: colors.divider,
      borderRadius: radius.card,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface,
    },
    selected: {
      borderColor: colors.link,
      backgroundColor: colors.infoSurface,
    },
    disabled: {
      backgroundColor: colors.disabledSurface,
    },
    pressed: {
      opacity: 0.75,
    },
    icon: {
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      flex: 1,
      gap: spacing.xxs,
    },
    title: {
      ...typography.bodyUi,
      color: colors.ink,
    },
    description: {
      ...typography.caption,
      color: colors.mute,
    },
    selector: {
      width: layout.icon.action,
      height: layout.icon.action,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.full,
    },
    selectorSelected: {
      borderColor: colors.link,
      backgroundColor: colors.link,
    },
    check: {
      color: colors.onBrand,
      ...typography.caption,
    },
  });
