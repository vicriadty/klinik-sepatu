import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

export default function FullScreenLoader({
  label = "Memuat…",
}: {
  label?: string;
}) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.brand} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: colors.background,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
