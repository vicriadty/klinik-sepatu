import { type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { Theme } from "../theme/tokens";
import { useThemedStyles } from "../theme/useTheme";

export type SummaryCardTone = "default" | "success" | "warning";

interface SummaryCardProps {
  label: string;
  value: string;
  highlight?: boolean;
  icon?: ReactNode;
  tone?: SummaryCardTone;
}

export default function SummaryCard({
  label,
  value,
  highlight = false,
  icon,
  tone = "default",
}: SummaryCardProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.card, highlight && styles.highlight]}>
      <Text style={styles.value}>{value}</Text>
      <Text
        style={[
          styles.label,
          tone === "success" && styles.successLabel,
          tone === "warning" && styles.warningLabel,
        ]}
      >
        {label}
      </Text>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
    </View>
  );
}

const createStyles = ({
  colors,
  radius,
  spacing,
  typography,
}: Theme) =>
  StyleSheet.create({
    card: {
      flex: 1,
      minWidth: "45%",
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      gap: spacing.xs,
      minHeight: 78,
    },
    highlight: {
      borderColor: colors.warning,
    },
    label: {
      ...typography.caption,
      color: colors.mute,
    },
    value: {
      ...typography.headingLg,
      color: colors.ink,
    },
    successLabel: {
      color: colors.success,
    },
    warningLabel: {
      color: colors.warning,
    },
    icon: {
      position: "absolute",
      top: spacing.md,
      right: spacing.lg,
    },
  });
