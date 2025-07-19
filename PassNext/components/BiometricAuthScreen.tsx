import { Ionicons } from '@expo/vector-icons';
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
}

export const BiometricAuthScreen: React.FC<BiometricAuthScreenProps> = ({
  onSuccess,
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
        // If biometric is not available, show error and exit app
        Alert.alert(
          'Biometric Authentication Required',
          'This app requires biometric authentication to be set up on your device. Please set up fingerprint, Face ID, or other biometric authentication in your device settings and restart the app.',
          [
            { text: 'OK', onPress: () => {} }
          ]
        );
      }
    } catch (error) {
      console.error('Error initializing biometric authentication:', error);
      setIsLoading(false);
      setIsAvailable(false);
      
      // On error, show error message
      Alert.alert(
        'Authentication Error',
        'There was an error with biometric authentication. Please ensure biometric authentication is set up on your device.',
        [
          { text: 'OK', onPress: () => {} }
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
          // User cancelled - show retry option only
          Alert.alert(
            'Authentication Required',
            'Biometric authentication is required to access this app. Please authenticate to continue.',
            [
              { text: 'Try Again', onPress: () => handleBiometricAuth() }
            ]
          );
        } else if (retryCount < 5) {
          // Show retry options for other errors
          Alert.alert(
            'Authentication Failed',
            errorString + '\n\nBiometric authentication is required to access this app.',
            [
              { text: 'Try Again', onPress: () => handleBiometricAuth() }
            ]
          );
        } else {
          // After 5 failed attempts, keep trying
          Alert.alert(
            'Multiple Authentication Attempts',
            'Please ensure your biometric authentication is working properly and try again.',
            [
              { text: 'Try Again', onPress: () => handleBiometricAuth() }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      Alert.alert(
        'Authentication Error',
        'An unexpected error occurred. Please try again.',
        [
          { text: 'Try Again', onPress: () => handleBiometricAuth() }
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
          <View style={styles.loadingIconContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
          <Text style={styles.loadingText}>Setting up security...</Text>
          <Text style={styles.loadingSubtext}>Please wait a moment</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAvailable) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-outline" size={64} color={Colors.error} />
          </View>
          
          <Text style={styles.title}>Security Setup Required</Text>
          <Text style={styles.subtitle}>
            Enable fingerprint, Face ID, or PIN authentication in your device settings to secure your passwords.
          </Text>
          
          <TouchableOpacity style={styles.retryButton} onPress={initializeBiometricAuth}>
            <Ionicons name="refresh-outline" size={20} color={Colors.text.primary} style={styles.retryIcon} />
            <Text style={styles.retryButtonText}>Check Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const authTypeName = biometricTypes[0] || 'Biometric';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* App Branding */}
        <View style={styles.brandContainer}>
          <Text style={styles.appName}>PassNext</Text>
          <Text style={styles.tagline}>Secure • Simple • Private</Text>
        </View>

        {/* Biometric Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.biometricIconWrapper}>
            <Ionicons 
              name={biometricTypes.includes('Face ID') ? "scan-outline" : "finger-print-outline"} 
              size={48} 
              color={Colors.primary} 
            />
          </View>
        </View>
        
        <Text style={styles.title}>Unlock with {authTypeName}</Text>
        <Text style={styles.subtitle}>
          Authenticate to securely access your passwords
        </Text>
        
        {/* Main Auth Button */}
        <TouchableOpacity 
          style={[styles.authButton, isAuthenticating && styles.authButtonDisabled]} 
          onPress={handleBiometricAuth}
          disabled={isAuthenticating}
        >
          {isAuthenticating ? (
            <View style={styles.authButtonContent}>
              <ActivityIndicator color={Colors.background} size="small" />
              <Text style={styles.authButtonTextLoading}>Authenticating...</Text>
            </View>
          ) : (
            <View style={styles.authButtonContent}>
              <Ionicons 
                name={biometricTypes.includes('Face ID') ? "scan" : "finger-print"} 
                size={20} 
                color={Colors.background} 
                style={styles.authButtonIcon}
              />
              <Text style={styles.authButtonText}>Authenticate</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.securityNote}>
          Your biometric data stays secure on your device
        </Text>
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
    paddingHorizontal: 32,
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appName: {
    fontSize: 32,
    fontWeight: '600',
    color: Colors.text.primary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: Colors.text.tertiary,
    fontWeight: '400',
  },
  iconContainer: {
    marginBottom: 32,
  },
  biometricIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
    fontWeight: '400',
  },
  authButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 240,
    minHeight: 52,
    marginBottom: 24,
  },
  authButtonDisabled: {
    opacity: 0.6,
  },
  authButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authButtonIcon: {
    marginRight: 8,
  },
  authButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  authButtonTextLoading: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  retryIcon: {
    marginRight: 8,
  },
  retryButtonText: {
    color: Colors.text.primary,
    fontSize: 15,
    fontWeight: '500',
  },
  securityNote: {
    color: Colors.text.tertiary,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 18,
  },
  // Legacy styles - keeping for backward compatibility
  icon: {
    fontSize: 48,
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
  requiredText: {
    color: Colors.text.tertiary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
});
