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
import ScreenHeader from "../../components/ScreenHeader";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import type { AppStackParamList } from "../../navigation/types";
import { useOrderWizardStore } from "../../order/orderWizardStore";
import type { Theme } from "../../theme/tokens";
import { useTheme, useThemedStyles } from "../../theme/useTheme";
import { normalizePhone } from "../../utils/phone";

type Navigation = NativeStackNavigationProp<AppStackParamList, "Customers">;
type Route = RouteProp<AppStackParamList, "Customers">;

const PAGE_SIZE = 20;

type CustomersIconName =
  | "search"
  | "plus"
  | "clear"
  | "sparkles"
  | "user"
  | "info";

function CustomersIcon({
  name,
  color,
  size = 18,
}: {
  name: CustomersIconName;
  color: string;
  size?: number;
}) {
  if (name === "plus") {
    return (
      <View
        pointerEvents="none"
        style={[iconStyles.base, { width: size, height: size }]}
      >
        <View
          style={[
            iconStyles.line,
            { top: size / 2, left: 1, width: size - 2, backgroundColor: color },
          ]}
        />
        <View
          style={[
            iconStyles.line,
            { top: 1, left: size / 2, height: size - 2, backgroundColor: color },
          ]}
        />
      </View>
    );
  }

  if (name === "search") {
    return (
      <View
        pointerEvents="none"
        style={[iconStyles.base, { width: size, height: size }]}
      >
        <View
          style={[
            iconStyles.circle,
            { width: size - 6, height: size - 6, borderColor: color },
          ]}
        />
        <View
          style={[
            iconStyles.line,
            {
              top: size - 5,
              left: size - 6,
              width: 7,
              backgroundColor: color,
              transform: [{ rotate: "45deg" }],
            },
          ]}
        />
      </View>
    );
  }

  if (name === "clear") {
    return (
      <View
        pointerEvents="none"
        style={[iconStyles.base, { width: size, height: size }]}
      >
        <View
          style={[
            iconStyles.line,
            {
              top: size / 2,
              left: 1,
              width: size - 2,
              backgroundColor: color,
              transform: [{ rotate: "45deg" }],
            },
          ]}
        />
        <View
          style={[
            iconStyles.line,
            {
              top: size / 2,
              left: 1,
              width: size - 2,
              backgroundColor: color,
              transform: [{ rotate: "-45deg" }],
            },
          ]}
        />
      </View>
    );
  }

  if (name === "user") {
    return (
      <View
        pointerEvents="none"
        style={[iconStyles.base, { width: size, height: size }]}
      >
        <View
          style={[
            iconStyles.userHead,
            {
              width: size * 0.35,
              height: size * 0.35,
              left: size * 0.325,
              borderColor: color,
              borderRadius: size,
            },
          ]}
        />
        <View
          style={[
            iconStyles.userBody,
            {
              width: size * 0.7,
              height: size * 0.35,
              left: size * 0.15,
              borderColor: color,
              borderRadius: size,
            },
          ]}
        />
      </View>
    );
  }

  if (name === "info") {
    return (
      <View
        pointerEvents="none"
        style={[iconStyles.base, { width: size, height: size }]}
      >
        <View
          style={[
            iconStyles.infoCircle,
            { width: size, height: size, borderColor: color, borderRadius: size },
          ]}
        />
        <View
          style={[
            iconStyles.infoDot,
            { left: size / 2 - 1, top: size * 0.25, backgroundColor: color },
          ]}
        />
        <View
          style={[
            iconStyles.infoLine,
            { left: size / 2 - 1, top: size * 0.48, height: size * 0.3, backgroundColor: color },
          ]}
        />
      </View>
    );
  }

  return (
    <View
      pointerEvents="none"
      style={[iconStyles.base, { width: size, height: size }]}
    >
      <View
        style={[
          iconStyles.line,
          {
            top: size / 2,
            left: size * 0.15,
            width: size * 0.7,
            backgroundColor: color,
            transform: [{ rotate: "45deg" }],
          },
        ]}
      />
      <View
        style={[
          iconStyles.line,
          {
            top: size / 2,
            left: size * 0.15,
            width: size * 0.7,
            backgroundColor: color,
            transform: [{ rotate: "-45deg" }],
          },
        ]}
      />
      <View
        style={[
          iconStyles.line,
          {
            top: size * 0.2,
            left: size * 0.45,
            width: size * 0.1,
            height: size * 0.6,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

function formatNormalizedPhone(phone: string) {
  const local = phone.slice(2);
  const groups = [local.slice(0, 3), local.slice(3, 7), local.slice(7)].filter(
    Boolean
  );
  return `+62 ${groups.join(" ")}`;
}

export default function CustomersScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const selectMode = route.params?.select === true;
  const setWizardCustomer = useOrderWizardStore((state) => state.setCustomer);
  const [searchInput, setSearchInput] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const search = useDebouncedValue(searchInput.trim(), 300);
  const normalizedPhone = normalizePhone(searchInput);

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
  const totalCustomers = customersQuery.data?.pages[0]?.meta.total ?? customers.length;
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
        <ScreenHeader
          title={selectMode ? "Pilih pelanggan" : "Pelanggan"}
          subtitle="Cari dan pilih pelanggan"
          onBack={() => navigation.goBack()}
          right={
            <AppButton
              title="Baru"
              size="compact"
              onPress={openCreateForm}
              accessibilityLabel="Tambah Pelanggan"
              style={styles.newButton}
              leftIcon={<CustomersIcon name="plus" color={theme.colors.onPrimary} />}
            />
          }
        />
        <View
          style={[
            styles.searchContainer,
            searchFocused && styles.searchFocused,
          ]}
        >
          <CustomersIcon name="search" color={theme.colors.info} />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Cari nama atau nomor telepon"
            placeholderTextColor={theme.colors.stone}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={styles.searchInput}
            accessibilityLabel="Cari pelanggan"
          />
          {searchInput.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Hapus pencarian"
              hitSlop={8}
              onPress={() => setSearchInput("")}
              style={styles.clearButton}
            >
              <CustomersIcon name="clear" color={theme.colors.stone} />
            </Pressable>
          ) : null}
        </View>
        {normalizedPhone ? (
          <View style={styles.normalizedPreview}>
            <CustomersIcon name="sparkles" color={theme.colors.mute} size={18} />
            <View>
              <Text style={styles.previewLabel}>Format tersimpan</Text>
              <Text style={styles.previewValue}>
                {formatNormalizedPhone(normalizedPhone)}
              </Text>
            </View>
          </View>
        ) : null}
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
          actionTitle="Coba lagi"
          onAction={() => void customersQuery.refetch()}
        />
      ) : isEmpty ? (
        <EmptyState
          title="Pelanggan tidak ditemukan."
          message="Coba kata kunci lain atau tambahkan pelanggan baru."
        />
      ) : (
        <>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>HASIL PENCARIAN</Text>
            <Text style={styles.resultCount}>{totalCustomers} pelanggan</Text>
          </View>
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
                <CustomersIcon name="user" color={theme.colors.ink} size={20} />
                <View style={styles.rowContent}>
                  <Text style={styles.rowName}>{item.name}</Text>
                  <Text style={styles.rowPhone}>{item.phone_display}</Text>
                </View>
              </Pressable>
            )}
            ListFooterComponent={
              <View>
                {customersQuery.isFetchingNextPage ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.ink}
                    style={styles.footerLoader}
                  />
                ) : null}
                <View style={styles.guidance}>
                  <CustomersIcon name="info" color={theme.colors.warning} size={18} />
                  <Text style={styles.guidanceText}>
                    Jika nomor sudah terdaftar, gunakan pelanggan yang ada.
                  </Text>
                </View>
              </View>
            }
          />
        </>
      )}
      {!selectMode ? <BottomNavigation active="customers" /> : null}
    </SafeAreaView>
  );
}

