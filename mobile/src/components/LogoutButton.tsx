import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { logout } from "../api/auth";
import { useAuthStore } from "../auth/useAuthStore";
import type { Theme } from "../theme/tokens";
import { useTheme, useThemedStyles } from "../theme/useTheme";

export default function LogoutButton() {
  const signOut = useAuthStore((state) => state.signOut);
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const [pending, setPending] = useState(false);

  const handlePress = async () => {
    if (pending) return;
    setPending(true);
    try {
      await logout();
    } catch {
      // Logout lokal tetap dilanjutkan meski server tidak terjangkau.
    }
    await signOut();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Keluar"
      disabled={pending}
      onPress={handlePress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      {pending ? (
        <ActivityIndicator size="small" color={theme.colors.ink} />
      ) : (
        <Text style={styles.label}>Keluar</Text>
      )}
    </Pressable>
  );
}

const createStyles = ({ colors, spacing, typography }: Theme) =>
  StyleSheet.create({
    button: {
      minHeight: 44,
      justifyContent: "center",
      paddingHorizontal: spacing.md,
    },
    pressed: {
      opacity: 0.6,
    },
    label: {
      ...typography.button,
      color: colors.mute,
    },
  });
