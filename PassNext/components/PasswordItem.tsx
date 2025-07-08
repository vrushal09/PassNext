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
import { Ionicons } from '@expo/vector-icons';
import { Password } from '../services/passwordService';
import { biometricAuthService } from '../services/biometricAuthService';
import Colors from '../constants/Colors';

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

  // Get service icon based on service name
  const getServiceIcon = (serviceName: string) => {
    const service = serviceName.toLowerCase();
    
    // Define icon mappings for popular services
    const iconMap: { [key: string]: { name: any; color: string } } = {
      google: { name: 'logo-google', color: '#4285F4' },
      youtube: { name: 'logo-youtube', color: '#FF0000' },
      facebook: { name: 'logo-facebook', color: '#1877F2' },
      instagram: { name: 'logo-instagram', color: '#E4405F' },
      twitter: { name: 'logo-twitter', color: '#1DA1F2' },
      linkedin: { name: 'logo-linkedin', color: '#0A66C2' },
      github: { name: 'logo-github', color: '#333333' },
      apple: { name: 'logo-apple', color: '#000000' },
      microsoft: { name: 'logo-microsoft', color: '#00A4EF' },
      amazon: { name: 'logo-amazon', color: '#FF9900' },
      netflix: { name: 'logo-netflix', color: '#E50914' },
      spotify: { name: 'logo-spotify', color: '#1DB954' },
      dropbox: { name: 'logo-dropbox', color: '#0061FF' },
      dribbble: { name: 'logo-dribbble', color: '#EA4C89' },
      slack: { name: 'logo-slack', color: '#4A154B' },
      discord: { name: 'logo-discord', color: '#5865F2' },
      paypal: { name: 'logo-paypal', color: '#00457C' },
      mastercard: { name: 'card', color: '#EB001B' },
      visa: { name: 'card', color: '#1A1F71' },
    };

    // Check if we have a specific icon for this service
    for (const [key, value] of Object.entries(iconMap)) {
      if (service.includes(key)) {
        return (
          <View style={[styles.serviceIcon, { backgroundColor: Colors.surface }]}>
            <Ionicons name={value.name} size={24} color={value.color} />
          </View>
        );
      }
    }

    // Default fallback with first letter
    const firstLetter = serviceName.charAt(0).toUpperCase();
    const colors = [Colors.primary, Colors.primaryLight, Colors.primaryDark, Colors.error, Colors.warning, Colors.success, Colors.info];
    const colorIndex = serviceName.length % colors.length;
    
    return (
      <View style={[styles.serviceIcon, { backgroundColor: colors[colorIndex] }]}>
        <Text style={styles.serviceIconText}>{firstLetter}</Text>
      </View>
    );
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
      } else {
        Alert.alert(
          'Authentication Failed', 
          result.error || 'Biometric authentication failed. Please try again.'
        );
      }
    } else {
      // If biometric auth is not available, show delete confirmation directly
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
    }
  };

  const maskedPassword = password.password.replace(/./g, '●');

  // Calculate background color based on swipe position
  const getBackgroundColor = () => {
    return translateX.interpolate({
      inputRange: [-screenWidth, -swipeThreshold, 0, swipeThreshold, screenWidth],
      outputRange: [Colors.error, Colors.error, 'transparent', Colors.primary, Colors.primary],
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
              {getServiceIcon(password.service)}
              
              {/* Service Info */}
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{password.service}</Text>
                <Text style={styles.serviceUrl}>{password.account}</Text>
                <View style={styles.passwordRow}>
                  <Text style={styles.passwordLabel}>Password: </Text>
                  <Text style={styles.passwordValue}>••••••••••••</Text>
                </View>
              </View>
              
              {/* Copy Button with Fingerprint Icon */}
              <TouchableOpacity onPress={copyPasswordToClipboard} style={styles.fingerprintButton}>
                <Ionicons 
                  name="finger-print" 
                  size={22} 
                  color="#8E8E93" 
                />
              </TouchableOpacity>
            </TouchableOpacity>

            {password.notes && (
              <View style={styles.notesSection}>
                <Text style={styles.notes}>{password.notes}</Text>
              </View>
            )}
            </View>
          </Animated.View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  swipeWrapper: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  swipeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  swipeContainer: {
    position: 'relative',
    borderRadius: 16,
    minHeight: 80,
    backgroundColor: Colors.background,
    zIndex: 2,
  },
  leftAction: {
    position: 'absolute',
    left: 20,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'flex-start',
    zIndex: 1,
  },
  rightAction: {
    position: 'absolute',
    right: 20,
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
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    zIndex: 2,
    width: '100%',
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  serviceIconText: {
    color: Colors.text.inverse,
    fontSize: 20,
    fontWeight: '600',
  },
  serviceInfo: {
    flex: 1,
    paddingRight: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  serviceUrl: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
    fontWeight: '400',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
  },
  passwordLabel: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: '400',
  },
  passwordValue: {
    fontSize: 13,
    color: Colors.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'SF Mono' : 'monospace',
    letterSpacing: 0.5,
    fontWeight: '400',
  },
  fingerprintButton: {
    padding: 12,
    marginLeft: 8,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionText: {
    color: Colors.text.inverse,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  notesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  notes: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
    fontWeight: '400',
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
});
