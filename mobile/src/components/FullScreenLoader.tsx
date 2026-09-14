import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { Theme } from "../theme/tokens";
import { useTheme, useThemedStyles } from "../theme/useTheme";

export default function FullScreenLoader({
  label = "Memuat…",
}: {
  label?: string;
}) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.ink} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const createStyles = ({ colors, spacing, typography }: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
      backgroundColor: colors.canvas,
    },
    label: {
      ...typography.body,
      color: colors.mute,
    },
  });
