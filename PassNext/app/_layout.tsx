import { Stack } from "expo-router";
import { useEffect } from "react";
import 'react-native-get-random-values';
import { AuthProvider } from "../contexts/AuthContext";
import { BiometricAuthProvider } from "../contexts/BiometricAuthContext";
import { notificationService } from "../services/notificationService";

export default function RootLayout() {
  useEffect(() => {
    // Initialize notifications
    notificationService.initialize();
  }, []);

  return (
    <AuthProvider>
      <BiometricAuthProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </BiometricAuthProvider>
    </AuthProvider>
  );
}
