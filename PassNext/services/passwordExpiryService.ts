import { Password } from './passwordService';
import { notificationService } from './notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ExpiryReminderSettings {
  enabled: boolean;
  reminderDays: number[]; // Days before expiry to send reminders (e.g., [30, 14, 7, 1])
  defaultExpiryPeriod: number; // Default expiry period in days
  autoExtendOnUpdate: boolean;
}

export interface ExpiryScheduledNotification {
  passwordId: string;
  serviceName: string;
  expiryDate: Date;
  reminderDate: Date;
  notificationId: string;
  sent: boolean;
}

export class PasswordExpiryService {
  private static instance: PasswordExpiryService;
  private readonly STORAGE_KEY = 'password_expiry_settings';
  private readonly SCHEDULED_NOTIFICATIONS_KEY = 'scheduled_expiry_notifications';

  static getInstance(): PasswordExpiryService {
    if (!PasswordExpiryService.instance) {
      PasswordExpiryService.instance = new PasswordExpiryService();
    }
    return PasswordExpiryService.instance;
  }

  /**
   * Get expiry reminder settings
   */
  async getExpirySettings(): Promise<ExpiryReminderSettings> {
    try {
      const settings = await AsyncStorage.getItem(this.STORAGE_KEY);
      return settings ? JSON.parse(settings) : {
        enabled: true,
        reminderDays: [30, 14, 7, 1],
        defaultExpiryPeriod: 90, // 3 months
        autoExtendOnUpdate: true,
      };
    } catch (error) {
      console.error('Failed to load expiry settings:', error);
      return {
        enabled: true,
        reminderDays: [30, 14, 7, 1],
        defaultExpiryPeriod: 90,
        autoExtendOnUpdate: true,
      };
    }
  }

