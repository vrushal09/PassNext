import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Clipboard,
  Platform,
} from 'react-native';
import { Password } from '../services/passwordService';
import { biometricAuthService } from '../services/biometricAuthService';

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

  const handleDelete = () => {
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
  };

  const maskedPassword = password.password.replace(/./g, '●');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.service}>{password.service}</Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => onEdit(password)} style={styles.actionButton}>
            <Text style={styles.editButton}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
            <Text style={styles.deleteButton}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Account:</Text>
        <TouchableOpacity onPress={() => copyToClipboard(password.account, 'Account')}>
          <Text style={styles.value}>{password.account}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Password:</Text>
        <View style={styles.passwordContainer}>
          <Text style={styles.value}>
            {maskedPassword}
          </Text>
          <TouchableOpacity 
            onPress={copyPasswordToClipboard}
            style={styles.copyButton}
          >
            <Text style={styles.copyButtonText}>Copy</Text>
          </TouchableOpacity>
        </View>
      </View>

      {password.notes && (
        <View style={styles.field}>
          <Text style={styles.label}>Notes:</Text>
          <Text style={styles.notes}>{password.notes}</Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.date}>Created: {formatDate(password.createdAt)}</Text>
        {password.updatedAt.getTime() !== password.createdAt.getTime() && (
          <Text style={styles.date}>Updated: {formatDate(password.updatedAt)}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  service: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 12,
  },
  editButton: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
  },
  field: {
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    flex: 1,
  },
  notes: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginTop: 4,
  },
  copyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 12,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  date: {
    fontSize: 11,
    color: '#999',
  },
});
