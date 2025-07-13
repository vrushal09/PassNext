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

  // Get service icon based on service name
  const getServiceIcon = (serviceName: string) => {
    const service = serviceName.toLowerCase();
    
    // Define icon mappings for popular services
    const iconMap: { [key: string]: { name: any; color: string } } = {
      google: { name: 'logo-google', color: '#4285F4' },
      gmail: { name: 'mail', color: '#EA4335' },
      youtube: { name: 'logo-youtube', color: '#FF0000' },
      facebook: { name: 'logo-facebook', color: '#1877F2' },
      instagram: { name: 'logo-instagram', color: '#E4405F' },
      twitter: { name: 'logo-twitter', color: '#1DA1F2' },
      linkedin: { name: 'logo-linkedin', color: '#0A66C2' },
      github: { name: 'logo-github', color: '#333333' },
      apple: { name: 'logo-apple', color: '#000000' },
      microsoft: { name: 'logo-microsoft', color: '#00A4EF' },
      outlook: { name: 'mail', color: '#0078D4' },
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
      whatsapp: { name: 'logo-whatsapp', color: '#25D366' },
      telegram: { name: 'paper-plane', color: '#0088CC' },
      tiktok: { name: 'musical-notes', color: '#FF0050' },
      snapchat: { name: 'logo-snapchat', color: '#FFFC00' },
      reddit: { name: 'logo-reddit', color: '#FF4500' },
      pinterest: { name: 'logo-pinterest', color: '#BD081C' },
      twitch: { name: 'logo-twitch', color: '#9146FF' },
      zoom: { name: 'videocam', color: '#2D8CFF' },
      skype: { name: 'logo-skype', color: '#00AFF0' },
      teams: { name: 'people', color: '#6264A7' },
      adobe: { name: 'color-palette', color: '#FF0000' },
      canva: { name: 'brush', color: '#00C4CC' },
      figma: { name: 'shapes', color: '#F24E1E' },
      wordpress: { name: 'logo-wordpress', color: '#21759B' },
      shopify: { name: 'storefront', color: '#7AB55C' },
      ebay: { name: 'pricetag', color: '#E53238' },
      etsy: { name: 'storefront', color: '#F1641E' },
      uber: { name: 'car', color: '#000000' },
      lyft: { name: 'car', color: '#FF00BF' },
      airbnb: { name: 'home', color: '#FF5A5F' },
      booking: { name: 'bed', color: '#003580' },
      expedia: { name: 'airplane', color: '#FFC72C' },
      tripadvisor: { name: 'location', color: '#00AF87' },
      duolingo: { name: 'school', color: '#58CC02' },
      coursera: { name: 'school', color: '#0056D3' },
      udemy: { name: 'play', color: '#A435F0' },
      medium: { name: 'document-text', color: '#00AB6C' },
      notion: { name: 'document-text', color: '#000000' },
      evernote: { name: 'document-text', color: '#00A82D' },
      onenote: { name: 'document-text', color: '#7719AA' },
      trello: { name: 'list', color: '#0052CC' },
      asana: { name: 'checkmark-circle', color: '#F06A6A' },
      jira: { name: 'bug', color: '#0052CC' },
      bitbucket: { name: 'git-branch', color: '#0052CC' },
      gitlab: { name: 'git-branch', color: '#FC6D26' },
      docker: { name: 'cube', color: '#2496ED' },
      aws: { name: 'cloud', color: '#FF9900' },
      azure: { name: 'cloud', color: '#0078D4' },
      gcp: { name: 'cloud', color: '#4285F4' },
      heroku: { name: 'cloud', color: '#430098' },
      digitalocean: { name: 'water', color: '#0080FF' },
      cloudflare: { name: 'cloud', color: '#F38020' },
      namecheap: { name: 'globe', color: '#DE3723' },
      godaddy: { name: 'globe', color: '#1BDBDB' },
      bluehost: { name: 'globe', color: '#1F5582' },
      hostgator: { name: 'globe', color: '#FF6600' },
      squarespace: { name: 'square', color: '#000000' },
      wix: { name: 'brush', color: '#0C6EBD' },
      mailchimp: { name: 'mail', color: '#FFE01B' },
      hubspot: { name: 'funnel', color: '#FF7A59' },
      salesforce: { name: 'cloud', color: '#00A1E0' },
      zendesk: { name: 'chatbubble', color: '#03363D' },
      intercom: { name: 'chatbubble', color: '#1F8DED' },
      twilio: { name: 'call', color: '#F22F46' },
      verizon: { name: 'call', color: '#CD040B' },
      att: { name: 'call', color: '#00A8E0' },
      tmobile: { name: 'call', color: '#E20074' },
      sprint: { name: 'call', color: '#FFCF00' },
      xfinity: { name: 'wifi', color: '#FF0037' },
      spectrum: { name: 'wifi', color: '#047BC4' },
      cox: { name: 'wifi', color: '#004B8D' },
      rogers: { name: 'call', color: '#F5024C' },
      bell: { name: 'call', color: '#0E5A96' },
      telus: { name: 'call', color: '#6A1577' },
      shaw: { name: 'wifi', color: '#0091DA' },
      videotron: { name: 'wifi', color: '#E32012' },
      cogeco: { name: 'wifi', color: '#FF8200' },
      eastlink: { name: 'wifi', color: '#2E8B57' },
      sasktel: { name: 'call', color: '#00833E' },
      mts: { name: 'call', color: '#00833E' },
      freedom: { name: 'call', color: '#00D4AA' },
      chatr: { name: 'call', color: '#00A86B' },
      lucky: { name: 'call', color: '#E60000' },
      public: { name: 'call', color: '#00A86B' },
      koodo: { name: 'call', color: '#6A1577' },
      virgin: { name: 'call', color: '#E60000' },
      fido: { name: 'call', color: '#F5024C' },
    };

    // Check if we have a specific icon for this service
    for (const [key, value] of Object.entries(iconMap)) {
      if (service.includes(key)) {
        return (
          <View style={[styles.serviceIcon, { backgroundColor: value.color + '15' }]}>
            <Ionicons name={value.name} size={20} color={value.color} />
          </View>
        );
      }
    }

    // Default fallback with first letter
    const firstLetter = serviceName.charAt(0).toUpperCase();
    const colors = [
      '#4285F4', '#EA4335', '#34A853', '#FBBC05', '#9C27B0', 
      '#FF9800', '#795548', '#607D8B', '#E91E63', '#00BCD4'
    ];
    const colorIndex = serviceName.length % colors.length;
    const selectedColor = colors[colorIndex];
    
    return (
      <View style={[styles.serviceIcon, { backgroundColor: selectedColor + '15' }]}>
        <Text style={[styles.serviceIconText, { color: selectedColor }]}>{firstLetter}</Text>
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
                  color={Colors.text.secondary}
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
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.input.background,
    borderWidth: 1,
    borderColor: 'transparent',
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
    minHeight: 64,
    backgroundColor: Colors.background,
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
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    zIndex: 2,
    width: '100%',
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceIconText: {
    color: Colors.text.inverse,
    fontSize: 18,
    fontWeight: '600',
  },
  serviceInfo: {
    flex: 1,
    paddingRight: 8,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  serviceUrl: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 2,
    fontWeight: '400',
  },
  notes: {
    fontSize: 12,
    color: Colors.text.tertiary,
    fontWeight: '400',
  },
  fingerprintButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: Colors.input.background,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actionText: {
    color: Colors.text.inverse,
    fontSize: 11,
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
});
