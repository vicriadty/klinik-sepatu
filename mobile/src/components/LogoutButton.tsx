import { useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { logout } from "../api/auth";
import { useAuthStore } from "../auth/useAuthStore";
import type { Theme } from "../theme/tokens";
import { useTheme, useThemedStyles } from "../theme/useTheme";

interface LogoutButtonProps {
  label?: string;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function LogoutButton({
  label = "Keluar",
  icon,
  style,
}: LogoutButtonProps) {
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
      accessibilityLabel={label}
      disabled={pending}
      onPress={handlePress}
      style={({ pressed }) => [styles.button, style, pressed && styles.pressed]}
    >
      {pending ? (
        <ActivityIndicator size="small" color={theme.colors.ink} />
      ) : (
        <>
          {icon}
          <Text style={styles.label}>{label}</Text>
        </>
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
