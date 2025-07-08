import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

export const HomeScreen: React.FC = () => {
  const { user } = useAuth();

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
    alignItems: 'center',
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
