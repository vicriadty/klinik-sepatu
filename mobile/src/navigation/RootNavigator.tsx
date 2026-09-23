import { NavigationContainer } from "@react-navigation/native";
import { useMemo } from "react";
import { useAuthStore } from "../auth/useAuthStore";
import SplashScreen from "../screens/splash/SplashScreen";
import { buildNavigationTheme, useTheme } from "../theme/useTheme";
import AppStack from "./AppStack";
import AuthStack from "./AuthStack";

export default function RootNavigator() {
  const status = useAuthStore((state) => state.status);
  const theme = useTheme();
  const navigationTheme = useMemo(() => buildNavigationTheme(theme), [theme]);

  if (status === "restoring") {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {status === "signedIn" ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
