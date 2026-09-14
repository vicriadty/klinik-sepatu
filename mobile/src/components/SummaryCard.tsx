import { StyleSheet, Text, View } from "react-native";
import type { Theme } from "../theme/tokens";
import { useThemedStyles } from "../theme/useTheme";

interface SummaryCardProps {
  label: string;
  value: string;
  highlight?: boolean;
}

export default function SummaryCard({
  label,
  value,
  highlight = false,
}: SummaryCardProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.card, highlight && styles.highlight]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
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
      padding: spacing.lg,
      gap: spacing.sm,
    },
    highlight: {
      borderColor: colors.warning,
    },
    label: {
      ...typography.caption,
      color: colors.mute,
    },
    value: {
      ...typography.title,
      color: colors.ink,
    },
  });
