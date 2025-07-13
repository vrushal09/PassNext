import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

interface BiometricAuthContextType {
  isBiometricEnabled: boolean;
  isBiometricRequired: boolean;
  isBiometricAuthenticated: boolean;
  setBiometricEnabled: (enabled: boolean) => void;
  setBiometricAuthenticated: (authenticated: boolean) => void;
  resetBiometricAuth: () => void;
}

const BiometricAuthContext = createContext<BiometricAuthContextType>({
  isBiometricEnabled: false,
  isBiometricRequired: false,
  isBiometricAuthenticated: false,
  setBiometricEnabled: () => {},
  setBiometricAuthenticated: () => {},
  resetBiometricAuth: () => {},
});

export const useBiometricAuth = () => {
  const context = useContext(BiometricAuthContext);
  if (!context) {
    throw new Error('useBiometricAuth must be used within a BiometricAuthProvider');
  }
  return context;
};

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_SESSION_KEY = 'biometric_session';

export const BiometricAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isBiometricAuthenticated, setIsBiometricAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBiometricSettings();
  }, []);

  // Reset biometric auth when user logs out
  useEffect(() => {
    if (!user) {
      setIsBiometricAuthenticated(false);
      // Clear session on logout
      AsyncStorage.removeItem(BIOMETRIC_SESSION_KEY).catch(console.error);
    }
  }, [user]);

  const loadBiometricSettings = async () => {
    try {
      const [enabled, session] = await Promise.all([
        AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY),
        AsyncStorage.getItem(BIOMETRIC_SESSION_KEY),
      ]);

      setIsBiometricEnabled(enabled === 'true');
      
      // Check if we have a valid session (within last 24 hours)
      if (session) {
        const sessionTime = parseInt(session);
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        
        if (now - sessionTime < twentyFourHours) {
          setIsBiometricAuthenticated(true);
        }
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
      
      if (!enabled) {
        // If disabling biometric, clear session
        await AsyncStorage.removeItem(BIOMETRIC_SESSION_KEY);
        setIsBiometricAuthenticated(false);
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

  const resetBiometricAuth = async () => {
    try {
      await AsyncStorage.removeItem(BIOMETRIC_SESSION_KEY);
      setIsBiometricAuthenticated(false);
    } catch (error) {
      console.error('Error resetting biometric auth:', error);
    }
  };

  // Determine if biometric authentication is required
  // Only require biometric if it's enabled AND not authenticated
  const isBiometricRequired = isBiometricEnabled && !isBiometricAuthenticated;

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
          resetBiometricAuth,
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
        resetBiometricAuth,
      }}
    >
      {children}
    </BiometricAuthContext.Provider>
  );
};
