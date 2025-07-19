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
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Colors from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { authService } from '../services/authService';
import { Password, passwordService } from '../services/passwordService';
import { AddPasswordModal } from './AddPasswordModal';
import { CustomAlert } from './CustomAlert';
import { EditPasswordModal } from './EditPasswordModal';
import { PasswordItem } from './PasswordItem';
import { ProfileScreen } from './ProfileScreen';
import SecurityDashboard from './SecurityDashboard';

export const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const { alertState, showAlert, hideAlert, showSuccess, showError, showConfirm, showDestructiveConfirm } = useCustomAlert();
  
  // Password management state
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [filteredPasswords, setFilteredPasswords] = useState<Password[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPassword, setSelectedPassword] = useState<Password | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState('home');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'recent'>('recent');
  const [showSecurityDashboard, setShowSecurityDashboard] = useState(false);

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
    
    // Sort passwords
    filtered = filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.service.localeCompare(b.service);
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'recent':
        default:
          return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
      }
    });
    
    setFilteredPasswords(filtered);
  }, [searchQuery, passwords, sortBy]);

  const loadPasswords = async () => {
    if (!user) return;
    
    setLoading(true);
    const result = await passwordService.getPasswords(user.uid);
    
    if (result.success && result.passwords) {
      setPasswords(result.passwords);
    } else {
      showError('Error', result.error || 'Failed to load passwords');
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
      showSuccess('Success', 'Password deleted successfully');
      loadPasswords();
    } else {
      showError('Error', result.error || 'Failed to delete password');
    }
  };

  const handlePasswordSuccess = () => {
    loadPasswords();
  };

  const handleTabPress = (tab: string) => {
    setCurrentTab(tab);
  };

  const handleSortPress = () => {
    const sortOptions = ['recent', 'name', 'date'] as const;
    const currentIndex = sortOptions.indexOf(sortBy);
    const nextIndex = (currentIndex + 1) % sortOptions.length;
    setSortBy(sortOptions[nextIndex]);
  };

  const handleLogout = async () => {
    showDestructiveConfirm(
      'Logout',
      'Are you sure you want to logout?',
      async () => {
        const result = await authService.signOut();
        if (!result.success) {
          showError('Error', result.error);
        }
      },
      undefined,
      'Logout',
      'Cancel'
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} translucent={false} />
        <View style={styles.content}>
          {currentTab === 'home' && (
            <>
              {/* Fixed Header */}
              <View style={styles.homeHeader}>
                <View style={styles.headerContent}>
                  <Text style={styles.appTitle}>PassNext</Text>
                  <Text style={styles.appSubtitle}>Your secure password manager</Text>
                </View>
                <TouchableOpacity 
                  style={styles.userAvatar}
                  onPress={() => setCurrentTab('profile')}
                >
                  <Ionicons name="person" size={24} color={Colors.primary} />
                </TouchableOpacity>
              </View>

              {/* Password list with header content */}
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
                ListHeaderComponent={
                  <View style={styles.scrollableHeader}>
                    {/* Enhanced Search */}
                    <View style={styles.searchSection}>
                      <View style={styles.searchContainer}>
                        <Ionicons name="search-outline" size={16} color={Colors.text.tertiary} style={styles.searchIcon} />
                        <TextInput
                          style={styles.searchInput}
                          placeholder="Search your passwords..."
                          placeholderTextColor={Colors.text.tertiary}
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                        {searchQuery.length > 0 && (
                          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
                            <Ionicons name="close-circle" size={18} color={Colors.text.tertiary} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    {/* Analytics Button */}
                    {passwords.length > 0 && (
                      <TouchableOpacity 
                        style={styles.analyticsButton}
                        onPress={() => setShowSecurityDashboard(true)}
                      >
                        <View style={styles.analyticsIcon}>
                          <Ionicons name="analytics" size={20} color={Colors.primary} />
                        </View>
                        <View style={styles.analyticsContent}>
                          <Text style={styles.analyticsTitle}>Security Analytics</Text>
                          <Text style={styles.analyticsSubtitle}>View detailed security insights</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
                      </TouchableOpacity>
                    )}

                    {/* Section Header */}
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionTitleContainer}>
                        <Text style={styles.sectionMainTitle}>Your Passwords</Text>
                        <Text style={styles.sectionSubtitle}>
                          {filteredPasswords.length} {filteredPasswords.length === 1 ? 'password' : 'passwords'}
                          {searchQuery.length > 0 && ` matching "${searchQuery}"`}
                        </Text>
                      </View>
                      {passwords.length > 0 && (
                        <TouchableOpacity style={styles.sortButton} onPress={handleSortPress}>
                          <Ionicons name="swap-vertical" size={16} color={Colors.text.secondary} />
                          <Text style={styles.sortButtonText}>
                            {sortBy === 'recent' ? 'Recent' : sortBy === 'name' ? 'Name' : 'Date'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                }
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <View style={styles.emptyStateIcon}>
                      <Ionicons name="key-outline" size={48} color={Colors.text.tertiary} />
                    </View>
                    <Text style={styles.emptyStateTitle}>
                      {loading ? 'Loading your passwords...' : 
                       searchQuery.length > 0 ? 'No matching passwords' : 'Your vault is empty'}
                    </Text>
                    <Text style={styles.emptyStateText}>
                      {loading ? 'Please wait while we fetch your data' : 
                       searchQuery.length > 0 ? `No passwords match "${searchQuery}"` : 'Add your first password to get started with secure storage'}
                    </Text>
                    {!loading && searchQuery.length === 0 && (
                      <TouchableOpacity 
                        style={styles.addFirstButton}
                        onPress={() => setShowAddModal(true)}
                      >
                        <Ionicons name="add" size={20} color={Colors.text.inverse} style={styles.addFirstButtonIcon} />
                        <Text style={styles.addFirstButtonText}>Add Your First Password</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                }
              />
            </>
          )}

          {currentTab === 'profile' && (
            <ProfileScreen />
          )}
        </View>

        {/* Security Dashboard Modal */}
        {showSecurityDashboard && (
          <View style={styles.modalOverlay}>
            <SecurityDashboard onClose={() => setShowSecurityDashboard(false)} />
          </View>
        )}

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity 
            style={[styles.navItem, currentTab === 'home' && styles.activeNavItem]}
            onPress={() => handleTabPress('home')}
          >
            <Ionicons name="apps" size={22} color={currentTab === 'home' ? Colors.primary : Colors.text.secondary} />
            <Text style={[styles.navText, currentTab === 'home' && styles.activeNavText]}>Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navItem, currentTab === 'profile' && styles.activeNavItem]}
            onPress={() => handleTabPress('profile')}
          >
            <Ionicons name="person" size={22} color={currentTab === 'profile' ? Colors.primary : Colors.text.secondary} />
            <Text style={[styles.navText, currentTab === 'profile' && styles.activeNavText]}>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Floating Add Button */}
        <TouchableOpacity 
          style={styles.floatingAddButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={28} color={Colors.text.inverse} />
        </TouchableOpacity>

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
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  content: {
    flex: 1,
  },
  homeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 24,
  },
  headerContent: {
    flex: 1,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '500',
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
    fontWeight: '400',
  },
  headerStats: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  statsText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  statsLabel: {
    fontSize: 11,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text.primary,
    fontWeight: '400',
  },
  clearSearchButton: {
    padding: 4,
  },
  analyticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  analyticsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  analyticsContent: {
    flex: 1,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  analyticsSubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background,
    zIndex: 1000,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionMainTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: '400',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    gap: 4,
  },
  sortButtonText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  passwordList: {
    flex: 1,
  },
  scrollableHeader: {
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '400',
    lineHeight: 20,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    minHeight: 48,
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addFirstButtonIcon: {
    marginRight: 8,
  },
  addFirstButtonText: {
    color: Colors.text.inverse,
    fontSize: 15,
    fontWeight: '600',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 60,
    minHeight: 48,
  },
  activeNavItem: {
    backgroundColor: Colors.primary + '10',
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  navText: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
    fontWeight: '400',
  },
  activeNavText: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 4,
    fontWeight: '500',
  },
  // Legacy styles - keeping for backward compatibility
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text.primary,
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
    color: Colors.text.primary,
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
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentIconText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
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
    backgroundColor: Colors.surface,
  },
  activeCategoryButton: {
    backgroundColor: Colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  activeCategoryButtonText: {
    color: Colors.text.inverse,
  },
  userInfo: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 5,
  },
  emailText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  passwordSection: {
    flex: 1,
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: Colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  settingsSection: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
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
    color: Colors.text.primary,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  logoutButton: {
    backgroundColor: Colors.error,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
});
