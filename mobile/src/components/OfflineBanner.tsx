import { StyleSheet, Text, View } from "react-native";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import type { Theme } from "../theme/tokens";
import { useThemedStyles } from "../theme/useTheme";

export default function OfflineBanner() {
  const { isOffline } = useNetworkStatus();
  const styles = useThemedStyles(createStyles);

  if (!isOffline) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={styles.text}>Tidak ada koneksi — data mungkin lama</Text>
    </View>
  );
}

const createStyles = ({ colors, radius, spacing, typography }: Theme) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      left: spacing.xl,
      right: spacing.xl,
      bottom: spacing.xl,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.danger,
      backgroundColor: colors.bone,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      alignItems: "center",
    },
    text: {
      ...typography.caption,
      color: colors.danger,
    },
  });
