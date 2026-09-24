import { type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import type { Theme } from "../theme/tokens";
import { useThemedStyles } from "../theme/useTheme";

export type PillTone = "neutral" | "info" | "warning" | "success" | "danger" | "dark";

interface StatusPillProps {
  label: string;
  tone: PillTone;
  icon?: ReactNode;
  appearance?: "filled" | "outline" | "solid" | "text";
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
      solidText: styles.solidText,
      filled: styles.neutralFilled,
      outline: styles.neutralOutline,
      solid: styles.neutralSolid,
    },
    info: {
      text: styles.infoText,
      solidText: styles.solidText,
      filled: styles.infoFilled,
      outline: styles.infoOutline,
      solid: styles.infoSolid,
    },
    warning: {
      text: styles.warningText,
      solidText: styles.solidText,
      filled: styles.warningFilled,
      outline: styles.warningOutline,
      solid: styles.warningSolid,
    },
    success: {
      text: styles.successText,
      solidText: styles.solidText,
      filled: styles.successFilled,
      outline: styles.successOutline,
      solid: styles.successSolid,
    },
    danger: {
      text: styles.dangerText,
      solidText: styles.solidText,
      filled: styles.dangerFilled,
      outline: styles.dangerOutline,
      solid: styles.dangerSolid,
    },
    dark: {
      text: styles.darkText,
      solidText: styles.solidText,
      filled: styles.darkFilled,
      outline: styles.darkOutline,
      solid: styles.darkSolid,
    },
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
        appearance === "solid" && toneStyle.solid,
        style,
      ]}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text
        style={[
          styles.label,
          compact && styles.compactLabel,
          appearance === "solid" ? toneStyle.solidText : toneStyle.text,
        ]}
      >
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
    solid: {
      borderColor: "transparent",
    },
    text: {
      minHeight: 0,
      borderWidth: 0,
      paddingHorizontal: 0,
      paddingVertical: 0,
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
    neutralSolid: { backgroundColor: colors.stone },
    infoText: { color: colors.link },
    infoFilled: { backgroundColor: colors.infoSurface, borderColor: "transparent" },
    infoOutline: { borderColor: colors.link },
    infoSolid: { backgroundColor: colors.link },
    warningText: { color: colors.warningText },
    warningFilled: { backgroundColor: colors.warningSurface, borderColor: "transparent" },
    warningOutline: { borderColor: colors.warning },
    warningSolid: { backgroundColor: colors.warning },
    successText: { color: colors.success },
    successFilled: { backgroundColor: colors.successSurface, borderColor: "transparent" },
    successOutline: { borderColor: colors.success },
    successSolid: { backgroundColor: colors.success },
    dangerText: { color: colors.danger },
    dangerFilled: { backgroundColor: colors.warningSurface, borderColor: "transparent" },
    dangerOutline: { borderColor: colors.danger },
    dangerSolid: { backgroundColor: colors.danger },
    darkText: { color: colors.ink },
    darkFilled: { backgroundColor: colors.bone, borderColor: "transparent" },
    darkOutline: { borderColor: colors.ink },
    darkSolid: { backgroundColor: colors.primary },
    solidText: { color: colors.onPrimary },
  });
