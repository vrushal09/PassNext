import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Colors from '../constants/Colors';
import { biometricAuthService } from '../services/biometricAuthService';

interface BiometricAuthScreenProps {
  onSuccess: () => void;
  onDisableBiometric: () => void;
}

export const BiometricAuthScreen: React.FC<BiometricAuthScreenProps> = ({
  onSuccess,
  onDisableBiometric,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricTypes, setBiometricTypes] = useState<string[]>([]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    initializeBiometricAuth();
  }, []);

  // Handle app state changes - re-trigger biometric auth when app comes back to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && !isAuthenticating && !isLoading) {
        // Re-trigger biometric auth when app becomes active again
        setTimeout(() => {
          handleBiometricAuth();
        }, 500);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isAuthenticating, isLoading]);

  const initializeBiometricAuth = async () => {
    try {
      setIsLoading(true);
      
      // Add a small delay to ensure the component is properly mounted
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const available = await biometricAuthService.isAvailable();
      setIsAvailable(available);

      if (available) {
        const types = await biometricAuthService.getAvailableTypes();
        const typeNames = biometricAuthService.getAuthTypeNames(types);
        setBiometricTypes(typeNames);
        
        setIsLoading(false);
        
        // Auto-trigger biometric authentication immediately
        setTimeout(() => {
          handleBiometricAuth();
        }, 300);
      } else {
        setIsLoading(false);
        // If biometric is not available, disable biometric authentication
        Alert.alert(
          'Biometric Authentication Unavailable',
          'Biometric authentication is not available on this device.',
          [
            { text: 'OK', onPress: onDisableBiometric }
          ]
        );
      }
    } catch (error) {
      console.error('Error initializing biometric authentication:', error);
      setIsLoading(false);
      setIsAvailable(false);
      
      // On error, also disable biometric authentication
      Alert.alert(
        'Authentication Error',
        'There was an error with biometric authentication.',
        [
          { text: 'OK', onPress: onDisableBiometric }
        ]
      );
    }
  };

  const handleBiometricAuth = async () => {
    if (isAuthenticating) return;
    
    setIsAuthenticating(true);
    
    try {
      const authTypeName = biometricTypes[0] || 'biometric authentication';
      const result = await biometricAuthService.authenticate(
        `Use ${authTypeName} to access PassNext`
      );

      if (result.success) {
        onSuccess();
      } else {
        // If authentication fails, show retry options
        setRetryCount(prev => prev + 1);
        
        // Handle different error types
        const errorString = result.error || 'Authentication failed';
        
        if (errorString.includes('cancelled')) {
          // User cancelled - show retry option
          Alert.alert(
            'Authentication Cancelled',
            'Please use biometric authentication to continue.',
            [
              { text: 'Try Again', onPress: () => handleBiometricAuth() },
              { text: 'Disable Biometric', onPress: onDisableBiometric }
            ]
          );
        } else if (retryCount < 3) {
          // Show retry options for other errors
          Alert.alert(
            'Authentication Failed',
            errorString,
            [
              { text: 'Try Again', onPress: () => handleBiometricAuth() },
              { text: 'Disable Biometric', onPress: onDisableBiometric }
            ]
          );
        } else {
          // After 3 failed attempts, disable biometric
          Alert.alert(
            'Too Many Attempts',
            'Please try again or disable biometric authentication.',
            [
              { text: 'Disable Biometric', onPress: onDisableBiometric }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      Alert.alert(
        'Authentication Error',
        'An unexpected error occurred.',
        [
          { text: 'OK', onPress: onDisableBiometric }
        ]
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Initializing biometric authentication...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAvailable) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🔒</Text>
          </View>
          
          <Text style={styles.title}>Biometric Authentication Required</Text>
          <Text style={styles.subtitle}>
            Please set up biometric authentication on your device to continue.
          </Text>
          
          <TouchableOpacity style={styles.button} onPress={onDisableBiometric}>
            <Text style={styles.buttonText}>Continue Without Biometric</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const authTypeName = biometricTypes[0] || 'Biometric';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>
            {biometricTypes.includes('Face ID') ? '👤' : '👆'}
          </Text>
        </View>
        
        <Text style={styles.title}>Secure Access</Text>
        <Text style={styles.subtitle}>
          Use {authTypeName} to quickly and securely access PassNext
        </Text>
        
        <TouchableOpacity 
          style={[styles.button, isAuthenticating && styles.buttonDisabled]} 
          onPress={handleBiometricAuth}
          disabled={isAuthenticating}
        >
          {isAuthenticating ? (
            <ActivityIndicator color={Colors.text.inverse} />
          ) : (
            <Text style={styles.buttonText}>Use {authTypeName}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.fallbackButton} onPress={onDisableBiometric}>
          <Text style={styles.fallbackButtonText}>Continue Without Biometric</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: Colors.button.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  skipButtonText: {
    color: Colors.text.secondary,
    fontSize: 16,
  },
  fallbackButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  fallbackButtonText: {
    color: Colors.text.secondary,
    fontSize: 16,
  },
});
