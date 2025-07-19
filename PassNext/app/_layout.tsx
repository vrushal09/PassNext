import { Stack } from "expo-router";
import 'react-native-get-random-values';
import { AuthProvider } from "../contexts/AuthContext";
import { BiometricAuthProvider } from "../contexts/BiometricAuthContext";

export default function RootLayout() {
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
