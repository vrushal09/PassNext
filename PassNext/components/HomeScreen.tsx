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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.googleText}>Pass</Text>
              <Text style={styles.passText}>Next</Text>
            </View>
            <TouchableOpacity style={styles.profileButton}>
              <View style={styles.profileCircle}>
                <Text style={styles.profileInitial}>
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </Text>
              </View>
            </TouchableOpacity>
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
        </View>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
            <Ionicons name="apps" size={24} color="#1A73E8" />
            <Text style={styles.activeNavText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="shield-checkmark" size={24} color="#5F6368" />
            <Text style={styles.navText}>Security</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#5F6368" />
            <Text style={styles.navText}>Other</Text>
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
  },
  content: {
    flex: 1,
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
    marginBottom: 20,
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
    marginBottom: 16,
  },
  mostUsedTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3C4043',
  },
  expandButton: {
    padding: 4,
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
    bottom: 100,
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
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E8EAED',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
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
