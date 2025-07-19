import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { nativeNotificationService } from '../services/nativeNotificationService';
import { passwordService } from '../services/passwordService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  checkForNotifications: () => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  checkForNotifications: async () => {},
  cancelAllNotifications: async () => {},
});

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      initializeNotifications();
      
      // Check for notifications every 30 minutes
      const interval = setInterval(() => {
        checkForNotifications();
      }, 30 * 60 * 1000);

      // Initial check after 5 seconds
      const timeout = setTimeout(() => {
        checkForNotifications();
      }, 5000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [user]);

  const initializeNotifications = async () => {
    await nativeNotificationService.initialize();
    console.log('Native notifications initialized');
  };

  const checkForNotifications = async () => {
    if (!user) return;

    try {
      // Get all passwords for the user
      const passwordsResult = await passwordService.getPasswords(user.uid);
      if (passwordsResult.success && passwordsResult.passwords) {
        // Schedule expiry notifications
        await nativeNotificationService.schedulePasswordExpiryNotifications(passwordsResult.passwords);
        
        // Check for daily weak password notifications
        await nativeNotificationService.checkDailyNotifications(passwordsResult.passwords);
        
        console.log('Notification check completed');
      }
    } catch (error) {
      console.error('Error checking for notifications:', error);
    }
  };

  const cancelAllNotifications = async () => {
    await nativeNotificationService.cancelAllNotifications();
  };

  return (
    <NotificationContext.Provider value={{
      checkForNotifications,
      cancelAllNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
