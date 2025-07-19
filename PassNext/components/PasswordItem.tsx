import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import {
  Alert,
  Animated,
  Clipboard,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Colors from '../constants/Colors';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { biometricAuthService } from '../services/biometricAuthService';
import { Password } from '../services/passwordService';
import { CustomAlert } from './CustomAlert';
import { ServiceLogo } from './ServiceLogo';

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
  const { alertState, hideAlert, showSuccess, showError, showDestructiveConfirm } = useCustomAlert();

  // Calculate password strength
  const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    if (score <= 2) return { score, label: 'Weak', color: '#FF6B6B' };
    if (score <= 4) return { score, label: 'Fair', color: '#FFB946' };
    if (score <= 5) return { score, label: 'Good', color: '#51CF66' };
    return { score, label: 'Strong', color: '#22C55E' };
  };

  const passwordStrength = getPasswordStrength(password.password);

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
      showSuccess('Copied', `${label} copied to clipboard`);
    } catch (error) {
      showError('Error', 'Failed to copy to clipboard');
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
        showError(
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
        // Swipe right - reveals left action (Edit) with blue background
        handleEdit();
      } else if (translationX < -swipeThreshold) {
        // Swipe left - reveals right action (Delete) with red background
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

  const handleEdit = async () => {
    // Require biometric auth for editing
    const isAvailable = await biometricAuthService.isAvailable();
    
    if (isAvailable) {
      const result = await biometricAuthService.authenticate(
        `Authenticate to edit password for ${password.service}`
      );
      
      if (result.success) {
        onEdit(password);
      } else {
        Alert.alert(
          'Authentication Failed', 
          result.error || 'Biometric authentication failed. Please try again.'
        );
      }
    } else {
      // If biometric auth is not available, edit directly
      onEdit(password);
    }
  };

  const handleDelete = async () => {
    // Require biometric auth for deleting
    const isAvailable = await biometricAuthService.isAvailable();
    
    if (isAvailable) {
      const result = await biometricAuthService.authenticate(
        `Authenticate to delete password for ${password.service}`
      );
      
      if (result.success) {
        showDestructiveConfirm(
          'Delete Password',
          `Are you sure you want to delete the password for ${password.service}?`,
          () => onDelete(password.id!),
          undefined,
          'Delete',
          'Cancel'
        );
      } else {
        showError(
          'Authentication Failed', 
          result.error || 'Biometric authentication failed. Please try again.'
        );
      }
    } else {
      // If biometric auth is not available, show delete confirmation directly
      showDestructiveConfirm(
        'Delete Password',
        `Are you sure you want to delete the password for ${password.service}?`,
        () => onDelete(password.id!),
        undefined,
        'Delete',
        'Cancel'
      );
    }
  };

  const maskedPassword = password.password.replace(/./g, '●');

  // Calculate background color based on swipe position
  const getBackgroundColor = () => {
    return translateX.interpolate({
      inputRange: [-screenWidth, -swipeThreshold, 0, swipeThreshold, screenWidth],
      outputRange: [Colors.error, Colors.error, 'transparent', '#2563EB', '#2563EB'],
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
        <Animated.View style={styles.swipeWrapper}>
          {/* Background for swipe actions */}
          <Animated.View
            style={[
              styles.swipeBackground,
              {
                backgroundColor: getBackgroundColor(),
              },
            ]}
          />
          
          {/* Action indicators */}
          <Animated.View style={[styles.leftAction, { opacity: getActionOpacity() }]}>
            <View style={styles.editActionContainer}>
              <Ionicons name="pencil" size={24} color="#FFFFFF" />
              <Text style={styles.actionText}>Edit</Text>
            </View>
          </Animated.View>
          
          <Animated.View style={[styles.rightAction, { opacity: getActionOpacity() }]}>
            <View style={styles.deleteActionContainer}>
              <Ionicons name="trash" size={24} color="#FFFFFF" />
              <Text style={styles.actionText}>Delete</Text>
            </View>
          </Animated.View>

          {/* Main content */}
          <Animated.View
            style={[
              styles.swipeContainer,
              {
                transform: [{ translateX }],
              },
            ]}
          >
            <View style={styles.content}>
            <TouchableOpacity 
              style={styles.mainContent}
              onPress={() => copyToClipboard(password.account, 'Account')}
              activeOpacity={0.8}
            >
              {/* Service Icon */}
              <ServiceLogo serviceName={password.service} size={32} style={styles.serviceIconStyle} />
              
              {/* Service Info */}
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{password.service}</Text>
                <Text style={styles.serviceUrl}>{password.account}</Text>
                {password.notes && (
                  <Text style={styles.notes} numberOfLines={1}>
                    {password.notes}
                  </Text>
                )}
              </View>
              
              {/* Copy Button with Fingerprint Icon */}
              <TouchableOpacity onPress={copyPasswordToClipboard} style={styles.fingerprintButton}>
                <Ionicons 
                  name="finger-print" 
                  size={20} 
                  color={Colors.primary}
                />
              </TouchableOpacity>
            </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </PanGestureHandler>
      
      <CustomAlert
        visible={alertState.visible}
        title={alertState.options.title}
        message={alertState.options.message}
        buttons={alertState.options.buttons || []}
        onClose={hideAlert}
        icon={alertState.options.icon}
        iconColor={alertState.options.iconColor}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  swipeWrapper: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  swipeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  swipeContainer: {
    position: 'relative',
    borderRadius: 12,
    minHeight: 68,
    backgroundColor: Colors.surface,
    zIndex: 2,
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
  deleteActionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  editActionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    zIndex: 2,
    width: '100%',
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIconStyle: {
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
    paddingRight: 12,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 3,
    letterSpacing: -0.1,
  },
  serviceUrl: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 2,
    fontWeight: '400',
  },
  notes: {
    fontSize: 11,
    color: Colors.text.tertiary,
    fontWeight: '400',
    fontStyle: 'italic',
  },
  fingerprintButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 36,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  // Legacy styles for backward compatibility
  header: {
    flexDirection: 'column',
    marginBottom: 12,
  },
  service: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  swipeHint: {
    fontSize: 10,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  field: {
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    color: Colors.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    flex: 1,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
  },
  copyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 12,
  },
  copyButtonText: {
    color: Colors.text.inverse,
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  date: {
    fontSize: 11,
    color: Colors.text.tertiary,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  strengthIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  strengthText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
