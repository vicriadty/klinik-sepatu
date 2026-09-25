import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";
import LogoutButton from "../components/LogoutButton";
import OfflineBanner from "../components/OfflineBanner";
import CustomerFormScreen from "../screens/customers/CustomerFormScreen";
import CustomersScreen from "../screens/customers/CustomersScreen";
import HomeScreen from "../screens/home/HomeScreen";
import OrderCustomerScreen from "../screens/orders/OrderCustomerScreen";
import OrderDetailScreen from "../screens/orders/OrderDetailScreen";
import OrderItemFormScreen from "../screens/orders/OrderItemFormScreen";
import OrderItemPhotosScreen from "../screens/orders/OrderItemPhotosScreen";
import OrderItemServicesScreen from "../screens/orders/OrderItemServicesScreen";
import OrderItemsScreen from "../screens/orders/OrderItemsScreen";
import OrderPaymentScreen from "../screens/orders/OrderPaymentScreen";
import OrderReviewScreen from "../screens/orders/OrderReviewScreen";
import OrderSuccessScreen from "../screens/orders/OrderSuccessScreen";
import OrdersScreen from "../screens/orders/OrdersScreen";
import { useTheme } from "../theme/useTheme";
import type { AppStackParamList } from "./types";

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppStack() {
  const theme = useTheme();

  return (
    <View style={styles.container}>
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
      <Stack.Screen
        name="OrderCustomer"
        component={OrderCustomerScreen}
        options={{ title: "Order Baru" }}
      />
      <Stack.Screen
        name="OrderItems"
        component={OrderItemsScreen}
        options={{ title: "Pesanan baru" }}
      />
      <Stack.Screen
        name="OrderItemForm"
        component={OrderItemFormScreen}
        options={{ title: "Sepatu", presentation: "modal" }}
      />
      <Stack.Screen
        name="OrderItemServices"
        component={OrderItemServicesScreen}
        options={{ title: "Pesanan baru" }}
      />
      <Stack.Screen
        name="OrderItemPhotos"
        component={OrderItemPhotosScreen}
        options={{ title: "Pesanan baru" }}
      />
      <Stack.Screen
        name="OrderReview"
        component={OrderReviewScreen}
        options={{ title: "Pesanan baru" }}
      />
      <Stack.Screen
        name="OrderSuccess"
        component={OrderSuccessScreen}
        options={{
          title: "Order Dibuat",
          headerBackVisible: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="OrderPayment"
        component={OrderPaymentScreen}
        options={{ title: "Pembayaran" }}
      />
      <Stack.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ title: "Pesanan" }}
      />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: "Detail Order" }}
      />
      </Stack.Navigator>
      <OfflineBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
