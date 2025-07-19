import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import PushNotification, { Importance } from 'react-native-push-notification';
import { Password } from './passwordService';
import { passwordStrengthService } from './passwordStrengthService';

export interface NativeNotificationData {
  id: string;
  type: 'password_expiry' | 'weak_password_daily';
  title: string;
  body: string;
  data?: any;
  scheduledDate?: Date;
}

export interface NotificationSettings {
  passwordExpiryEnabled: boolean;
  weakPasswordDailyEnabled: boolean;
  weakPasswordDailyTime: string; // HH:MM format
  expiryReminderDays: number[]; // Days before expiry to remind
}

export class NativeNotificationService {
  private static instance: NativeNotificationService;
  private readonly SETTINGS_KEY = 'native_notification_settings';
  private readonly SENT_NOTIFICATIONS_KEY = 'sent_native_notifications';
  private readonly WEAK_PASSWORD_DAILY_KEY = 'last_weak_password_check';
  private initialized = false;

  static getInstance(): NativeNotificationService {
    if (!NativeNotificationService.instance) {
      NativeNotificationService.instance = new NativeNotificationService();
    }
    return NativeNotificationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Configure push notifications
      PushNotification.configure({
        onRegister: function (token) {
          console.log('Push notification token:', token);
        },
        onNotification: function (notification) {
          console.log('Notification received:', notification);
        },
        onAction: function (notification) {
          console.log('Notification action:', notification.action);
        },
        onRegistrationError: function (err) {
          console.error('Notification registration error:', err.message, err);
        },
        permissions: {
          alert: true,
          badge: true,
          sound: true,
        },
        popInitialNotification: true,
        requestPermissions: true,
      });

      // Create notification channels for Android
      if (Platform.OS === 'android') {
        PushNotification.createChannel(
          {
            channelId: 'password-expiry',
            channelName: 'Password Expiry Reminders',
            channelDescription: 'Notifications for password expiry reminders',
            playSound: true,
            soundName: 'default',
            importance: Importance.HIGH,
            vibrate: true,
          },
          (created) => console.log(`Password expiry channel created: ${created}`)
        );

        PushNotification.createChannel(
          {
            channelId: 'weak-password',
            channelName: 'Security Alerts',
            channelDescription: 'Notifications for weak password alerts',
            playSound: true,
            soundName: 'default',
            importance: Importance.HIGH,
            vibrate: true,
          },
          (created) => console.log(`Weak password channel created: ${created}`)
        );
      }

      this.initialized = true;
      console.log('Native notification service initialized');
    } catch (error) {
      console.error('Failed to initialize native notifications:', error);
    }
  }

  /**
   * Get notification settings
   */
  async getSettings(): Promise<NotificationSettings> {
    try {
      const settings = await AsyncStorage.getItem(this.SETTINGS_KEY);
      return settings ? JSON.parse(settings) : {
        passwordExpiryEnabled: true,
        weakPasswordDailyEnabled: true,
        weakPasswordDailyTime: '09:00',
        expiryReminderDays: [30, 14, 7, 1],
      };
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      return {
        passwordExpiryEnabled: true,
        weakPasswordDailyEnabled: true,
        weakPasswordDailyTime: '09:00',
        expiryReminderDays: [30, 14, 7, 1],
      };
    }
  }

  /**
   * Update notification settings
   */
  async updateSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const newSettings = { ...currentSettings, ...settings };
      await AsyncStorage.setItem(this.SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    }
  }

  /**
   * Schedule password expiry notifications
   */
  async schedulePasswordExpiryNotifications(passwords: Password[]): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.passwordExpiryEnabled) return;

    const now = new Date();

    for (const password of passwords) {
      if (!password.expiryDate) continue;

      const expiryDate = new Date(password.expiryDate);
      
      for (const reminderDays of settings.expiryReminderDays) {
        const reminderDate = new Date(expiryDate);
        reminderDate.setDate(reminderDate.getDate() - reminderDays);

        // Only schedule future notifications
        if (reminderDate > now) {
          const notificationId = `expiry-${password.id}-${reminderDays}`;
          
          // Check if notification already scheduled
          const alreadyScheduled = await this.isNotificationScheduled(notificationId);
          if (!alreadyScheduled) {
            await this.scheduleNotification({
              id: notificationId,
              type: 'password_expiry',
              title: 'Password Expiry Reminder',
              body: `Your password for ${password.service} will expire in ${reminderDays} day${reminderDays > 1 ? 's' : ''}`,
              scheduledDate: reminderDate,
              data: {
                passwordId: password.id,
                serviceName: password.service,
                daysUntilExpiry: reminderDays,
                expiryDate: password.expiryDate,
              },
            });
          }
        }
      }
    }
  }

  /**
   * Schedule daily weak password notification if any weak passwords exist
   */
  async scheduleDailyWeakPasswordCheck(passwords: Password[]): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.weakPasswordDailyEnabled) return;

    // Check if we already sent notification today
    const lastCheckDate = await AsyncStorage.getItem(this.WEAK_PASSWORD_DAILY_KEY);
    const today = new Date().toDateString();
    
    if (lastCheckDate === today) {
      return; // Already checked today
    }

    // Check for weak passwords
    const weakPasswords = passwords.filter(password => {
      const strength = passwordStrengthService.analyzePassword(password.password);
      return strength.score <= 2; // Weak passwords (score 0-2)
    });

    if (weakPasswords.length > 0) {
      const notificationId = `weak-password-daily-${Date.now()}`;
      
      await this.sendImmediateNotification({
        id: notificationId,
        type: 'weak_password_daily',
        title: 'Weak Passwords Detected',
        body: `You have ${weakPasswords.length} weak password${weakPasswords.length > 1 ? 's' : ''} that should be updated for better security`,
        data: {
          weakPasswordCount: weakPasswords.length,
          weakPasswords: weakPasswords.map(p => ({
            id: p.id,
            serviceName: p.service,
          })),
        },
      });
    }

    // Mark as checked for today
    await AsyncStorage.setItem(this.WEAK_PASSWORD_DAILY_KEY, today);
  }

  /**
   * Schedule a notification for a specific date
   */
  private async scheduleNotification(notification: NativeNotificationData): Promise<void> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const { id, title, body, scheduledDate, type } = notification;

      PushNotification.localNotificationSchedule({
        id: id,
        title: title,
        message: body,
        date: scheduledDate || new Date(Date.now() + 1000), // Default to 1 second from now
        channelId: type === 'password_expiry' ? 'password-expiry' : 'weak-password',
        userInfo: notification.data || {},
        playSound: true,
        soundName: 'default',
        vibrate: true,
        vibration: 300,
        actions: ['View', 'Dismiss'],
      });

      // Store notification info
      await this.storeScheduledNotification(notification);
      
      console.log(`📅 Scheduled notification: ${title} for ${scheduledDate?.toISOString()}`);
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  }

  /**
   * Send immediate notification
   */
  private async sendImmediateNotification(notification: NativeNotificationData): Promise<void> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const { id, title, body, type } = notification;

      PushNotification.localNotification({
        id: id,
        title: title,
        message: body,
        channelId: type === 'password_expiry' ? 'password-expiry' : 'weak-password',
        userInfo: notification.data || {},
        playSound: true,
        soundName: 'default',
        vibrate: true,
        vibration: 300,
        actions: ['View', 'Dismiss'],
      });

      // Store notification info
      await this.storeSentNotification(notification);
      
      console.log(`📨 Sent immediate notification: ${title}`);
    } catch (error) {
      console.error('Failed to send immediate notification:', error);
    }
  }

  /**
   * Check if a notification is already scheduled
   */
  private async isNotificationScheduled(notificationId: string): Promise<boolean> {
    try {
      const scheduled = await AsyncStorage.getItem('scheduled_notifications');
      const notifications = scheduled ? JSON.parse(scheduled) : [];
      return notifications.some((n: NativeNotificationData) => n.id === notificationId);
    } catch (error) {
      console.error('Failed to check scheduled notifications:', error);
      return false;
    }
  }

  /**
   * Store scheduled notification info
   */
  private async storeScheduledNotification(notification: NativeNotificationData): Promise<void> {
    try {
      const scheduled = await AsyncStorage.getItem('scheduled_notifications');
      const notifications = scheduled ? JSON.parse(scheduled) : [];
      notifications.push(notification);
      await AsyncStorage.setItem('scheduled_notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to store scheduled notification:', error);
    }
  }

  /**
   * Store sent notification info
   */
  private async storeSentNotification(notification: NativeNotificationData): Promise<void> {
    try {
      const sent = await AsyncStorage.getItem(this.SENT_NOTIFICATIONS_KEY);
      const notifications = sent ? JSON.parse(sent) : [];
      notifications.push({
        ...notification,
        sentAt: new Date(),
      });
      await AsyncStorage.setItem(this.SENT_NOTIFICATIONS_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to store sent notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      PushNotification.cancelAllLocalNotifications();
      await AsyncStorage.removeItem('scheduled_notifications');
      await AsyncStorage.removeItem(this.SENT_NOTIFICATIONS_KEY);
      await AsyncStorage.removeItem(this.WEAK_PASSWORD_DAILY_KEY);
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Failed to cancel notifications:', error);
    }
  }

  /**
   * Cancel specific notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      PushNotification.cancelLocalNotifications({ id: notificationId });
      
      // Remove from scheduled notifications
      const scheduled = await AsyncStorage.getItem('scheduled_notifications');
      if (scheduled) {
        const notifications = JSON.parse(scheduled);
        const filtered = notifications.filter((n: NativeNotificationData) => n.id !== notificationId);
        await AsyncStorage.setItem('scheduled_notifications', JSON.stringify(filtered));
      }
      
      console.log(`Cancelled notification: ${notificationId}`);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  /**
   * Get notification history
   */
  async getNotificationHistory(): Promise<NativeNotificationData[]> {
    try {
      const history = await AsyncStorage.getItem(this.SENT_NOTIFICATIONS_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Failed to get notification history:', error);
      return [];
    }
  }

  /**
   * Check and send daily notifications (call this from the app periodically)
   */
  async checkDailyNotifications(passwords: Password[]): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.weakPasswordDailyEnabled) return;

    const now = new Date();
    const [hours, minutes] = settings.weakPasswordDailyTime.split(':').map(Number);
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    // Check if current time matches scheduled time (within 30 minutes)
    const timeDiff = Math.abs(now.getTime() - scheduledTime.getTime());
    const thirtyMinutes = 30 * 60 * 1000;

    if (timeDiff <= thirtyMinutes) {
      await this.scheduleDailyWeakPasswordCheck(passwords);
    }
  }
}

export const nativeNotificationService = NativeNotificationService.getInstance();
