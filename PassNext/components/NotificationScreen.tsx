import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Colors from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { notificationService } from '../services/notificationService';
import { CustomAlert } from './CustomAlert';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'security' | 'password_expiry' | 'breach_alert' | 'weak_password' | 'general';
  timestamp: Date;
  read: boolean;
  data?: any;
}

export const NotificationScreen: React.FC = () => {
  const { user } = useAuth();
  const { alertState, hideAlert, showError, showSuccess } = useCustomAlert();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      // Get scheduled notifications
      const scheduledNotifications = await notificationService.getScheduledNotifications();
      
      // Transform to our format
      const transformedNotifications: NotificationItem[] = scheduledNotifications.map((notification, index) => ({
        id: notification.identifier,
        title: notification.content.title || 'Notification',
        message: notification.content.body || '',
        type: (notification.content.data?.type as NotificationItem['type']) || 'general',
        timestamp: new Date(Date.now() + (index * 60 * 60 * 1000)), // Future notifications
        read: false,
        data: notification.content.data,
      }));

      // Add some mock historical notifications for demo
      const mockHistoricalNotifications: NotificationItem[] = [
        {
          id: '1',
          title: 'Password Updated',
          message: 'Your password for Gmail has been successfully updated.',
          type: 'general',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          read: true,
        },
        {
          id: '2',
          title: 'Security Alert',
          message: 'Your password for Facebook may have been compromised in a data breach.',
          type: 'breach_alert',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          read: false,
        },
        {
          id: '3',
          title: 'Weak Password Detected',
          message: 'Your password for Twitter is weak and should be updated.',
          type: 'weak_password',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          read: true,
        },
      ];

      const allNotifications = [...transformedNotifications, ...mockHistoricalNotifications]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      showError('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const handleClearAll = async () => {
    try {
      await notificationService.cancelAllNotifications();
      setNotifications([]);
      showSuccess('Success', 'All notifications cleared');
    } catch (error) {
      showError('Error', 'Failed to clear notifications');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'security':
      case 'breach_alert':
        return 'shield-outline';
      case 'weak_password':
        return 'warning-outline';
      case 'password_expiry':
        return 'time-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'security':
      case 'breach_alert':
        return Colors.error;
      case 'weak_password':
        return Colors.warning;
      case 'password_expiry':
        return Colors.info;
      default:
        return Colors.primary;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  const renderNotificationItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadNotification]}
      onPress={() => handleMarkAsRead(item.id)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={[styles.notificationIcon, { backgroundColor: getNotificationColor(item.type) + '15' }]}>
            <Ionicons 
              name={getNotificationIcon(item.type) as any} 
              size={24} 
              color={getNotificationColor(item.type)} 
            />
          </View>
          <View style={styles.notificationMeta}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationTime}>{formatTimestamp(item.timestamp)}</Text>
          </View>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notificationMessage}>{item.message}</Text>
      </View>
    </TouchableOpacity>
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} translucent={false} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Unread Count */}
      {unreadCount > 0 && (
        <View style={styles.unreadSection}>
          <Text style={styles.unreadText}>
            {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={64} color={Colors.text.tertiary} />
            <Text style={styles.emptyStateTitle}>No Notifications</Text>
            <Text style={styles.emptyStateSubtitle}>
              You're all caught up! Security alerts and updates will appear here.
            </Text>
          </View>
        }
      />

      <CustomAlert
        visible={alertState.visible}
        title={alertState.options.title}
        message={alertState.options.message}
        buttons={alertState.options.buttons || []}
        onClose={hideAlert}
        icon={alertState.options.icon}
        iconColor={alertState.options.iconColor}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.error + '15',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
  },
  unreadSection: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  unreadText: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  notificationItem: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unreadNotification: {
    backgroundColor: Colors.primary + '05',
    borderColor: Colors.primary + '20',
  },
  notificationContent: {
    gap: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationMeta: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  notificationMessage: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginLeft: 64,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 24,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default NotificationScreen;
