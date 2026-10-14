import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import type { Theme } from "../theme/tokens";
import { useTheme, useThemedStyles } from "../theme/useTheme";

export default function OfflineBanner() {
  const { isOffline } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);

  if (!isOffline) {
    return null;
  }

  return (
    <View
      style={[styles.container, { paddingBottom: theme.spacing.sm + insets.bottom }]}
      pointerEvents="none"
    >
      <Text style={styles.text}>Tidak ada koneksi — data mungkin lama</Text>
    </View>
  );
}

const createStyles = ({ colors, radius, spacing, typography }: Theme) =>
  StyleSheet.create({
    container: {
      marginHorizontal: spacing.xl,
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.danger,
      backgroundColor: colors.bone,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      paddingBottom: spacing.sm,
      alignItems: "center",
    },
    text: {
      ...typography.caption,
      color: colors.danger,
    },
  });
