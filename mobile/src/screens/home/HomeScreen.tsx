import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { logout, ROLE_LABELS } from "../../api/auth";
import { useAuthStore } from "../../auth/useAuthStore";
import AppButton from "../../components/AppButton";
import { colors } from "../../theme/colors";

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
    } catch {
      // Logout lokal tetap dilanjutkan meski server tidak terjangkau.
    }
    await signOut();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <View style={styles.content}>
        <Text style={styles.greeting}>Halo, {user?.name ?? "Pengguna"}</Text>
        <Text style={styles.role}>{user ? ROLE_LABELS[user.role] : ""}</Text>
        <Text style={styles.note}>
          Beranda operasional (order hari ini, dalam proses, siap diambil)
          akan tersedia pada fase berikutnya.
        </Text>
        <AppButton
          title="Keluar"
          variant="outline"
          onPress={handleSignOut}
          loading={signingOut}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
    gap: 8,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  role: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  note: {
    marginTop: 12,
    marginBottom: 24,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
});
