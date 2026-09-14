import { NavigationContainer } from "@react-navigation/native";
import { useAuthStore } from "../auth/useAuthStore";
import FullScreenLoader from "../components/FullScreenLoader";
import AppStack from "./AppStack";
import AuthStack from "./AuthStack";

export default function RootNavigator() {
  const status = useAuthStore((state) => state.status);

  if (status === "restoring") {
    return <FullScreenLoader label="Memuat sesi…" />;
  }

  return (
    <NavigationContainer>
      {status === "signedIn" ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
