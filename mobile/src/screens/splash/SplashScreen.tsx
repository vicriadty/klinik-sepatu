import { Image, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Theme } from "../../theme/tokens";
import { useTheme, useThemedStyles } from "../../theme/useTheme";

export default function SplashScreen() {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const logoSize = Math.min(theme.layout.splashLogoSize, width * 0.28);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Image
          accessibilityLabel="Logo Klinik Sepatu"
          source={require("../../../assets/adaptive-icon-foreground.png")}
          style={[
            styles.logo,
            {
              width: logoSize,
              height: logoSize,
              tintColor: theme.isDark ? theme.colors.ink : undefined,
            },
          ]}
        />
        <Text style={styles.label}>Loading...</Text>
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
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.lg,
      paddingTop: spacing.xl,
      paddingHorizontal: layout.screen.gutter,
    },
    logo: {
      resizeMode: "contain",
    },
    label: {
      ...typography.body,
      color: colors.mute,
    },
  });
