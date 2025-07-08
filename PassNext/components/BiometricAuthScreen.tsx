import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { biometricAuthService } from '../services/biometricAuthService';

interface BiometricAuthScreenProps {
  onSuccess: () => void;
  onSkip: () => void;
}

export const BiometricAuthScreen: React.FC<BiometricAuthScreenProps> = ({
  onSuccess,
  onSkip,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricTypes, setBiometricTypes] = useState<string[]>([]);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const available = await biometricAuthService.isAvailable();
      setIsAvailable(available);

      if (available) {
        const types = await biometricAuthService.getAvailableTypes();
        const typeNames = biometricAuthService.getAuthTypeNames(types);
        setBiometricTypes(typeNames);
      }
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setIsAvailable(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    setIsAuthenticating(true);
    
    try {
      const authTypeName = biometricTypes[0] || 'biometric authentication';
      const result = await biometricAuthService.authenticate(
        `Use ${authTypeName} to access PassNext`
      );

      if (result.success) {
        onSuccess();
      } else {
        Alert.alert(
          'Authentication Failed',
          result.error || 'Please try again',
          [
            { text: 'Try Again', onPress: handleBiometricAuth },
            { text: 'Skip', onPress: onSkip, style: 'cancel' }
          ]
        );
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [
          { text: 'Try Again', onPress: handleBiometricAuth },
          { text: 'Skip', onPress: onSkip, style: 'cancel' }
        ]
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Biometric Authentication',
      'Are you sure you want to skip biometric authentication? You can enable it later in settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: onSkip, style: 'destructive' }
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Checking biometric availability...</Text>
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
          
          <Text style={styles.title}>Biometric Authentication Unavailable</Text>
          <Text style={styles.subtitle}>
            Biometric authentication is not available on this device or not set up.
          </Text>
          
          <TouchableOpacity style={styles.button} onPress={onSkip}>
            <Text style={styles.buttonText}>Continue</Text>
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
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Use {authTypeName}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
    backgroundColor: '#f0f0f0',
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
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#007AFF',
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
  },
});
