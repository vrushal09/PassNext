import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
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
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(true); // Always enabled
  const [isBiometricAuthenticated, setIsBiometricAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    loadBiometricSettings();
    
    // Listen for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      // App came to foreground - always require biometric auth again
      setIsBiometricAuthenticated(false);
      // Clear session to ensure fresh authentication
      AsyncStorage.removeItem(BIOMETRIC_SESSION_KEY).catch(console.error);
    }
    setAppState(nextAppState);
  };

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
      const session = await AsyncStorage.getItem(BIOMETRIC_SESSION_KEY);

      // Biometric is always enabled
      setIsBiometricEnabled(true);
      
      // Check if we have a valid session (within last 5 minutes for app foreground)
      if (session) {
        const sessionTime = parseInt(session);
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
        
        if (now - sessionTime < fiveMinutes) {
          setIsBiometricAuthenticated(true);
        } else {
          // Clear expired session
          await AsyncStorage.removeItem(BIOMETRIC_SESSION_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading biometric settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setBiometricEnabled = async (enabled: boolean) => {
    // Biometric is always enabled - ignore disable requests
    if (!enabled) {
      console.warn('Biometric authentication cannot be disabled');
      return;
    }
    
    try {
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
      setIsBiometricEnabled(true);
    } catch (error) {
      console.error('Error saving biometric enabled setting:', error);
    }
  };

  const setBiometricAuthenticated = async (authenticated: boolean) => {
    setIsBiometricAuthenticated(authenticated);
    
    if (authenticated) {
      // Store session timestamp - valid for 5 minutes
      try {
        await AsyncStorage.setItem(BIOMETRIC_SESSION_KEY, Date.now().toString());
      } catch (error) {
        console.error('Error saving biometric session:', error);
      }
    } else {
      // Clear session when authentication is lost
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
  // Always required since biometric is always enabled
  const isBiometricRequired = !isBiometricAuthenticated;

  if (isLoading) {
    // Don't block rendering, but require biometric auth
    return (
      <BiometricAuthContext.Provider
        value={{
          isBiometricEnabled: true,
          isBiometricRequired: true,
          isBiometricAuthenticated: false,
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
