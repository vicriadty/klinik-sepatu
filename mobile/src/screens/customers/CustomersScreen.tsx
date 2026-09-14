import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { searchCustomers, type ApiCustomer } from "../../api/customers";
import AppButton from "../../components/AppButton";
import EmptyState from "../../components/EmptyState";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import type { AppStackParamList } from "../../navigation/types";
import { colors } from "../../theme/colors";

type Navigation = NativeStackNavigationProp<AppStackParamList, "Customers">;
type Route = RouteProp<AppStackParamList, "Customers">;

const PAGE_SIZE = 20;

export default function CustomersScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const [searchInput, setSearchInput] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const search = useDebouncedValue(searchInput.trim(), 300);

  useEffect(() => {
    const created = route.params?.created;
    const incomingSearch = route.params?.search;

    if (created !== undefined) {
      setNotice(`Pelanggan "${created}" ditambahkan.`);
    }
    if (incomingSearch !== undefined) {
      setSearchInput(incomingSearch);
    }
    if (created !== undefined || incomingSearch !== undefined) {
      navigation.setParams({ created: undefined, search: undefined });
    }
  }, [route.params?.created, route.params?.search, navigation]);

  const customersQuery = useInfiniteQuery({
    queryKey: ["customers", search],
    queryFn: ({ pageParam }) =>
      searchCustomers({ search, page: pageParam, per_page: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.last_page
        ? lastPage.meta.page + 1
        : undefined,
  });

  const customers: ApiCustomer[] =
    customersQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const isInitialLoading = customersQuery.isLoading;
  const isEmpty =
    !isInitialLoading && !customersQuery.isError && customers.length === 0;

  const openCreateForm = () => navigation.navigate("CustomerForm");

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <View style={styles.header}>
        <TextInput
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Cari nama atau nomor telepon"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.searchInput}
          accessibilityLabel="Cari pelanggan"
        />
        <AppButton title="Tambah Pelanggan" onPress={openCreateForm} />
        {notice ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}
      </View>

      {isInitialLoading ? (
        <ActivityIndicator
          size="large"
          color={colors.brand}
          style={styles.loader}
        />
      ) : customersQuery.isError ? (
        <EmptyState
          title="Gagal memuat pelanggan."
          message="Periksa koneksi lalu coba lagi."
        />
      ) : isEmpty ? (
        <EmptyState
          title="Pelanggan tidak ditemukan."
          message="Coba kata kunci lain atau tambahkan pelanggan baru."
        />
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (customersQuery.hasNextPage && !customersQuery.isFetchingNextPage) {
              void customersQuery.fetchNextPage();
            }
          }}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.rowName}>{item.name}</Text>
              <Text style={styles.rowPhone}>{item.phone_display}</Text>
            </View>
          )}
          ListFooterComponent={
            customersQuery.isFetchingNextPage ? (
              <ActivityIndicator
                size="small"
                color={colors.brand}
                style={styles.footerLoader}
              />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    gap: 12,
  },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  notice: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: "#ecfdf3",
    padding: 12,
  },
  noticeText: {
    fontSize: 14,
    color: "#027a48",
  },
  loader: {
    marginTop: 32,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  row: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
    marginBottom: 10,
    gap: 4,
  },
  rowName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  rowPhone: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  footerLoader: {
    marginVertical: 12,
  },
});
