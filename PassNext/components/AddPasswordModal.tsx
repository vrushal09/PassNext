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
import { useCustomAlert } from '../hooks/useCustomAlert';
import { CustomAlert } from './CustomAlert';
import Colors from '../constants/Colors';

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
  const { alertState, hideAlert, showSuccess, showError } = useCustomAlert();

  const handleSubmit = async () => {
    if (!formData.service.trim() || !formData.account.trim() || !formData.password.trim()) {
      showError('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    const result = await passwordService.createPassword(userId, formData);
    setLoading(false);

    if (result.success) {
      showSuccess('Success', 'Password saved successfully', () => {
        setFormData({ service: '', account: '', password: '', notes: '' });
        onSuccess();
        onClose();
      });
    } else {
      showError('Error', result.error || 'Failed to save password');
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
              <Ionicons name="close" size={24} color={Colors.text.secondary} />
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
                <Ionicons name="business-outline" size={20} color={Colors.text.tertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.service}
                  onChangeText={(text) => setFormData({ ...formData, service: text })}
                  placeholder="e.g., Google, Facebook, GitHub"
                  placeholderTextColor={Colors.input.placeholder}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Account</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={Colors.text.tertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.account}
                  onChangeText={(text) => setFormData({ ...formData, account: text })}
                  placeholder="Email or username"
                  placeholderTextColor={Colors.input.placeholder}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.text.tertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  placeholder="Enter password"
                  placeholderTextColor={Colors.input.placeholder}
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <Ionicons name="document-text-outline" size={20} color={Colors.text.tertiary} style={[styles.inputIcon, styles.textAreaIcon]} />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                  placeholder="Additional notes"
                  placeholderTextColor={Colors.input.placeholder}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      
      <CustomAlert
        visible={alertState.visible}
        title={alertState.options.title}
        message={alertState.options.message}
        buttons={alertState.options.buttons || []}
        onClose={hideAlert}
        icon={alertState.options.icon}
        iconColor={alertState.options.iconColor}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerButton: {
    padding: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  cancelButton: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  saveButton: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  disabledButton: {
    color: Colors.text.tertiary,
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
    fontSize: 14,
    fontWeight: '400',
    color: Colors.text.secondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.input.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 18,
    minHeight: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
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
