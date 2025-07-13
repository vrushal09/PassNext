import 'react-native-get-random-values';
import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useBiometricAuth } from "../contexts/BiometricAuthContext";
import { AuthNavigator } from "../components/AuthNavigator";
import { HomeScreen } from "../components/HomeScreen";
import { BiometricAuthScreen } from "../components/BiometricAuthScreen";

export default function Index() {
  const { user, loading, initialized } = useAuth();
  const { 
    isBiometricRequired, 
    setBiometricAuthenticated, 
    setBiometricEnabled,
    resetBiometricAuth
  } = useBiometricAuth();

  // Wait for Firebase Auth to initialize
  if (!initialized || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // If user is not authenticated, show auth screens
  if (!user) {
    return <AuthNavigator />;
  }

  // If user is authenticated but biometric auth is required
  if (isBiometricRequired) {
    return (
      <BiometricAuthScreen
        onSuccess={() => {
          setBiometricAuthenticated(true);
        }}
        onFallback={() => {
          // Use device passcode - disable biometric and continue
          setBiometricEnabled(false);
          setBiometricAuthenticated(true);
        }}
      />
    );
  }

  // User is authenticated and biometric auth is satisfied
  return <HomeScreen />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
});