const createStyles = ({
  colors,
  layout,
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
      paddingBottom: spacing.sm,
      gap: spacing.md,
    },
    newButton: {
      minWidth: 88,
      paddingHorizontal: spacing.md,
    },
    searchContainer: {
      height: 48,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.lg,
      marginHorizontal: layout.screen.gutter,
      paddingHorizontal: spacing.md,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.sm,
      backgroundColor: colors.card,
    },
    searchFocused: {
      borderColor: colors.info,
    },
    searchInput: {
      flex: 1,
      height: 46,
      paddingHorizontal: 0,
      ...typography.bodyUi,
      color: colors.ink,
    },
    clearButton: {
      width: 32,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    normalizedPreview: {
      height: 48,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      marginHorizontal: layout.screen.gutter,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.bone,
    },
    previewLabel: {
      ...typography.overline,
      color: colors.mute,
      fontWeight: "400",
    },
    previewValue: {
      ...typography.caption,
      color: colors.ink,
    },
    notice: {
      marginHorizontal: layout.screen.gutter,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.success,
      borderRadius: radius.md,
      backgroundColor: colors.successSurface,
    },
    noticeText: {
      ...typography.bodyUi,
      color: colors.ink,
    },
    listHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: spacing.xl,
      marginBottom: spacing.sm,
      paddingHorizontal: layout.screen.gutter,
    },
    listTitle: {
      ...typography.overline,
      color: colors.ink,
      letterSpacing: 0.6,
    },
    resultCount: {
      ...typography.overline,
      color: colors.mute,
      fontWeight: "400",
    },
    loader: {
      marginTop: spacing.xxl,
    },
    listContent: {
      paddingHorizontal: layout.screen.gutter,
      paddingBottom: spacing.xl,
    },
    list: {
      flex: 1,
    },
    row: {
      minHeight: 62,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.lg,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.card,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.sm,
    },
    rowPressed: {
      borderColor: colors.ink,
      opacity: 0.85,
    },
    rowContent: {
      flex: 1,
      gap: spacing.xs,
    },
    rowName: {
      ...typography.bodyUi,
      fontWeight: "500",
      color: colors.ink,
    },
    rowPhone: {
      ...typography.overline,
      color: colors.mute,
      fontWeight: "400",
    },
    guidance: {
      minHeight: 52,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      marginTop: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.warningSurface,
    },
    guidanceText: {
      flex: 1,
      ...typography.overline,
      color: colors.warningText,
      fontWeight: "400",
      lineHeight: 16,
    },
    footerLoader: {
      marginVertical: spacing.md,
    },
  });

const iconStyles = StyleSheet.create({
  base: {
    position: "relative",
  },
  line: {
    position: "absolute",
    height: 1.5,
  },
  circle: {
    position: "absolute",
    top: 1,
    left: 1,
    borderWidth: 1.5,
    borderRadius: 99,
  },
  userHead: {
    position: "absolute",
    top: 1,
    borderWidth: 1.5,
  },
  userBody: {
    position: "absolute",
    bottom: 1,
    borderWidth: 1.5,
  },
  infoCircle: {
    position: "absolute",
    borderWidth: 1.5,
  },
  infoDot: {
    position: "absolute",
    width: 2,
    height: 2,
    borderRadius: 2,
  },
  infoLine: {
    position: "absolute",
    width: 2,
    borderRadius: 2,
  },
});
