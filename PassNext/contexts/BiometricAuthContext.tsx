import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BiometricAuthContextType {
  isBiometricEnabled: boolean;
  isBiometricRequired: boolean;
  isBiometricAuthenticated: boolean;
  setBiometricEnabled: (enabled: boolean) => void;
  setBiometricAuthenticated: (authenticated: boolean) => void;
  skipBiometric: () => void;
}

const BiometricAuthContext = createContext<BiometricAuthContextType>({
  isBiometricEnabled: false,
  isBiometricRequired: false,
  isBiometricAuthenticated: false,
  setBiometricEnabled: () => {},
  setBiometricAuthenticated: () => {},
  skipBiometric: () => {},
});

export const useBiometricAuth = () => {
  const context = useContext(BiometricAuthContext);
  if (!context) {
    throw new Error('useBiometricAuth must be used within a BiometricAuthProvider');
  }
  return context;
};

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_SKIPPED_KEY = 'biometric_skipped';

export const BiometricAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isBiometricAuthenticated, setIsBiometricAuthenticated] = useState(false);
  const [isBiometricSkipped, setIsBiometricSkipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBiometricSettings();
  }, []);

  const loadBiometricSettings = async () => {
    try {
      const [enabled, skipped] = await Promise.all([
        AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY),
        AsyncStorage.getItem(BIOMETRIC_SKIPPED_KEY),
      ]);

      setIsBiometricEnabled(enabled === 'true');
      setIsBiometricSkipped(skipped === 'true');
    } catch (error) {
      console.error('Error loading biometric settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setBiometricEnabled = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled.toString());
      setIsBiometricEnabled(enabled);
      
      if (enabled) {
        // If enabling biometric, clear the skipped flag
        await AsyncStorage.removeItem(BIOMETRIC_SKIPPED_KEY);
        setIsBiometricSkipped(false);
      }
    } catch (error) {
      console.error('Error saving biometric enabled setting:', error);
    }
  };

  const setBiometricAuthenticated = (authenticated: boolean) => {
    setIsBiometricAuthenticated(authenticated);
  };

  const skipBiometric = async () => {
    try {
      await AsyncStorage.setItem(BIOMETRIC_SKIPPED_KEY, 'true');
      setIsBiometricSkipped(true);
      setIsBiometricAuthenticated(true); // Allow access for this session
    } catch (error) {
      console.error('Error saving biometric skipped setting:', error);
    }
  };

  // Determine if biometric authentication is required
  const isBiometricRequired = isBiometricEnabled && !isBiometricAuthenticated;

  if (isLoading) {
    return null; // or a loading component
  }

  return (
    <BiometricAuthContext.Provider
      value={{
        isBiometricEnabled,
        isBiometricRequired,
        isBiometricAuthenticated,
        setBiometricEnabled,
        setBiometricAuthenticated,
        skipBiometric,
      }}
    >
      {children}
    </BiometricAuthContext.Provider>
  );
};
