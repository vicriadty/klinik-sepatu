import { StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import SurfaceCard from "./SurfaceCard";
import type { Theme } from "../theme/tokens";
import { useThemedStyles } from "../theme/useTheme";

export type PriceBreakdownTone = "default" | "success" | "danger";

export interface PriceBreakdownRow {
  label: string;
  value: string;
  tone?: PriceBreakdownTone;
}

interface PriceBreakdownProps {
  rows: readonly PriceBreakdownRow[];
  totalLabel?: string;
  totalValue: string;
  note?: string;
  style?: StyleProp<ViewStyle>;
}

export default function PriceBreakdown({
  rows,
  totalLabel = "Total",
  totalValue,
  note,
  style,
}: PriceBreakdownProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <SurfaceCard style={style} variant="compact">
      <View style={styles.rows}>
        {rows.map((row, index) => (
          <View key={`${row.label}-${index}`} style={styles.row}>
            <Text style={styles.label}>{row.label}</Text>
            <Text style={[styles.value, styles[`${row.tone ?? "default"}Value`]]}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.divider} />
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>{totalLabel}</Text>
        <Text style={styles.totalValue}>{totalValue}</Text>
      </View>
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </SurfaceCard>
  );
}

const createStyles = ({ colors, spacing, typography }: Theme) =>
  StyleSheet.create({
    rows: {
      gap: spacing.sm,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: spacing.lg,
    },
    label: {
      ...typography.bodyUi,
      color: colors.body,
    },
    value: {
      ...typography.bodyUi,
      color: colors.ink,
      textAlign: "right",
    },
    defaultValue: {
      color: colors.ink,
    },
    successValue: {
      color: colors.success,
    },
    dangerValue: {
      color: colors.danger,
    },
    divider: {
      height: 1,
      marginVertical: spacing.md,
      backgroundColor: colors.divider,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: spacing.lg,
    },
    totalLabel: {
      ...typography.bodyUi,
      color: colors.ink,
      fontWeight: "600",
    },
    totalValue: {
      ...typography.bodyUi,
      color: colors.ink,
      fontWeight: "600",
      textAlign: "right",
    },
    note: {
      ...typography.caption,
      color: colors.mute,
      marginTop: spacing.sm,
    },
  });
