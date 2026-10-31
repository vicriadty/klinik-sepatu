import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenHeader from "../../components/ScreenHeader";
import type { Theme } from "../../theme/tokens";
import { useThemedStyles } from "../../theme/useTheme";

export default function SettingsScreen() {
  const styles = useThemedStyles(createStyles);

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScreenHeader title="Settings" />
      <View style={styles.content}>
        <Text style={styles.title}>Pengaturan aplikasi</Text>
        <Text style={styles.message}>
          Pengaturan akun dan perangkat akan tersedia di sini.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const createStyles = ({ colors, layout, spacing, typography }: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    content: {
      marginHorizontal: layout.screen.gutter,
      marginTop: spacing.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: 8,
      backgroundColor: colors.card,
    },
    title: {
      ...typography.section,
      color: colors.ink,
    },
    message: {
      ...typography.bodyUi,
      marginTop: spacing.xs,
      color: colors.mute,
    },
  });
