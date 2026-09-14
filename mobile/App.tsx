import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ApiError } from "./src/api/client";
import { bootstrapSession } from "./src/auth/session";
import RootNavigator from "./src/navigation/RootNavigator";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) =>
        error instanceof ApiError && error.status === 401
          ? false
          : failureCount < 1,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  const scheme = useColorScheme();

  useEffect(() => {
    bootstrapSession();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        <RootNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
