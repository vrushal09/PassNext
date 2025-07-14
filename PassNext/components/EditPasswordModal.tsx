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
import { useCustomAlert } from '../hooks/useCustomAlert';
import { CustomAlert } from './CustomAlert';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import Colors from '../constants/Colors';

interface EditPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  password: Password | null;
  userId: string;
}

export const EditPasswordModal: React.FC<EditPasswordModalProps> = ({
  visible,
  onClose,
  onSuccess,
  password,
  userId,
}) => {
  const [formData, setFormData] = useState<PasswordInput>({
    service: password?.service || '',
    account: password?.account || '',
    password: password?.password || '',
    notes: password?.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const { alertState, hideAlert, showSuccess, showError } = useCustomAlert();

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
      showError('Error', 'Please fill in all required fields');
      return;
    }

    if (!password?.id) {
      showError('Error', 'Password ID not found');
      return;
    }

    setLoading(true);
    const result = await passwordService.updatePassword(password.id, userId, formData);
    setLoading(false);

    if (result.success) {
      showSuccess('Success', 'Password updated successfully', () => {
        onSuccess();
        onClose();
      });
    } else {
      showError('Error', result.error || 'Failed to update password');
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
            
            {/* Password Strength Meter */}
            {formData.password.length > 0 && (
              <PasswordStrengthMeter
                password={formData.password}
                userInputs={[formData.service, formData.account]}
                showSuggestions={true}
                style={styles.strengthMeter}
              />
            )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
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
    padding: 20,
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
  input: {
    backgroundColor: Colors.input.background,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
    color: Colors.text.primary,
    minHeight: 56,
  },
  textArea: {
    height: 100,
    paddingTop: 18,
    textAlignVertical: 'top',
  },
  strengthMeter: {
    marginTop: 12,
  },
});
