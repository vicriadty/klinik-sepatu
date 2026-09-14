import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LogoutButton from "../components/LogoutButton";
import CustomerFormScreen from "../screens/customers/CustomerFormScreen";
import CustomersScreen from "../screens/customers/CustomersScreen";
import HomeScreen from "../screens/home/HomeScreen";
import type { AppStackParamList } from "./types";

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppStack() {
  return (
    <Stack.Navigator>
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
