import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import EmptyState from "../../components/EmptyState";
import WizardProgress from "../../components/WizardProgress";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import type { AppStackParamList } from "../../navigation/types";
import { deletePhotoFiles } from "../../order/photoFiles";
import { usePhotoStore } from "../../order/photoStore";
import { useOrderWizardStore } from "../../order/orderWizardStore";
import type { Theme } from "../../theme/tokens";
import { useTheme, useThemedStyles } from "../../theme/useTheme";

type Navigation = NativeStackNavigationProp<AppStackParamList, "OrderCustomer">;

const PAGE_SIZE = 20;

type OrderCustomerIconName =
  | "back"
  | "search"
  | "clear"
  | "check"
  | "user-plus"
  | "chevron"
  | "info";

function OrderCustomerIcon({
  name,
  color,
  size = 18,
}: {
  name: OrderCustomerIconName;
  color: string;
  size?: number;
}) {
  if (name === "back") {
    return (
      <View
        pointerEvents="none"
        style={[iconStyles.base, { width: size, height: size }]}
      >
        <View
          style={[
            iconStyles.line,
            { top: size / 2, left: 2, width: size - 4, backgroundColor: color },
          ]}
        />
        <View
          style={[
            iconStyles.line,
            {
              top: size / 2 - 1,
              left: 2,
              width: size * 0.45,
              backgroundColor: color,
              transform: [{ rotate: "-45deg" }],
            },
          ]}
        />
        <View
          style={[
            iconStyles.line,
            {
              top: size / 2 + size * 0.28,
              left: 2,
              width: size * 0.45,
              backgroundColor: color,
              transform: [{ rotate: "45deg" }],
            },
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

  if (name === "check") {
    return (
      <View
        pointerEvents="none"
        style={[iconStyles.base, { width: size, height: size }]}
      >
        <View
          style={[
            iconStyles.line,
            {
              top: size * 0.58,
              left: size * 0.14,
              width: size * 0.3,
              backgroundColor: color,
              transform: [{ rotate: "45deg" }],
            },
          ]}
        />
        <View
          style={[
            iconStyles.line,
            {
              top: size * 0.47,
              left: size * 0.36,
              width: size * 0.54,
              backgroundColor: color,
              transform: [{ rotate: "-45deg" }],
            },
          ]}
        />
      </View>
    );
  }

  if (name === "chevron") {
    return (
      <View
        pointerEvents="none"
        style={[iconStyles.base, { width: size, height: size }]}
      >
        <View
          style={[
            iconStyles.line,
            {
              top: size * 0.33,
              left: size * 0.25,
              width: size * 0.45,
              backgroundColor: color,
              transform: [{ rotate: "45deg" }],
            },
          ]}
        />
        <View
          style={[
            iconStyles.line,
            {
              top: size * 0.65,
              left: size * 0.25,
              width: size * 0.45,
              backgroundColor: color,
              transform: [{ rotate: "-45deg" }],
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
            iconStyles.circle,
            { width: size, height: size, borderColor: color, borderRadius: size },
          ]}
        />
        <View
          style={[
            iconStyles.infoDot,
            { left: size / 2 - 1, top: size * 0.23, backgroundColor: color },
          ]}
        />
        <View
          style={[
            iconStyles.infoLine,
            { left: size / 2 - 1, top: size * 0.48, backgroundColor: color },
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
          iconStyles.personHead,
          {
            width: size * 0.32,
            height: size * 0.32,
            left: size * 0.16,
            top: size * 0.08,
            borderColor: color,
            borderRadius: size,
          },
        ]}
      />
      <View
        style={[
          iconStyles.personBody,
          {
            width: size * 0.56,
            height: size * 0.3,
            left: size * 0.04,
            bottom: size * 0.08,
            borderColor: color,
            borderRadius: size,
          },
        ]}
      />
      <View
        style={[
          iconStyles.line,
          { top: size * 0.68, left: size * 0.7, width: size * 0.26, backgroundColor: color },
        ]}
      />
      <View
        style={[
          iconStyles.line,
          {
            top: size * 0.55,
            left: size * 0.83,
            height: size * 0.26,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

export default function OrderCustomerScreen() {
  const navigation = useNavigation<Navigation>();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const customer = useOrderWizardStore((state) => state.customer);
  const items = useOrderWizardStore((state) => state.items);
  const setCustomer = useOrderWizardStore((state) => state.setCustomer);
  const reset = useOrderWizardStore((state) => state.reset);
  const clearDrafts = usePhotoStore((state) => state.clearDrafts);
  const hasDraft = customer !== null || items.length > 0;
  const [searchInput, setSearchInput] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const search = useDebouncedValue(searchInput.trim(), 300);

  const customersQuery = useInfiniteQuery({
    queryKey: ["customers", "order-customer", search],
    queryFn: ({ pageParam }) =>
      searchCustomers({ search, page: pageParam, per_page: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.last_page
        ? lastPage.meta.page + 1
        : undefined,
  });

  const fetchedCustomers: ApiCustomer[] =
    customersQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const customers =
    customer && !fetchedCustomers.some((item) => item.id === customer.id)
      ? [customer, ...fetchedCustomers]
      : fetchedCustomers;
  const isInitialLoading = customersQuery.isLoading;
  const isEmpty =
    !isInitialLoading && !customersQuery.isError && customers.length === 0;

  const discardDraft = () => {
    Alert.alert(
      "Mulai order baru?",
      "Draft order yang tersimpan akan dihapus.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Ya, mulai baru",
          style: "destructive",
          onPress: () => {
            const drafts = usePhotoStore.getState().drafts;
            deletePhotoFiles(
              Object.values(drafts)
                .flat()
                .map((photo) => photo.uri)
            );
            clearDrafts();
            reset();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <OrderCustomerIcon name="back" color={theme.colors.ink} size={20} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Pesanan baru</Text>
          <Text style={styles.subtitle}>Pelanggan</Text>
        </View>
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
        ListHeaderComponent={
          <View>
            <WizardProgress step={1} />
            <Text style={styles.searchLabel}>CARI PELANGGAN</Text>
            <View
              style={[
                styles.searchContainer,
                searchFocused && styles.searchFocused,
              ]}
            >
              <OrderCustomerIcon name="search" color={theme.colors.info} />
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
                  <OrderCustomerIcon name="clear" color={theme.colors.stone} />
                </Pressable>
              ) : null}
            </View>
            {hasDraft ? (
              <View style={styles.draftNotice}>
                <Text style={styles.draftNoticeText}>
                  Draft order tersimpan dan dipulihkan otomatis.
                </Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          isInitialLoading ? (
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
              title="Belum ada pelanggan dipilih."
              message="Cari pelanggan lama atau buat pelanggan baru."
            />
          ) : null
        }
        renderItem={({ item }) => {
          const selected = customer?.id === item.id;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Pilih ${item.name}`}
              accessibilityState={{ selected }}
              onPress={() => setCustomer(item)}
              style={({ pressed }) => [
                styles.customerCard,
                selected && styles.customerCardSelected,
                pressed && styles.customerCardPressed,
              ]}
            >
              <View
                style={[
                  styles.customerMark,
                  selected && styles.customerMarkSelected,
                ]}
              >
                {selected ? (
                  <OrderCustomerIcon
                    name="check"
                    color={theme.colors.onPrimary}
                    size={16}
                  />
                ) : null}
              </View>
              <View style={styles.customerCopy}>
                <Text style={styles.customerName}>{item.name}</Text>
                <Text style={styles.customerPhone}>{item.phone_display}</Text>
              </View>
            </Pressable>
          );
        }}
        ListFooterComponent={
          <View style={styles.footer}>
            {customersQuery.isFetchingNextPage ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.ink}
                style={styles.footerLoader}
              />
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tambah pelanggan baru"
              onPress={() =>
                navigation.navigate("CustomerForm", { select: true })
              }
              style={styles.addCustomer}
            >
              <OrderCustomerIcon
                name="user-plus"
                color={theme.colors.ink}
                size={18}
              />
              <Text style={styles.addCustomerText}>Tambah pelanggan baru</Text>
              <OrderCustomerIcon
                name="chevron"
                color={theme.colors.mute}
                size={18}
              />
            </Pressable>

            <View style={styles.infoNote}>
              <OrderCustomerIcon name="info" color={theme.colors.mute} size={18} />
              <Text style={styles.infoText}>
                Nomor akan dinormalisasi ke format +62 oleh sistem.
              </Text>
            </View>

            <Text style={styles.draftStatus}>Draft tersimpan otomatis</Text>

            <View style={styles.actions}>
              <AppButton
                title="Lanjut: pilih sepatu"
                onPress={() => navigation.navigate("OrderItems")}
                disabled={!customer}
                fullWidth
              />
              <AppButton
                title="Simpan draft"
                variant="ghost"
                size="compact"
                onPress={() => navigation.goBack()}
                fullWidth
              />
              {hasDraft ? (
                <AppButton
                  title="Mulai Baru"
                  variant="ghost"
                  size="compact"
                  onPress={discardDraft}
                  fullWidth
                />
              ) : null}
            </View>
          </View>
        }
      />
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
      flexDirection: "row",
      alignItems: "flex-start",
      paddingTop: layout.statusBarHeight + spacing.md,
      paddingHorizontal: layout.screen.gutter,
    },
    backButton: {
      width: 24,
      height: 28,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.md,
      marginTop: spacing.xxs,
    },
    headerCopy: {
      flex: 1,
      gap: spacing.xxs,
    },
    title: {
      ...typography.screenTitle,
      color: colors.ink,
    },
    subtitle: {
      ...typography.caption,
      color: colors.mute,
      fontWeight: "400",
    },
    list: {
      flex: 1,
    },
    listContent: {
      flexGrow: 1,
      paddingHorizontal: layout.screen.gutter,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xl,
    },
    searchLabel: {
      ...typography.label,
      color: colors.ink,
      letterSpacing: 0.7,
      marginBottom: spacing.sm,
    },
    searchContainer: {
      height: 48,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.lg,
      paddingHorizontal: spacing.md,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.sm,
      backgroundColor: colors.card,
      marginBottom: spacing.lg,
    },
    draftNotice: {
      marginTop: spacing.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.ink,
      borderRadius: radius.md,
      backgroundColor: colors.bone,
    },
    draftNoticeText: {
      ...typography.caption,
      color: colors.ink,
      fontWeight: "400",
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
    customerCard: {
      minHeight: 80,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.md,
      backgroundColor: colors.card,
    },
    customerCardSelected: {
      borderColor: colors.hairline,
    },
    customerCardPressed: {
      opacity: 0.8,
    },
    customerMark: {
      width: 22,
      height: 22,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.divider,
      borderRadius: radius.full,
      backgroundColor: colors.surface,
    },
    customerMarkSelected: {
      borderColor: colors.ink,
      backgroundColor: colors.ink,
    },
    customerCopy: {
      flex: 1,
      gap: spacing.xs,
    },
    customerName: {
      ...typography.bodyUi,
      fontWeight: "500",
      color: colors.ink,
    },
    customerPhone: {
      ...typography.caption,
      color: colors.mute,
      fontWeight: "400",
    },
    loader: {
      marginTop: spacing.xxl,
    },
    footer: {
      paddingBottom: spacing.xl,
    },
    footerLoader: {
      marginBottom: spacing.md,
    },
    addCustomer: {
      minHeight: 46,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      borderWidth: 1,
      borderColor: colors.ink,
      borderRadius: radius.sm,
      backgroundColor: colors.card,
    },
    addCustomerText: {
      flex: 1,
      ...typography.button,
      color: colors.ink,
    },
    infoNote: {
      minHeight: 52,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      marginTop: spacing.lg,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.bone,
    },
    infoText: {
      flex: 1,
      ...typography.caption,
      color: colors.mute,
      fontWeight: "400",
      lineHeight: 16,
    },
    draftStatus: {
      ...typography.overline,
      color: colors.mute,
      marginTop: spacing.xxxl,
    },
    actions: {
      marginTop: spacing.md,
      gap: spacing.sm,
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
  infoDot: {
    position: "absolute",
    width: 2,
    height: 2,
    borderRadius: 2,
  },
  infoLine: {
    position: "absolute",
    width: 2,
    height: 5,
    borderRadius: 2,
  },
  personHead: {
    position: "absolute",
    borderWidth: 1.5,
  },
  personBody: {
    position: "absolute",
    borderWidth: 1.5,
  },
});
