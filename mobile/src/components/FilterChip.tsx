import { Pressable, StyleSheet, Text } from "react-native";
import type { Theme } from "../theme/tokens";
import { useThemedStyles } from "../theme/useTheme";

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export default function FilterChip({
  label,
  selected,
  onPress,
}: FilterChipProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const createStyles = ({ colors, radius, spacing, typography }: Theme) =>
  StyleSheet.create({
    chip: {
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    chipSelected: {
      borderColor: colors.ink,
      backgroundColor: colors.bone,
    },
    label: {
      ...typography.button,
      color: colors.ink,
    },
  });
