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
  TextInput,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
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
  const [filteredPasswords, setFilteredPasswords] = useState<Password[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPassword, setSelectedPassword] = useState<Password | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentTab, setCurrentTab] = useState('home');

  // Load passwords on component mount
  useEffect(() => {
    if (user) {
      loadPasswords();
    }
  }, [user]);

  // Filter passwords when search query or passwords change
  useEffect(() => {
    let filtered = passwords;
    
    // Filter by search query
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(password =>
        password.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
        password.account.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (password.notes && password.notes.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(password => {
        const service = password.service.toLowerCase();
        switch (selectedCategory) {
          case 'social':
            return ['instagram', 'facebook', 'twitter', 'linkedin', 'snapchat', 'tiktok', 'discord', 'slack'].some(s => service.includes(s));
          case 'work':
            return ['microsoft', 'google', 'github', 'dropbox', 'slack', 'zoom', 'teams'].some(s => service.includes(s));
          case 'entertainment':
            return ['netflix', 'spotify', 'youtube', 'twitch', 'disney', 'hulu', 'prime'].some(s => service.includes(s));
          case 'finance':
            return ['paypal', 'bank', 'visa', 'mastercard', 'amex', 'venmo', 'cashapp'].some(s => service.includes(s));
          default:
            return true;
        }
      });
    }
    
    setFilteredPasswords(filtered);
  }, [searchQuery, passwords, selectedCategory]);

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

  const handleProfilePress = () => {
    Alert.alert(
      'Profile',
      'Profile page functionality coming soon!',
      [{ text: 'OK' }]
    );
  };

  const handleTabPress = (tab: string) => {
    setCurrentTab(tab);
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {currentTab === 'home' && (
            <>
              {/* Header */}
              <View style={styles.homeHeader}>
                <Text style={styles.appTitle}>PassNext</Text>
              </View>

              {/* Search */}
              <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color="#9AA0A6" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search"
                placeholderTextColor="#9AA0A6"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={styles.searchMenuButton}>
                <Ionicons name="ellipsis-vertical" size={16} color="#9AA0A6" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Most used header */}
          <View style={styles.mostUsedHeader}>
            <Text style={styles.mostUsedTitle}>Most used</Text>
            <TouchableOpacity style={styles.expandButton}>
              <Ionicons name="chevron-down" size={16} color="#5F6368" />
            </TouchableOpacity>
          </View>

          {/* Password list */}
          <FlatList
            data={filteredPasswords}
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
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  {loading ? 'Loading passwords...' : 
                   searchQuery.length > 0 ? 'No passwords match your search' : 'No passwords saved yet'}
                </Text>
                {!loading && searchQuery.length === 0 && (
                  <TouchableOpacity 
                    style={styles.addFirstButton}
                    onPress={() => setShowAddModal(true)}
                  >
                    <Text style={styles.addFirstButtonText}>Add Your First Password</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />

          {/* Floating Add Button */}
          <TouchableOpacity 
            style={styles.floatingAddButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </TouchableOpacity>
            </>
          )}

          {currentTab === 'security' && (
            <View style={styles.securityContent}>
              <View style={styles.securityHeader}>
                <Text style={styles.securityTitle}>Security Settings</Text>
                <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
                  <View style={styles.profileCircle}>
                    <Text style={styles.profileInitial}>
                      {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.securitySection}>
                <View style={styles.securityItem}>
                  <View style={styles.securityItemIcon}>
                    <Ionicons name="finger-print" size={24} color="#1A73E8" />
                  </View>
                  <View style={styles.securityItemContent}>
                    <Text style={styles.securityItemTitle}>Biometric Authentication</Text>
                    <Text style={styles.securityItemDescription}>
                      {isBiometricEnabled ? 'Enabled' : 'Disabled'}
                    </Text>
                  </View>
                  <Switch
                    value={isBiometricEnabled}
                    onValueChange={handleBiometricToggle}
                    trackColor={{ false: '#E8EAED', true: '#1A73E8' }}
                    thumbColor={isBiometricEnabled ? '#FFFFFF' : '#5F6368'}
                  />
                </View>

                <View style={styles.securityItem}>
                  <View style={styles.securityItemIcon}>
                    <Ionicons name="shield-checkmark" size={24} color="#34A853" />
                  </View>
                  <View style={styles.securityItemContent}>
                    <Text style={styles.securityItemTitle}>Password Strength</Text>
                    <Text style={styles.securityItemDescription}>
                      {passwords.length} passwords stored securely
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={[styles.securityItem, styles.lastSecurityItem]} onPress={handleLogout}>
                  <View style={styles.securityItemIcon}>
                    <Ionicons name="log-out" size={24} color="#FF3B30" />
                  </View>
                  <View style={styles.securityItemContent}>
                    <Text style={styles.securityItemTitle}>Sign Out</Text>
                    <Text style={styles.securityItemDescription}>
                      Sign out of your account
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#5F6368" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity 
            style={[styles.navItem, currentTab === 'home' && styles.activeNavItem]}
            onPress={() => handleTabPress('home')}
          >
            <Ionicons name="apps" size={24} color={currentTab === 'home' ? "#1A73E8" : "#5F6368"} />
            <Text style={currentTab === 'home' ? styles.activeNavText : styles.navText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.navItem, currentTab === 'security' && styles.activeNavItem]}
            onPress={() => handleTabPress('security')}
          >
            <Ionicons name="shield-checkmark" size={24} color={currentTab === 'security' ? "#1A73E8" : "#5F6368"} />
            <Text style={currentTab === 'security' ? styles.activeNavText : styles.navText}>Security</Text>
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
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 10,
  },
  content: {
    flex: 1,
  },
  homeHeader: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '500',
    color: '#1C1C1E',
    letterSpacing: -0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  googleText: {
    fontSize: 22,
    fontWeight: '400',
    color: '#5F6368',
    marginRight: 4,
  },
  passText: {
    fontSize: 22,
    fontWeight: '400',
    color: '#5F6368',
  },
  profileButton: {
    padding: 4,
  },
  profileCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#3C4043',
    fontWeight: '400',
  },
  searchMenuButton: {
    padding: 4,
    marginLeft: 8,
  },
  mostUsedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  mostUsedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3C4043',
  },
  expandButton: {
    padding: 4,
  },
  securityContent: {
    flex: 1,
    paddingTop: 50,
  },
  securityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  securityTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#3C4043',
  },
  securitySection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  securityItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  securityItemContent: {
    flex: 1,
  },
  securityItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3C4043',
    marginBottom: 2,
  },
  securityItemDescription: {
    fontSize: 14,
    color: '#5F6368',
    fontWeight: '400',
  },
  lastSecurityItem: {
    borderBottomWidth: 0,
  },
  passwordList: {
    flex: 1,
    paddingHorizontal: 4,
  },
  listContent: {
    paddingBottom: 100,
    paddingTop: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#5F6368',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '400',
  },
  addFirstButton: {
    backgroundColor: '#1A73E8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  addFirstButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1A73E8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 40,
    borderTopWidth: 1,
    borderTopColor: '#E8EAED',
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    minWidth: 80,
  },
  activeNavItem: {
    borderTopWidth: 2,
    borderTopColor: '#1A73E8',
  },
  navText: {
    fontSize: 12,
    color: '#5F6368',
    marginTop: 4,
    fontWeight: '400',
  },
  activeNavText: {
    fontSize: 12,
    color: '#1A73E8',
    marginTop: 4,
    fontWeight: '500',
  },
  // Legacy styles - keeping for backward compatibility
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  recentItemsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  recentItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentIconText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  activeCategoryButton: {
    backgroundColor: '#1C1C1E',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activeCategoryButtonText: {
    color: '#FFFFFF',
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
