import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { passwordService, Password, PasswordInput } from '../services/passwordService';

interface EditPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  password: Password | null;
}

export const EditPasswordModal: React.FC<EditPasswordModalProps> = ({
  visible,
  onClose,
  onSuccess,
  password,
}) => {
  const [formData, setFormData] = useState<PasswordInput>({
    service: password?.service || '',
    account: password?.account || '',
    password: password?.password || '',
    notes: password?.notes || '',
  });
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (password) {
      setFormData({
        service: password.service,
        account: password.account,
        password: password.password,
        notes: password.notes || '',
      });
    }
  }, [password]);

  const handleSubmit = async () => {
    if (!formData.service.trim() || !formData.account.trim() || !formData.password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!password?.id) {
      Alert.alert('Error', 'Password ID not found');
      return;
    }

    setLoading(true);
    const result = await passwordService.updatePassword(password.id, formData);
    setLoading(false);

    if (result.success) {
      Alert.alert('Success', 'Password updated successfully');
      onSuccess();
      onClose();
    } else {
      Alert.alert('Error', result.error || 'Failed to update password');
    }
  };

  const handleClose = () => {
    if (password) {
      setFormData({
        service: password.service,
        account: password.account,
        password: password.password,
        notes: password.notes || '',
      });
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Password</Text>
          <TouchableOpacity onPress={handleSubmit} disabled={loading}>
            <Text style={[styles.saveButton, loading && styles.disabledButton]}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Service Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.service}
              onChangeText={(text) => setFormData({ ...formData, service: text })}
              placeholder="e.g., Google, Facebook, GitHub"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account *</Text>
            <TextInput
              style={styles.input}
              value={formData.account}
              onChangeText={(text) => setFormData({ ...formData, account: text })}
              placeholder="Email or username"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              placeholder="Enter password"
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Additional notes (optional)"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cancelButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  saveButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  disabledButton: {
    color: '#ccc',
  },
  form: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
});