  /**
   * Update expiry reminder settings
   */
  async updateExpirySettings(settings: ExpiryReminderSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save expiry settings:', error);
    }
  }

  /**
   * Calculate expiry date for a password
   */
  calculateExpiryDate(createdAt: Date, expiryPeriodDays?: number): Date {
    const period = expiryPeriodDays || 90; // Default 3 months
    const expiryDate = new Date(createdAt);
    expiryDate.setDate(expiryDate.getDate() + period);
    return expiryDate;
  }

  /**
   * Check if password is expired
   */
  isPasswordExpired(password: Password): boolean {
    if (!password.expiryDate) return false;
    return new Date() > password.expiryDate;
  }

  /**
   * Check if password is expiring soon
   */
  isPasswordExpiringSoon(password: Password, warningDays: number = 14): boolean {
    if (!password.expiryDate) return false;
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + warningDays);
    return password.expiryDate <= warningDate;
  }

  /**
   * Get days until expiry
   */
  getDaysUntilExpiry(password: Password): number | null {
    if (!password.expiryDate) return null;
    const now = new Date();
    const diffTime = password.expiryDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get expired passwords
   */
  getExpiredPasswords(passwords: Password[]): Password[] {
    return passwords.filter(password => this.isPasswordExpired(password));
  }

  /**
   * Get passwords expiring soon
   */
  getExpiringSoonPasswords(passwords: Password[], warningDays: number = 14): Password[] {
    return passwords.filter(password => 
      this.isPasswordExpiringSoon(password, warningDays) && 
      !this.isPasswordExpired(password)
    );
  }

  /**
   * Schedule expiry reminders for a password
   */
  async scheduleExpiryReminders(password: Password): Promise<void> {
    if (!password.expiryDate || !password.id) return;

    const settings = await this.getExpirySettings();
    if (!settings.enabled) return;

    const scheduledNotifications: ExpiryScheduledNotification[] = [];

    for (const daysBefore of settings.reminderDays) {
      const reminderDate = new Date(password.expiryDate);
      reminderDate.setDate(reminderDate.getDate() - daysBefore);

      // Only schedule if reminder date is in the future
      if (reminderDate > new Date()) {
        try {
          const notificationId = await notificationService.scheduleNotification({
            title: `Password Expiry Reminder`,
            body: `Your password for ${password.service} expires in ${daysBefore} days`,
            data: {
              type: 'password_expiry',
              passwordId: password.id,
              serviceName: password.service,
              daysUntilExpiry: daysBefore,
            },
            trigger: {
              type: 'date',
              date: reminderDate,
            } as any,
          });

          if (notificationId) {
            scheduledNotifications.push({
              passwordId: password.id,
              serviceName: password.service,
              expiryDate: password.expiryDate,
              reminderDate,
              notificationId,
              sent: false,
            });
          }
        } catch (error) {
          console.error('Failed to schedule expiry reminder:', error);
        }
      }
    }

    // Store scheduled notifications
    await this.storeScheduledNotifications(scheduledNotifications);
  }

  /**
   * Cancel expiry reminders for a password
   */
  async cancelExpiryReminders(passwordId: string): Promise<void> {
    try {
      const scheduledNotifications = await this.getScheduledNotifications();
      const passwordNotifications = scheduledNotifications.filter(
        notification => notification.passwordId === passwordId
      );

      // Cancel scheduled notifications
      for (const notification of passwordNotifications) {
        await notificationService.cancelNotification(notification.notificationId);
      }

      // Remove from stored notifications
      const updatedNotifications = scheduledNotifications.filter(
        notification => notification.passwordId !== passwordId
      );
      await this.storeScheduledNotifications(updatedNotifications);
    } catch (error) {
      console.error('Failed to cancel expiry reminders:', error);
    }
  }

  /**
   * Update expiry reminders when password is updated
   */
  async updateExpiryReminders(password: Password): Promise<void> {
    // Cancel existing reminders
    if (password.id) {
      await this.cancelExpiryReminders(password.id);
    }

    // Schedule new reminders
    await this.scheduleExpiryReminders(password);
  }

  /**
   * Extend password expiry
   */
  async extendPasswordExpiry(
    password: Password, 
    extensionDays: number
  ): Promise<Date> {
    const currentExpiry = password.expiryDate || new Date();
    const newExpiryDate = new Date(currentExpiry);
    newExpiryDate.setDate(newExpiryDate.getDate() + extensionDays);

    // Update the password with new expiry date
    const updatedPassword = { ...password, expiryDate: newExpiryDate };
    await this.updateExpiryReminders(updatedPassword);

    return newExpiryDate;
  }

  /**
   * Set custom expiry date for password
   */
  async setCustomExpiryDate(password: Password, expiryDate: Date): Promise<void> {
    const updatedPassword = { ...password, expiryDate };
    await this.updateExpiryReminders(updatedPassword);
  }

  /**
   * Generate expiry report
   */
  async generateExpiryReport(passwords: Password[]): Promise<{
    expired: Password[];
    expiringSoon: Password[];
    expiring30Days: Password[];
    healthy: Password[];
    withoutExpiry: Password[];
  }> {
    const settings = await this.getExpirySettings();
    const expired = this.getExpiredPasswords(passwords);
    const expiringSoon = this.getExpiringSoonPasswords(passwords, 14);
    const expiring30Days = this.getExpiringSoonPasswords(passwords, 30);
    const withoutExpiry = passwords.filter(p => !p.expiryDate);
    const healthy = passwords.filter(p => 
      p.expiryDate && 
      !this.isPasswordExpired(p) && 
      !this.isPasswordExpiringSoon(p, 30)
    );

    return {
      expired,
      expiringSoon,
      expiring30Days,
      healthy,
      withoutExpiry,
    };
  }

  /**
   * Store scheduled notifications
   */
  private async storeScheduledNotifications(
    notifications: ExpiryScheduledNotification[]
  ): Promise<void> {
    try {
      const existing = await this.getScheduledNotifications();
      const merged = [...existing, ...notifications];
      await AsyncStorage.setItem(
        this.SCHEDULED_NOTIFICATIONS_KEY,
        JSON.stringify(merged)
      );
    } catch (error) {
      console.error('Failed to store scheduled notifications:', error);
    }
  }

  /**
   * Get scheduled notifications
   */
  private async getScheduledNotifications(): Promise<ExpiryScheduledNotification[]> {
    try {
      const notifications = await AsyncStorage.getItem(this.SCHEDULED_NOTIFICATIONS_KEY);
      return notifications ? JSON.parse(notifications) : [];
    } catch (error) {
      console.error('Failed to load scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Cleanup expired notifications
   */
  async cleanupExpiredNotifications(): Promise<void> {
    try {
      const notifications = await this.getScheduledNotifications();
      const now = new Date();
      
      const activeNotifications = notifications.filter(
        notification => notification.reminderDate > now
      );

      await AsyncStorage.setItem(
        this.SCHEDULED_NOTIFICATIONS_KEY,
        JSON.stringify(activeNotifications)
      );
    } catch (error) {
      console.error('Failed to cleanup expired notifications:', error);
    }
  }

  /**
   * Get expiry statistics
   */
  async getExpiryStatistics(passwords: Password[]): Promise<{
    totalPasswords: number;
    withExpiry: number;
    withoutExpiry: number;
    expired: number;
    expiringSoon: number;
    averageDaysUntilExpiry: number;
  }> {
    const report = await this.generateExpiryReport(passwords);
    const passwordsWithExpiry = passwords.filter(p => p.expiryDate);
    
    let totalDays = 0;
    let validPasswordsCount = 0;

    for (const password of passwordsWithExpiry) {
      const days = this.getDaysUntilExpiry(password);
      if (days !== null && days > 0) {
        totalDays += days;
        validPasswordsCount++;
      }
    }

    const averageDaysUntilExpiry = validPasswordsCount > 0 
      ? Math.round(totalDays / validPasswordsCount) 
      : 0;

    return {
      totalPasswords: passwords.length,
      withExpiry: passwordsWithExpiry.length,
      withoutExpiry: report.withoutExpiry.length,
      expired: report.expired.length,
      expiringSoon: report.expiringSoon.length,
      averageDaysUntilExpiry,
    };
  }
}

export const passwordExpiryService = PasswordExpiryService.getInstance();
