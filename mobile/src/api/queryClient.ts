import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./client";

export const QUERY_CACHE_MAX_AGE = 1000 * 60 * 60 * 24;
export const QUERY_CACHE_KEY = "ks-query-cache";

/**
 * Offline-tolerant reads (prd-mobile §21): successful queries are cached in
 * AsyncStorage so master data (services, discounts, customers, dashboard)
 * stays readable when the connection drops. Mutations still require the
 * server — a local write is never treated as a server success.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) =>
        error instanceof ApiError && error.status === 401
          ? false
          : failureCount < 1,
      staleTime: 30_000,
      gcTime: QUERY_CACHE_MAX_AGE,
    },
  },
});

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: QUERY_CACHE_KEY,
  throttleTime: 2000,
});

export const persistOptions = {
  persister: queryPersister,
  maxAge: QUERY_CACHE_MAX_AGE,
  dehydrateOptions: {
    shouldDehydrateQuery: (query: { state: { status: string } }) =>
      query.state.status === "success",
  },
};
