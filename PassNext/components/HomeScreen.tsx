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
  const [filterByStrength, setFilterByStrength] = useState<'all' | 'weak' | 'fair' | 'strong'>('all');
  const [showSecurityDashboard, setShowSecurityDashboard] = useState(false);  // Load passwords on component mount
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
    
    // Apply strength filter
    if (filterByStrength !== 'all') {
      const getStrengthScore = (pwd: string): number => {
        let score = 0;
        if (pwd.length >= 8) score += 1;
        if (pwd.length >= 12) score += 1;
        if (/[a-z]/.test(pwd)) score += 1;
        if (/[A-Z]/.test(pwd)) score += 1;
        if (/[0-9]/.test(pwd)) score += 1;
        if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
        return score;
      };
      
      filtered = filtered.filter(password => {
        const score = getStrengthScore(password.password);
        const isWeak = score <= 2;
        const isFair = score === 3 || score === 4;
        const isStrong = score >= 5;
        
        if (filterByStrength === 'weak' && !isWeak) return false;
        if (filterByStrength === 'fair' && !isFair) return false;
        if (filterByStrength === 'strong' && !isStrong) return false;
        return true;
      });
    }
    
    setFilteredPasswords(filtered);
  }, [searchQuery, passwords, filterByStrength]);

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
                  <Text style={styles.appSubtitle}>Secure • Simple • Private</Text>
                </View>
                <TouchableOpacity 
                  style={styles.userAvatar}
                  onPress={() => setCurrentTab('profile')}
                >
                  <Ionicons name="person-outline" size={20} color={Colors.text.secondary} />
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
                        <Ionicons name="search-outline" size={18} color={Colors.text.tertiary} style={styles.searchIcon} />
                        <TextInput
                          style={styles.searchInput}
                          placeholder="Search passwords..."
                          placeholderTextColor={Colors.text.tertiary}
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                        {searchQuery.length > 0 && (
                          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
                            <Ionicons name="close-circle" size={16} color={Colors.text.tertiary} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    {/* Quick Filters */}
                    {passwords.length > 0 && (
                      <View style={styles.quickFilters}>
                        <TouchableOpacity
                          style={[
                            styles.filterChip,
                            filterByStrength === 'all' && styles.filterChipActive
                          ]}
                          onPress={() => setFilterByStrength('all')}
                        >
                          <Text style={[
                            styles.filterChipText,
                            filterByStrength === 'all' && styles.filterChipTextActive
                          ]}>All</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[
                            styles.filterChip,
                            styles.filterChipWeak,
                            filterByStrength === 'weak' && styles.filterChipActive
                          ]}
                          onPress={() => setFilterByStrength('weak')}
                        >
                          <Ionicons name="shield-outline" size={12} color={filterByStrength === 'weak' ? Colors.background : '#FF6B6B'} />
                          <Text style={[
                            styles.filterChipText,
                            { color: filterByStrength === 'weak' ? Colors.background : '#FF6B6B' },
                            filterByStrength === 'weak' && styles.filterChipTextActive
                          ]}>Weak</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[
                            styles.filterChip,
                            styles.filterChipFair,
                            filterByStrength === 'fair' && styles.filterChipActive
                          ]}
                          onPress={() => setFilterByStrength('fair')}
                        >
                          <Ionicons name="shield-half-outline" size={12} color={filterByStrength === 'fair' ? Colors.background : '#FFB946'} />
                          <Text style={[
                            styles.filterChipText,
                            { color: filterByStrength === 'fair' ? Colors.background : '#FFB946' },
                            filterByStrength === 'fair' && styles.filterChipTextActive
                          ]}>Fair</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[
                            styles.filterChip,
                            styles.filterChipStrong,
                            filterByStrength === 'strong' && styles.filterChipActive
                          ]}
                          onPress={() => setFilterByStrength('strong')}
                        >
                          <Ionicons name="shield-checkmark" size={12} color={filterByStrength === 'strong' ? Colors.background : '#22C55E'} />
                          <Text style={[
                            styles.filterChipText,
                            { color: filterByStrength === 'strong' ? Colors.background : '#22C55E' },
                            filterByStrength === 'strong' && styles.filterChipTextActive
                          ]}>Strong</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Security Analytics */}
                    {passwords.length > 0 && (
                      <TouchableOpacity 
                        style={styles.analyticsButton}
                        onPress={() => setShowSecurityDashboard(true)}
                      >
                        <View style={styles.analyticsIcon}>
                          <Ionicons name="shield-checkmark-outline" size={18} color={Colors.text.secondary} />
                        </View>
                        <View style={styles.analyticsContent}>
                          <Text style={styles.analyticsTitle}>Security Insights</Text>
                          <Text style={styles.analyticsSubtitle}>View password health</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
                      </TouchableOpacity>
                    )}

                    {/* Section Header */}
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionTitleContainer}>
                        <Text style={styles.sectionMainTitle}>Passwords</Text>
                        <Text style={styles.sectionSubtitle}>
                          {filteredPasswords.length} {filteredPasswords.length === 1 ? 'item' : 'items'}
                          {searchQuery.length > 0 && ` for "${searchQuery}"`}
                          {filterByStrength !== 'all' && (
                            <Text style={styles.filterIndicator}>
                              {' • '}{filterByStrength} passwords
                            </Text>
                          )}
                        </Text>
                      </View>
                    </View>
                  </View>
                }
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <View style={styles.emptyStateIcon}>
                      <Ionicons name="key-outline" size={32} color={Colors.text.tertiary} />
                    </View>
                    <Text style={styles.emptyStateTitle}>
                      {loading ? 'Loading...' : 
                       searchQuery.length > 0 ? 'No results' : 'No passwords yet'}
                    </Text>
                    <Text style={styles.emptyStateText}>
                      {loading ? 'Getting your passwords ready' : 
                       searchQuery.length > 0 ? `Nothing found for "${searchQuery}"` : 'Start by adding your first password'}
                    </Text>
                    {!loading && searchQuery.length === 0 && (
                      <TouchableOpacity 
                        style={styles.addFirstButton}
                        onPress={() => setShowAddModal(true)}
                      >
                        <Ionicons name="add" size={18} color={Colors.background} style={styles.addFirstButtonIcon} />
                        <Text style={styles.addFirstButtonText}>Add Password</Text>
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
            <Ionicons 
              name={currentTab === 'home' ? "grid" : "grid-outline"} 
              size={20} 
              color={currentTab === 'home' ? Colors.primary : Colors.text.tertiary} 
            />
            <Text style={[styles.navText, currentTab === 'home' && styles.activeNavText]}>Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navItem, currentTab === 'profile' && styles.activeNavItem]}
            onPress={() => handleTabPress('profile')}
          >
            <Ionicons 
              name={currentTab === 'profile' ? "person" : "person-outline"} 
              size={20} 
              color={currentTab === 'profile' ? Colors.primary : Colors.text.tertiary} 
            />
            <Text style={[styles.navText, currentTab === 'profile' && styles.activeNavText]}>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Floating Add Button */}
        <TouchableOpacity 
          style={styles.floatingAddButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color={Colors.background} />
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flex: 1,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  appSubtitle: {
    fontSize: 13,
    color: Colors.text.tertiary,
    marginTop: 2,
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
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    minHeight: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text.primary,
    fontWeight: '400',
  },
  clearSearchButton: {
    padding: 4,
    marginLeft: 8,
  },
  quickFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
    paddingBottom: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipWeak: {
    borderColor: 'rgba(255, 107, 107, 0.3)',
    backgroundColor: 'rgba(255, 107, 107, 0.05)',
  },
  filterChipFair: {
    borderColor: 'rgba(255, 185, 70, 0.3)',
    backgroundColor: 'rgba(255, 185, 70, 0.05)',
  },
  filterChipStrong: {
    borderColor: 'rgba(34, 197, 94, 0.3)',
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.text.tertiary,
  },
  filterChipTextActive: {
    color: Colors.background,
  },
  analyticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  analyticsIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  analyticsContent: {
    flex: 1,
  },
  analyticsTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  analyticsSubtitle: {
    fontSize: 12,
    color: Colors.text.tertiary,
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
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionMainTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.text.tertiary,
    fontWeight: '400',
  },
  sortIndicator: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500',
  },
  filterIndicator: {
    fontSize: 11,
    color: '#FFB946',
    fontWeight: '500',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 4,
  },
  sortContainer: {
    position: 'relative',
  },
  sortMenuBackdrop: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: 'transparent',
    zIndex: 9998,
  },
  sortMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 180,
    marginTop: 4,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  sortMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  sortMenuItemActive: {
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
  },
  sortMenuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  sortMenuItemText: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '400',
  },
  sortMenuItemTextActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
  sortOrderIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(138, 43, 226, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortButtonText: {
    fontSize: 11,
    color: Colors.text.tertiary,
    fontWeight: '500',
  },
  passwordList: {
    flex: 1,
  },
  scrollableHeader: {
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 120,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 13,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '400',
    lineHeight: 18,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  addFirstButtonIcon: {
    marginRight: 6,
  },
  addFirstButtonText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: '500',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 60,
    minHeight: 44,
  },
  activeNavItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 80,
    right: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  navText: {
    fontSize: 11,
    color: Colors.text.tertiary,
    marginTop: 4,
    fontWeight: '400',
  },
  activeNavText: {
    fontSize: 11,
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
