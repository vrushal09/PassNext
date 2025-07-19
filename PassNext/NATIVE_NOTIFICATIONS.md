# Native Notification System - Documentation

## Overview

The PassNext app now uses a native notification system that sends real device notifications for:

1. **Password Expiry Reminders** - Notifications sent at configurable intervals before passwords expire
2. **Daily Weak Password Alerts** - Once daily notification if weak passwords are detected

## Key Features

### ✅ Password Expiry Notifications
- Automatically checks all passwords with expiry dates
- Sends notifications at configurable intervals (default: 30, 14, 7, 1 days before expiry)
- Native device notifications with proper channels and sound
- Prevents duplicate notifications for the same password/reminder

### ✅ Weak Password Daily Alerts
- Scans all passwords for weak ones (strength score ≤ 2)
- Sends one notification per day if weak passwords are found
- Configurable notification time (default: 9:00 AM)
- Shows count of weak passwords needing attention

## How It Works

### Notification Service (`nativeNotificationService.ts`)
- Uses `react-native-push-notification` for native notifications
- Creates notification channels for Android (password-expiry, weak-password)
- Handles permission requests and notification scheduling
- Stores notification history and prevents duplicates

### Notification Context (`NotificationContext.tsx`)
- Integrates with React app lifecycle
- Automatically checks for notifications when passwords are loaded
- Runs periodic checks every 30 minutes
- Initializes notification service when user logs in

### Integration Points
- **HomeScreen**: Triggers notification checks after loading passwords
- **App Layout**: Wraps app with NotificationProvider
- **Password Service**: Provides password data for notification checks

## Configuration

### Notification Settings
```typescript
interface NotificationSettings {
  passwordExpiryEnabled: boolean;        // Enable/disable expiry notifications
  weakPasswordDailyEnabled: boolean;     // Enable/disable weak password alerts
  weakPasswordDailyTime: string;         // Time for daily check (HH:MM format)
  expiryReminderDays: number[];          // Days before expiry to remind
}
```

### Default Settings
- Password expiry notifications: **Enabled**
- Weak password daily alerts: **Enabled**
- Daily check time: **09:00 AM**
- Expiry reminder days: **[30, 14, 7, 1]** days before expiry

## Technical Implementation

### Android Notification Channels
- **password-expiry**: High importance, vibration, sound
- **weak-password**: High importance, vibration, sound

### Notification Scheduling
- Uses device's native scheduling system
- Notifications persist even when app is closed
- Automatic cleanup of expired notifications

### Data Storage
- Settings stored in AsyncStorage
- Notification history tracked to prevent duplicates
- Daily check timestamps stored

## Benefits

✅ **Native Device Notifications**: Real system notifications, not in-app alerts
✅ **Works When App is Closed**: Notifications fire even when app isn't running
✅ **Battery Efficient**: Uses device's native scheduling system
✅ **User-Friendly**: Standard notification appearance and behavior
✅ **Configurable**: Users can customize notification timing and frequency
✅ **No External Dependencies**: Doesn't require expo-notifications or external services

## Usage

The notification system works automatically once the user logs in:

1. **Automatic Initialization**: Service starts when NotificationProvider loads
2. **Password Analysis**: Checks passwords when HomeScreen loads
3. **Scheduled Notifications**: Sets up native device notifications
4. **Periodic Checks**: Runs checks every 30 minutes while app is active
5. **Daily Weak Password Check**: Triggers at configured time daily

Users receive native device notifications with standard system appearance, sound, and vibration patterns.
