import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometricType?: string;
}

export const biometricAuthService = {
  // Check if biometric authentication is available
  isAvailable: async (): Promise<boolean> => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  },

  // Get available authentication types
  getAvailableTypes: async (): Promise<LocalAuthentication.AuthenticationType[]> => {
    try {
      return await LocalAuthentication.supportedAuthenticationTypesAsync();
    } catch (error) {
      console.error('Error getting biometric types:', error);
      return [];
    }
  },

  // Get human-readable authentication type names
  getAuthTypeNames: (types: LocalAuthentication.AuthenticationType[]): string[] => {
    const typeNames: string[] = [];
    
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      typeNames.push('Fingerprint');
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      typeNames.push('Face ID');
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      typeNames.push('Iris');
    }
    
    return typeNames.length > 0 ? typeNames : ['Biometric'];
  },

  // Authenticate with biometrics
  authenticate: async (promptMessage?: string): Promise<BiometricAuthResult> => {
    try {
      // Check if biometric auth is available
      const isAvailable = await biometricAuthService.isAvailable();
      if (!isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication is not available on this device'
        };
      }

      // Get available types for better user messaging
      const types = await biometricAuthService.getAvailableTypes();
      const typeNames = biometricAuthService.getAuthTypeNames(types);
      const authTypeName = typeNames[0] || 'Biometric';

      // Perform authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage || `Use ${authTypeName} to access the app`,
        disableDeviceFallback: false, // Allow PIN/Password fallback
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use PIN/Password',
      });

      if (result.success) {
        return {
          success: true,
          biometricType: authTypeName
        };
      } else {
        let errorMessage = 'Authentication failed';
        
        // Provide user-friendly error messages
        if (result.error) {
          errorMessage = `Authentication failed: ${result.error}`;
        }

        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during authentication'
      };
    }
  },

  // Show alert prompting user to enable biometrics
  promptToEnableBiometrics: async (): Promise<void> => {
    const types = await biometricAuthService.getAvailableTypes();
    const typeNames = biometricAuthService.getAuthTypeNames(types);
    const authTypeName = typeNames.join(' or ') || 'biometric authentication';

    Alert.alert(
      'Enable Biometric Authentication',
      `Would you like to enable ${authTypeName} for faster and more secure access to the app?`,
      [
        { text: 'Not Now', style: 'cancel' },
        { 
          text: 'Enable', 
          onPress: () => {
            Alert.alert(
              'Setup Required',
              `Please go to your device settings to set up ${authTypeName}.`,
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  }
};
