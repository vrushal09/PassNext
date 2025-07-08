import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Switch,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useBiometricAuth } from '../contexts/BiometricAuthContext';
import { authService } from '../services/authService';
import { biometricAuthService } from '../services/biometricAuthService';
import { passwordService, Password } from '../services/passwordService';
import { AddPasswordModal } from './AddPasswordModal';
import { EditPasswordModal } from './EditPasswordModal';
import { PasswordItem } from './PasswordItem';

export const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const { isBiometricEnabled, setBiometricEnabled } = useBiometricAuth();
  
  // Password management state
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPassword, setSelectedPassword] = useState<Password | null>(null);

  // Load passwords on component mount
  useEffect(() => {
    if (user) {
      loadPasswords();
    }
  }, [user]);

  const loadPasswords = async () => {
    if (!user) return;
    
    setLoading(true);
    const result = await passwordService.getPasswords(user.uid);
    
    if (result.success && result.passwords) {
      setPasswords(result.passwords);
    } else {
      Alert.alert('Error', result.error || 'Failed to load passwords');
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPasswords();
    setRefreshing(false);
  };

  const handleEditPassword = (password: Password) => {
    setSelectedPassword(password);
    setShowEditModal(true);
  };

  const handleDeletePassword = async (passwordId: string) => {
    const result = await passwordService.deletePassword(passwordId);
    
    if (result.success) {
      Alert.alert('Success', 'Password deleted successfully');
      loadPasswords();
    } else {
      Alert.alert('Error', result.error || 'Failed to delete password');
    }
  };

  const handlePasswordSuccess = () => {
    loadPasswords();
  };

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

        <View style={styles.passwordSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Saved Passwords</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={passwords}
            keyExtractor={(item) => item.id!}
            renderItem={({ item }) => (
              <PasswordItem
                password={item}
                onEdit={handleEditPassword}
                onDelete={handleDeletePassword}
              />
            )}
            style={styles.passwordList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  {loading ? 'Loading passwords...' : 'No passwords saved yet'}
                </Text>
                {!loading && (
                  <Text style={styles.emptyStateSubtext}>
                    Tap the "Add" button to save your first password
                  </Text>
                )}
              </View>
            }
          />
        </View>

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

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <AddPasswordModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handlePasswordSuccess}
        userId={user?.uid || ''}
      />

      <EditPasswordModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPassword(null);
        }}
        onSuccess={handlePasswordSuccess}
        password={selectedPassword}
        userId={user?.uid || ''}
      />
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
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
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
  passwordSection: {
    flex: 1,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  passwordList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  settingsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
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
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
