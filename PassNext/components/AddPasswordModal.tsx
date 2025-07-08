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
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { passwordService, PasswordInput } from '../services/passwordService';

interface AddPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

export const AddPasswordModal: React.FC<AddPasswordModalProps> = ({
  visible,
  onClose,
  onSuccess,
  userId,
}) => {
  const [formData, setFormData] = useState<PasswordInput>({
    service: '',
    account: '',
    password: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.service.trim() || !formData.account.trim() || !formData.password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    const result = await passwordService.createPassword(userId, formData);
    setLoading(false);

    if (result.success) {
      Alert.alert('Success', 'Password saved successfully');
      setFormData({ service: '', account: '', password: '', notes: '' });
      onSuccess();
      onClose();
    } else {
      Alert.alert('Error', result.error || 'Failed to save password');
    }
  };

  const handleClose = () => {
    setFormData({ service: '', account: '', password: '', notes: '' });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.keyboardContainer} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
              <Ionicons name="close" size={24} color="#5F6368" />
            </TouchableOpacity>
            <Text style={styles.title}>Add Password</Text>
            <TouchableOpacity onPress={handleSubmit} disabled={loading} style={styles.headerButton}>
              <Text style={[styles.saveButton, loading && styles.disabledButton]}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Service Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="business-outline" size={20} color="#9AA0A6" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.service}
                  onChangeText={(text) => setFormData({ ...formData, service: text })}
                  placeholder="e.g., Google, Facebook, GitHub"
                  placeholderTextColor="#9AA0A6"
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Account</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#9AA0A6" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.account}
                  onChangeText={(text) => setFormData({ ...formData, account: text })}
                  placeholder="Email or username"
                  placeholderTextColor="#9AA0A6"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#9AA0A6" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  placeholder="Enter password"
                  placeholderTextColor="#9AA0A6"
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <Ionicons name="document-text-outline" size={20} color="#9AA0A6" style={[styles.inputIcon, styles.textAreaIcon]} />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                  placeholder="Additional notes"
                  placeholderTextColor="#9AA0A6"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  headerButton: {
    padding: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3C4043',
  },
  cancelButton: {
    fontSize: 16,
    color: '#5F6368',
    fontWeight: '500',
  },
  saveButton: {
    fontSize: 16,
    color: '#1A73E8',
    fontWeight: '600',
  },
  disabledButton: {
    color: '#9AA0A6',
  },
  form: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3C4043',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EAED',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#3C4043',
    fontWeight: '400',
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 16,
    minHeight: 100,
  },
  textAreaIcon: {
    marginTop: 2,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
