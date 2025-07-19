import React from 'react';
import { View, StyleSheet } from 'react-native';
import { InAppNotification } from './InAppNotification';
import { useNotifications } from '../contexts/NotificationContext';

export const NotificationDisplay: React.FC = () => {
  const { notifications, dismissNotification } = useNotifications();

  if (notifications.length === 0) {
    return null;
  }

  // Show only the latest notification to avoid overlap
  const latestNotification = notifications[notifications.length - 1];

  return (
    <View style={styles.container}>
      <InAppNotification
        key={latestNotification.id}
        notification={latestNotification}
        onDismiss={dismissNotification}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    pointerEvents: 'box-none',
  },
});
