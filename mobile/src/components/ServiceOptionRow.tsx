import { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import type { Theme } from "../theme/tokens";
import { useThemedStyles } from "../theme/useTheme";

interface ServiceOptionRowProps {
  title: string;
  description?: string;
  price?: string;
  duration?: string;
  selected?: boolean;
  disabled?: boolean;
  leading?: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function ServiceOptionRow({
  title,
  description,
  price,
  duration,
  selected = false,
  disabled = false,
  leading,
  onPress,
  style,
}: ServiceOptionRowProps) {
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
      <View style={[styles.selector, selected && styles.selectorSelected]}>
        {selected ? <View style={styles.selectorDot} /> : null}
      </View>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
        {duration ? <Text style={styles.duration}>{duration}</Text> : null}
      </View>
      {price ? <Text style={styles.price}>{price}</Text> : null}
    </Pressable>
  );
}

const createStyles = ({ colors, layout, radius, spacing, typography }: Theme) =>
  StyleSheet.create({
    container: {
      minHeight: layout.serviceRowHeight,
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
      borderColor: colors.hairline,
    },
    pressed: {
      opacity: 0.75,
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
    },
    selectorDot: {
      width: layout.icon.inline - spacing.xs,
      height: layout.icon.inline - spacing.xs,
      borderRadius: radius.full,
      backgroundColor: colors.link,
    },
    leading: {
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
    duration: {
      ...typography.caption,
      color: colors.stone,
    },
    price: {
      ...typography.bodyUi,
      color: colors.ink,
    },
  });
