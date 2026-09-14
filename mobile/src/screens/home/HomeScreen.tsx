import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchDashboardSummary } from "../../api/dashboard";
import { useAuthStore } from "../../auth/useAuthStore";
import AppButton from "../../components/AppButton";
import EmptyState from "../../components/EmptyState";
import FullScreenLoader from "../../components/FullScreenLoader";
import SummaryCard from "../../components/SummaryCard";
import type { AppStackParamList } from "../../navigation/types";
import { colors } from "../../theme/colors";
import { formatIDR } from "../../utils/format";

type Navigation = NativeStackNavigationProp<AppStackParamList, "Home">;

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const navigation = useNavigation<Navigation>();
  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: fetchDashboardSummary,
  });

  if (summaryQuery.isLoading) {
    return <FullScreenLoader label="Memuat ringkasan…" />;
  }

  const summary = summaryQuery.data;

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={summaryQuery.isRefetching}
            onRefresh={() => summaryQuery.refetch()}
          />
        }
      >
        <Text style={styles.greeting}>Halo, {user?.name ?? "Pengguna"}</Text>
        <Text style={styles.subtitle}>Ringkasan operasional hari ini</Text>

        {summaryQuery.isError || !summary ? (
          <EmptyState
            title="Gagal memuat ringkasan."
            message="Tarik ke bawah atau coba lagi."
          />
        ) : (
          <View style={styles.grid}>
            {summary.revenue_today !== undefined && (
              <SummaryCard
                label="Pendapatan hari ini"
                value={formatIDR(summary.revenue_today)}
              />
            )}
            <SummaryCard
              label="Order hari ini"
              value={String(summary.orders_today)}
            />
            <SummaryCard
              label="Dalam proses"
              value={String(summary.in_progress)}
            />
            <SummaryCard
              label="Siap diambil"
              value={String(summary.ready_for_pickup)}
            />
            <SummaryCard
              label="Belum dibayar"
              value={formatIDR(summary.outstanding_payment)}
              highlight={summary.outstanding_payment > 0}
            />
          </View>
        )}

        <Text style={styles.sectionTitle}>Aksi cepat</Text>
        <AppButton
          title="Cari / Tambah Pelanggan"
          onPress={() => navigation.navigate("Customers")}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    gap: 8,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
});
