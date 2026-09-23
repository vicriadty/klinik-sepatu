import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { searchCustomers, type ApiCustomer } from "../../api/customers";
import AppButton from "../../components/AppButton";
import BottomNavigation from "../../components/BottomNavigation";
import EmptyState from "../../components/EmptyState";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import type { AppStackParamList } from "../../navigation/types";
import { useOrderWizardStore } from "../../order/orderWizardStore";
import type { Theme } from "../../theme/tokens";
import { useTheme, useThemedStyles } from "../../theme/useTheme";

type Navigation = NativeStackNavigationProp<AppStackParamList, "Customers">;
type Route = RouteProp<AppStackParamList, "Customers">;

const PAGE_SIZE = 20;

export default function CustomersScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const selectMode = route.params?.select === true;
  const setWizardCustomer = useOrderWizardStore((state) => state.setCustomer);
  const [searchInput, setSearchInput] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const search = useDebouncedValue(searchInput.trim(), 300);

  useEffect(() => {
    if (selectMode) {
      navigation.setOptions({ title: "Pilih Pelanggan" });
    }
  }, [selectMode, navigation]);

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

  const openCreateForm = () => {
    if (selectMode) {
      navigation.navigate("CustomerForm", { select: true });
      return;
    }
    navigation.navigate("CustomerForm");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <View style={styles.header}>
        <TextInput
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Cari nama atau nomor telepon"
          placeholderTextColor={theme.colors.stone}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.searchInput}
          accessibilityLabel="Cari pelanggan"
        />
        <AppButton
          title="Tambah Pelanggan"
          variant="secondary"
          onPress={openCreateForm}
        />
        {notice ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}
      </View>

      {isInitialLoading ? (
        <ActivityIndicator
          size="large"
          color={theme.colors.ink}
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
          style={styles.list}
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
            <Pressable
              disabled={!selectMode}
              accessibilityRole={selectMode ? "button" : undefined}
              accessibilityLabel={selectMode ? `Pilih ${item.name}` : undefined}
              onPress={() => {
                setWizardCustomer(item);
                navigation.goBack();
              }}
              style={({ pressed }) => [
                styles.row,
                selectMode && pressed && styles.rowPressed,
              ]}
            >
              <Text style={styles.rowName}>{item.name}</Text>
              <Text style={styles.rowPhone}>{item.phone_display}</Text>
            </Pressable>
          )}
          ListFooterComponent={
            customersQuery.isFetchingNextPage ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.ink}
                style={styles.footerLoader}
              />
            ) : null
          }
        />
      )}
      {!selectMode ? <BottomNavigation active="customers" /> : null}
    </SafeAreaView>
  );
}

const createStyles = ({
  colors,
  radius,
  spacing,
  typography,
}: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    header: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    searchInput: {
      height: 44,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.sm,
      paddingHorizontal: 20,
      ...typography.body,
      color: colors.ink,
      backgroundColor: colors.card,
    },
    notice: {
      borderRadius: radius.lg,
      backgroundColor: colors.bone,
      borderLeftWidth: 3,
      borderLeftColor: colors.success,
      padding: spacing.lg,
    },
    noticeText: {
      ...typography.body,
      color: colors.ink,
    },
    loader: {
      marginTop: spacing.xxl,
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
    },
    list: {
      flex: 1,
    },
    row: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      padding: spacing.lg,
      marginBottom: spacing.sm,
      gap: spacing.xs,
    },
    rowPressed: {
      opacity: 0.85,
    },
    rowName: {
      ...typography.subtitle,
      color: colors.ink,
    },
    rowPhone: {
      ...typography.body,
      color: colors.mute,
    },
    footerLoader: {
      marginVertical: spacing.md,
    },
  });
