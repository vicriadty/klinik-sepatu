import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

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
  return (
    <View style={[styles.card, highlight && styles.highlight]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: "45%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 6,
  },
  highlight: {
    borderColor: colors.brand,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
});
