import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { persistOptions, queryClient } from "./src/api/queryClient";
import { bootstrapSession } from "./src/auth/session";
import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
  const scheme = useColorScheme();

  useEffect(() => {
    bootstrapSession();
  }, []);

  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={persistOptions}
      >
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        <RootNavigator />
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
