import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
  trigger?: Notifications.NotificationTriggerInput | null;
}

export class NotificationService {
  private static instance: NotificationService;
  private initialized = false;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Permission not granted for notifications');
        return false;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });

        // Security notifications channel
        await Notifications.setNotificationChannelAsync('security', {
          name: 'Security Alerts',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF0000',
        });
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  async scheduleNotification(notification: NotificationData): Promise<string | null> {
    try {
      if (!this.initialized) {
        const success = await this.initialize();
        if (!success) return null;
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
        },
        trigger: notification.trigger || null,
      });

      return identifier;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return null;
    }
  }

  async scheduleSecurityAlert(title: string, body: string, data?: any): Promise<string | null> {
    return this.scheduleNotification({
      title,
      body,
      data: { ...data, type: 'security' },
    });
  }

  async schedulePasswordExpiryReminder(
    serviceName: string,
    daysUntilExpiry: number,
    passwordId: string
  ): Promise<string | null> {
    const title = `Password Expiry Reminder`;
    const body = `Your password for ${serviceName} will expire in ${daysUntilExpiry} days`;
    
    return this.scheduleNotification({
      title,
      body,
      data: { 
        type: 'password_expiry',
        passwordId,
        serviceName,
        daysUntilExpiry 
      },
    });
  }

  async scheduleBreachAlert(serviceName: string, passwordId: string): Promise<string | null> {
    const title = `🚨 Security Alert`;
    const body = `Your password for ${serviceName} may have been compromised in a data breach`;
    
    return this.scheduleSecurityAlert(title, body, {
      type: 'breach_alert',
      passwordId,
      serviceName,
    });
  }

  async scheduleWeakPasswordAlert(serviceName: string, passwordId: string): Promise<string | null> {
    const title = `⚠️ Weak Password Detected`;
    const body = `Your password for ${serviceName} is weak and should be updated`;
    
    return this.scheduleSecurityAlert(title, body, {
      type: 'weak_password',
      passwordId,
      serviceName,
    });
  }

  async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  // Store notification preferences
  async setNotificationPreferences(preferences: {
    securityAlerts: boolean;
    passwordExpiry: boolean;
    breachAlerts: boolean;
    weakPasswordAlerts: boolean;
  }): Promise<void> {
    try {
      await AsyncStorage.setItem('notification_preferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  }

  async getNotificationPreferences(): Promise<{
    securityAlerts: boolean;
    passwordExpiry: boolean;
    breachAlerts: boolean;
    weakPasswordAlerts: boolean;
  }> {
    try {
      const preferences = await AsyncStorage.getItem('notification_preferences');
      return preferences ? JSON.parse(preferences) : {
        securityAlerts: true,
        passwordExpiry: true,
        breachAlerts: true,
        weakPasswordAlerts: true,
      };
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
      return {
        securityAlerts: true,
        passwordExpiry: true,
        breachAlerts: true,
        weakPasswordAlerts: true,
      };
    }
  }
}

export const notificationService = NotificationService.getInstance();
