import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LogoutButton from "../components/LogoutButton";
import CustomerFormScreen from "../screens/customers/CustomerFormScreen";
import CustomersScreen from "../screens/customers/CustomersScreen";
import HomeScreen from "../screens/home/HomeScreen";
import { useTheme } from "../theme/useTheme";
import type { AppStackParamList } from "./types";

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppStack() {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.canvas },
        headerTintColor: theme.colors.ink,
        headerTitleStyle: { fontSize: 16, fontWeight: "500" },
        contentStyle: { backgroundColor: theme.colors.canvas },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Beranda",
          headerRight: () => <LogoutButton />,
        }}
      />
      <Stack.Screen
        name="Customers"
        component={CustomersScreen}
        options={{ title: "Pelanggan" }}
      />
      <Stack.Screen
        name="CustomerForm"
        component={CustomerFormScreen}
        options={{ title: "Pelanggan Baru", presentation: "modal" }}
      />
    </Stack.Navigator>
  );
}
