import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Switch,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useBiometricAuth } from '../contexts/BiometricAuthContext';
import { authService } from '../services/authService';
import { biometricAuthService } from '../services/biometricAuthService';

export const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const { isBiometricEnabled, setBiometricEnabled } = useBiometricAuth();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            const result = await authService.signOut();
            if (!result.success) {
              Alert.alert('Error', result.error);
            }
          },
        },
      ]
    );
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      // Enable biometric auth
      const isAvailable = await biometricAuthService.isAvailable();
      
      if (!isAvailable) {
        Alert.alert(
          'Biometric Authentication Unavailable',
          'Biometric authentication is not available on this device or not set up. Please set up fingerprint, Face ID, or other biometric authentication in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Test biometric auth before enabling
      const result = await biometricAuthService.authenticate('Confirm to enable biometric authentication');
      
      if (result.success) {
        setBiometricEnabled(true);
        Alert.alert('Success', 'Biometric authentication has been enabled for your account.');
      } else {
        Alert.alert('Authentication Failed', result.error || 'Please try again');
      }
    } else {
      // Disable biometric auth
      Alert.alert(
        'Disable Biometric Authentication',
        'Are you sure you want to disable biometric authentication?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: () => {
              setBiometricEnabled(false);
              Alert.alert('Disabled', 'Biometric authentication has been disabled.');
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome!</Text>
          <Text style={styles.userInfo}>
            {user?.displayName || 'User'}
          </Text>
          <Text style={styles.emailText}>
            {user?.email}
          </Text>
        </View>

        <View style={styles.main}>
          <Text style={styles.mainText}>
            🎉 You're successfully logged in with Firebase Auth!
          </Text>
          <Text style={styles.subText}>
            This is your main app content area.
          </Text>

          <View style={styles.settingsSection}>
            <Text style={styles.settingsTitle}>Security Settings</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Biometric Authentication</Text>
                <Text style={styles.settingDescription}>
                  Use fingerprint or Face ID to quickly access the app
                </Text>
              </View>
              <Switch
                value={isBiometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: '#ccc', true: '#007AFF' }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  userInfo: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 5,
  },
  emailText: {
    fontSize: 16,
    color: '#666',
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  mainText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#333',
    marginBottom: 10,
    lineHeight: 24,
  },
  subText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
    marginBottom: 40,
  },
  settingsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginVertical: 20,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
