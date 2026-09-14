import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { logout } from "../api/auth";
import { useAuthStore } from "../auth/useAuthStore";
import { colors } from "../theme/colors";

export default function LogoutButton() {
  const signOut = useAuthStore((state) => state.signOut);
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
      style={styles.button}
    >
      {pending ? (
        <ActivityIndicator size="small" color={colors.brand} />
      ) : (
        <Text style={styles.label}>Keluar</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.brand,
  },
});
