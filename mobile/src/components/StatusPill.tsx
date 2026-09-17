import { StyleSheet, Text, View } from "react-native";
import type { Theme } from "../theme/tokens";
import { useThemedStyles } from "../theme/useTheme";

export type PillTone = "neutral" | "info" | "warning" | "success" | "danger";

interface StatusPillProps {
  label: string;
  tone: PillTone;
}

export default function StatusPill({ label, tone }: StatusPillProps) {
  const styles = useThemedStyles(createStyles);
  const toneColor = {
    neutral: styles.neutral,
    info: styles.info,
    warning: styles.warning,
    success: styles.success,
    danger: styles.danger,
  }[tone];

  return (
    <View style={styles.pill}>
      <Text style={[styles.label, toneColor]}>{label}</Text>
    </View>
  );
}

const createStyles = ({ colors, radius, spacing, typography }: Theme) =>
  StyleSheet.create({
    pill: {
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.bone,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xxs,
      alignSelf: "flex-start",
    },
    label: {
      ...typography.caption,
    },
    neutral: { color: colors.mute },
    info: { color: colors.link },
    warning: { color: colors.warning },
    success: { color: colors.success },
    danger: { color: colors.danger },
  });
