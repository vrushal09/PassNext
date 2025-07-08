import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Clipboard,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Password } from '../services/passwordService';
import { biometricAuthService } from '../services/biometricAuthService';

interface PasswordItemProps {
  password: Password;
  onEdit: (password: Password) => void;
  onDelete: (passwordId: string) => void;
}

export const PasswordItem: React.FC<PasswordItemProps> = ({
  password,
  onEdit,
  onDelete,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const { width: screenWidth } = Dimensions.get('window');
  const swipeThreshold = 100;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setString(text);
      Alert.alert('Copied', `${label} copied to clipboard`);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const copyPasswordToClipboard = async () => {
    // Require biometric auth when copying password
    const isAvailable = await biometricAuthService.isAvailable();
    
    if (isAvailable) {
      const result = await biometricAuthService.authenticate(
        `Authenticate to copy password for ${password.service}`
      );
      
      if (result.success) {
        await copyToClipboard(password.password, 'Password');
      } else {
        Alert.alert(
          'Authentication Failed', 
          result.error || 'Biometric authentication failed. Please try again.'
        );
      }
    } else {
      // If biometric auth is not available, copy directly
      await copyToClipboard(password.password, 'Password');
    }
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationX } = event.nativeEvent;
      
      // Determine action based on swipe direction and distance
      if (translationX > swipeThreshold) {
        // Swipe right - Edit
        handleEdit();
      } else if (translationX < -swipeThreshold) {
        // Swipe left - Delete
        handleDelete();
      }

      // Reset position with animation
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  };

  const handleEdit = () => {
    onEdit(password);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Password',
      `Are you sure you want to delete the password for ${password.service}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(password.id!),
        },
      ]
    );
  };

  const maskedPassword = password.password.replace(/./g, '●');

  // Calculate background color based on swipe position
  const getBackgroundColor = () => {
    return translateX.interpolate({
      inputRange: [-screenWidth, -swipeThreshold, 0, swipeThreshold, screenWidth],
      outputRange: ['#FF3B30', '#FF3B30', '#ffffff', '#007AFF', '#007AFF'],
      extrapolate: 'clamp',
    });
  };

  // Calculate action text opacity
  const getActionOpacity = () => {
    return translateX.interpolate({
      inputRange: [-screenWidth, -swipeThreshold, 0, swipeThreshold, screenWidth],
      outputRange: [1, 1, 0, 1, 1],
      extrapolate: 'clamp',
    });
  };

  return (
    <View style={styles.container}>
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-10, 10]}
      >
        <Animated.View
          style={[
            styles.swipeContainer,
            {
              transform: [{ translateX }],
              backgroundColor: getBackgroundColor(),
            },
          ]}
        >
          {/* Action indicators */}
          <Animated.View style={[styles.leftAction, { opacity: getActionOpacity() }]}>
            <Text style={styles.actionText}>DELETE</Text>
          </Animated.View>
          
          <Animated.View style={[styles.rightAction, { opacity: getActionOpacity() }]}>
            <Text style={styles.actionText}>EDIT</Text>
          </Animated.View>

          {/* Main content */}
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.service}>{password.service}</Text>
              <Text style={styles.swipeHint}>← Swipe to delete • Swipe to edit →</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Account:</Text>
              <TouchableOpacity onPress={() => copyToClipboard(password.account, 'Account')}>
                <Text style={styles.value}>{password.account}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password:</Text>
              <View style={styles.passwordContainer}>
                <Text style={styles.value}>
                  {maskedPassword}
                </Text>
                <TouchableOpacity 
                  onPress={copyPasswordToClipboard}
                  style={styles.copyButton}
                >
                  <Text style={styles.copyButtonText}>Copy</Text>
                </TouchableOpacity>
              </View>
            </View>

            {password.notes && (
              <View style={styles.field}>
                <Text style={styles.label}>Notes:</Text>
                <Text style={styles.notes}>{password.notes}</Text>
              </View>
            )}

            <View style={styles.footer}>
              <Text style={styles.date}>Created: {formatDate(password.createdAt)}</Text>
              {password.updatedAt.getTime() !== password.createdAt.getTime() && (
                <Text style={styles.date}>Updated: {formatDate(password.updatedAt)}</Text>
              )}
            </View>
          </View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  swipeContainer: {
    position: 'relative',
    borderRadius: 12,
    minHeight: 120,
  },
  leftAction: {
    position: 'absolute',
    left: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'flex-start',
    zIndex: 1,
  },
  rightAction: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'flex-end',
    zIndex: 1,
  },
  actionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    zIndex: 2,
  },
  header: {
    flexDirection: 'column',
    marginBottom: 12,
  },
  service: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  swipeHint: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  field: {
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    flex: 1,
  },
  notes: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginTop: 4,
  },
  copyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 12,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  date: {
    fontSize: 11,
    color: '#999',
  },
});
