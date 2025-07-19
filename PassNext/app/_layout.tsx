import { Stack } from "expo-router";
import 'react-native-get-random-values';
import { AuthProvider } from "../contexts/AuthContext";
import { BiometricAuthProvider } from "../contexts/BiometricAuthContext";
import { NotificationProvider } from "../contexts/NotificationContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <BiometricAuthProvider>
        <NotificationProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </NotificationProvider>
      </BiometricAuthProvider>
    </AuthProvider>
  );
}
