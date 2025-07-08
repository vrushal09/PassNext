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
const BIOMETRIC_SESSION_KEY = 'biometric_session';

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
      const [enabled, skipped, session] = await Promise.all([
        AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY),
        AsyncStorage.getItem(BIOMETRIC_SKIPPED_KEY),
        AsyncStorage.getItem(BIOMETRIC_SESSION_KEY),
      ]);

      setIsBiometricEnabled(enabled === 'true');
      setIsBiometricSkipped(skipped === 'true');
      
      // Check if we have a valid session (within last 24 hours)
      if (session) {
        const sessionTime = parseInt(session);
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        
        if (now - sessionTime < twentyFourHours) {
          setIsBiometricAuthenticated(true);
        }
      }
      
      // If biometric was skipped, don't require it on restart
      if (skipped === 'true') {
        setIsBiometricAuthenticated(true);
      }
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

  const setBiometricAuthenticated = async (authenticated: boolean) => {
    setIsBiometricAuthenticated(authenticated);
    
    if (authenticated) {
      // Store session timestamp
      try {
        await AsyncStorage.setItem(BIOMETRIC_SESSION_KEY, Date.now().toString());
      } catch (error) {
        console.error('Error saving biometric session:', error);
      }
    } else {
      // Clear session when logged out
      try {
        await AsyncStorage.removeItem(BIOMETRIC_SESSION_KEY);
      } catch (error) {
        console.error('Error clearing biometric session:', error);
      }
    }
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
  // Only require biometric if it's enabled AND not authenticated AND not skipped
  const isBiometricRequired = isBiometricEnabled && !isBiometricAuthenticated && !isBiometricSkipped;

  if (isLoading) {
    // Don't block rendering, just use default values while loading
    return (
      <BiometricAuthContext.Provider
        value={{
          isBiometricEnabled: false,
          isBiometricRequired: false,
          isBiometricAuthenticated: true, // Allow access while loading
          setBiometricEnabled,
          setBiometricAuthenticated,
          skipBiometric,
        }}
      >
        {children}
      </BiometricAuthContext.Provider>
    );
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
