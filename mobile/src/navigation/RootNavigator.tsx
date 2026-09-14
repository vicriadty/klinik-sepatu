import { NavigationContainer } from "@react-navigation/native";
import { useMemo } from "react";
import { useAuthStore } from "../auth/useAuthStore";
import FullScreenLoader from "../components/FullScreenLoader";
import { buildNavigationTheme, useTheme } from "../theme/useTheme";
import AppStack from "./AppStack";
import AuthStack from "./AuthStack";

export default function RootNavigator() {
  const status = useAuthStore((state) => state.status);
  const theme = useTheme();
  const navigationTheme = useMemo(() => buildNavigationTheme(theme), [theme]);

  if (status === "restoring") {
    return <FullScreenLoader label="Memuat sesi…" />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {status === "signedIn" ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
