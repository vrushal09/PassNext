import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Colors from '../constants/Colors';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { PasswordInput, passwordService } from '../services/passwordService';
import { CustomAlert } from './CustomAlert';
import PasswordStrengthMeter from './PasswordStrengthMeter';

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
    expiryDate: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);
  const [hasExpiryDate, setHasExpiryDate] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showExpirySettings, setShowExpirySettings] = useState(false);
  const { alertState, hideAlert, showSuccess, showError } = useCustomAlert();

  const handleSubmit = async () => {
    if (!formData.service.trim() || !formData.account.trim() || !formData.password.trim()) {
      showError('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    // Set expiry date if enabled
    const passwordData = {
      ...formData,
      expiryDate: hasExpiryDate ? formData.expiryDate : undefined,
    };

    const result = await passwordService.createPassword(userId, passwordData);
    setLoading(false);

    if (result.success) {
      showSuccess('Success', 'Password saved successfully', () => {
        setFormData({ service: '', account: '', password: '', notes: '', expiryDate: undefined });
        setHasExpiryDate(false);
        onSuccess();
        onClose();
      });
    } else {
      showError('Error', result.error || 'Failed to save password');
    }
  };

  const handleClose = () => {
    setFormData({ service: '', account: '', password: '', notes: '', expiryDate: undefined });
    setHasExpiryDate(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.keyboardContainer} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Compact Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
              <Ionicons name="close" size={22} color={Colors.text.secondary} />
            </TouchableOpacity>
            <Text style={styles.title}>Add Password</Text>
            <TouchableOpacity onPress={handleSubmit} disabled={loading} style={styles.saveButton}>
              <Text style={[styles.saveButtonText, loading && styles.disabledButton]}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* Service Name */}
            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <Ionicons name="business-outline" size={18} color={Colors.text.tertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.service}
                  onChangeText={(text) => setFormData({ ...formData, service: text })}
                  placeholder="Service name (e.g., Google, Facebook)"
                  placeholderTextColor={Colors.input.placeholder}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Account */}
            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={18} color={Colors.text.tertiary} style={styles.inputIcon} />
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

            {/* Password */}
            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.text.tertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  placeholder="Enter password"
                  placeholderTextColor={Colors.input.placeholder}
                  secureTextEntry
                />
              </View>
              
              {/* Compact Password Strength Meter */}
              {formData.password.length > 0 && (
                <PasswordStrengthMeter
                  password={formData.password}
                  userInputs={[formData.service, formData.account]}
                  showSuggestions={false}
                  style={styles.strengthMeter}
                />
              )}
            </View>

            {/* Notes - Collapsible */}
            <TouchableOpacity 
              style={styles.collapsibleHeader}
              onPress={() => setShowNotes(!showNotes)}
            >
              <Ionicons name="document-text-outline" size={16} color={Colors.text.secondary} />
              <Text style={styles.collapsibleTitle}>Notes</Text>
              <Ionicons 
                name={showNotes ? "chevron-up" : "chevron-down"} 
                size={16} 
                color={Colors.text.secondary} 
              />
            </TouchableOpacity>
            
            {showNotes && (
              <View style={styles.inputGroup}>
                <View style={styles.textAreaContainer}>
                  <TextInput
                    style={styles.textArea}
                    value={formData.notes}
                    onChangeText={(text) => setFormData({ ...formData, notes: text })}
                    placeholder="Additional notes..."
                    placeholderTextColor={Colors.input.placeholder}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            )}

            {/* Password Expiry - Collapsible */}
            <TouchableOpacity 
              style={styles.collapsibleHeader}
              onPress={() => setShowExpirySettings(!showExpirySettings)}
            >
              <Ionicons name="calendar-outline" size={16} color={Colors.text.secondary} />
              <Text style={styles.collapsibleTitle}>Password Expiry</Text>
              <View style={styles.collapsibleRight}>
                {hasExpiryDate && (
                  <Text style={styles.expiryIndicator}>
                    {formData.expiryDate ? formData.expiryDate.toLocaleDateString() : 'Set'}
                  </Text>
                )}
                <Ionicons 
                  name={showExpirySettings ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color={Colors.text.secondary} 
                />
              </View>
            </TouchableOpacity>
            
            {showExpirySettings && (
              <View style={styles.inputGroup}>
                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>Set expiry date</Text>
                  <Switch
                    value={hasExpiryDate}
                    onValueChange={(value) => {
                      setHasExpiryDate(value);
                      if (!value) {
                        setFormData({ ...formData, expiryDate: undefined });
                      } else {
                        const defaultExpiry = new Date();
                        defaultExpiry.setDate(defaultExpiry.getDate() + 90);
                        setFormData({ ...formData, expiryDate: defaultExpiry });
                      }
                    }}
                    trackColor={{ false: Colors.text.tertiary, true: Colors.primary }}
                    thumbColor={hasExpiryDate ? Colors.primary : Colors.text.secondary}
                  />
                </View>
                
                {hasExpiryDate && (
                  <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={() => setShowExpiryPicker(true)}
                  >
                    <Text style={styles.datePickerText}>
                      {formData.expiryDate ? formData.expiryDate.toDateString() : 'Select expiry date'}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Bottom Spacing */}
            <View style={styles.bottomSpacing} />
          </ScrollView>
        </KeyboardAvoidingView>
        
        {/* Date Picker */}
        {showExpiryPicker && (
          <DateTimePicker
            value={formData.expiryDate || new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowExpiryPicker(false);
              if (selectedDate) {
                setFormData({ ...formData, expiryDate: selectedDate });
              }
            }}
            minimumDate={new Date()}
          />
        )}
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
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerButton: {
    padding: 6,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 14,
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  form: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.input.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '400',
  },
  strengthMeter: {
    marginTop: 8,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    minHeight: 80,
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.input.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  collapsibleTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
    marginLeft: 10,
  },
  collapsibleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expiryIndicator: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.input.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '400',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.input.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'space-between',
  },
  datePickerText: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '400',
  },
  bottomSpacing: {
    height: 20,
  },
});
