import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";
import OfflineBanner from "../components/OfflineBanner";
import SignInScreen from "../screens/auth/SignInScreen";
import { useTheme } from "../theme/useTheme";
import type { AuthStackParamList } from "./types";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.canvas },
        }}
      >
        <Stack.Screen name="SignIn" component={SignInScreen} />
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
