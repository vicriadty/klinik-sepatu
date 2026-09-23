import { type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import type { Theme } from "../theme/tokens";
import { useThemedStyles } from "../theme/useTheme";

export type PillTone = "neutral" | "info" | "warning" | "success" | "danger";

interface StatusPillProps {
  label: string;
  tone: PillTone;
  icon?: ReactNode;
  appearance?: "filled" | "outline";
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function StatusPill({
  label,
  tone,
  icon,
  appearance = "filled",
  compact = false,
  style,
}: StatusPillProps) {
  const styles = useThemedStyles(createStyles);
  const toneStyle = {
    neutral: {
      text: styles.neutralText,
      filled: styles.neutralFilled,
      outline: styles.neutralOutline,
    },
    info: { text: styles.infoText, filled: styles.infoFilled, outline: styles.infoOutline },
    warning: {
      text: styles.warningText,
      filled: styles.warningFilled,
      outline: styles.warningOutline,
    },
    success: {
      text: styles.successText,
      filled: styles.successFilled,
      outline: styles.successOutline,
    },
    danger: { text: styles.dangerText, filled: styles.dangerFilled, outline: styles.dangerOutline },
  }[tone];

  return (
    <View
      accessibilityLabel={label}
      style={[
        styles.pill,
        styles[appearance],
        compact && styles.compact,
        appearance === "filled" && toneStyle.filled,
        appearance === "outline" && toneStyle.outline,
        style,
      ]}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.label, compact && styles.compactLabel, toneStyle.text]}>
        {label}
      </Text>
    </View>
  );
}

const createStyles = ({ colors, layout, radius, spacing, typography }: Theme) =>
  StyleSheet.create({
    pill: {
      minHeight: layout.statusPillHeight,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      borderRadius: radius.full,
      borderWidth: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xxs,
      alignSelf: "flex-start",
    },
    filled: {
      borderColor: "transparent",
    },
    outline: {
      backgroundColor: "transparent",
    },
    compact: {
      minHeight: layout.statusPillHeight - spacing.xs,
      paddingHorizontal: spacing.sm,
    },
    label: {
      ...typography.caption,
    },
    compactLabel: {},
    icon: {
      alignItems: "center",
      justifyContent: "center",
    },
    neutralText: { color: colors.mute },
    neutralFilled: { backgroundColor: colors.bone, borderColor: "transparent" },
    neutralOutline: { borderColor: colors.hairline },
    infoText: { color: colors.link },
    infoFilled: { backgroundColor: colors.infoSurface, borderColor: "transparent" },
    infoOutline: { borderColor: colors.link },
    warningText: { color: colors.warningText },
    warningFilled: { backgroundColor: colors.warningSurface, borderColor: "transparent" },
    warningOutline: { borderColor: colors.warning },
    successText: { color: colors.success },
    successFilled: { backgroundColor: colors.successSurface, borderColor: "transparent" },
    successOutline: { borderColor: colors.success },
    dangerText: { color: colors.danger },
    dangerFilled: { backgroundColor: colors.warningSurface, borderColor: "transparent" },
    dangerOutline: { borderColor: colors.danger },
  });
