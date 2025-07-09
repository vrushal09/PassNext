import { useState } from 'react';

interface CustomAlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  title: string;
  message?: string;
  buttons?: CustomAlertButton[];
  icon?: string;
  iconColor?: string;
}

export const useCustomAlert = () => {
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    options: AlertOptions;
  }>({
    visible: false,
    options: { title: '' },
  });

  const showAlert = (options: AlertOptions) => {
    const defaultButtons: CustomAlertButton[] = [
      { text: 'OK', style: 'default' }
    ];

    setAlertState({
      visible: true,
      options: {
        ...options,
        buttons: options.buttons || defaultButtons,
      },
    });
  };

  const hideAlert = () => {
    setAlertState(prev => ({ ...prev, visible: false }));
  };

  // Common alert types
  const showSuccess = (title: string, message?: string, onPress?: () => void) => {
    showAlert({
      title,
      message,
      icon: 'checkmark-circle',
      iconColor: '#34A853',
      buttons: [{ text: 'OK', onPress, style: 'default' }],
    });
  };

  const showError = (title: string, message?: string, onPress?: () => void) => {
    showAlert({
      title,
      message,
      icon: 'alert-circle',
      iconColor: '#FF3B30',
      buttons: [{ text: 'OK', onPress, style: 'default' }],
    });
  };

  const showConfirm = (
    title: string,
    message?: string,
    onConfirm?: () => void,
    onCancel?: () => void,
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel'
  ) => {
    showAlert({
      title,
      message,
      icon: 'help-circle',
      buttons: [
        { text: cancelText, onPress: onCancel, style: 'cancel' },
        { text: confirmText, onPress: onConfirm, style: 'default' },
      ],
    });
  };

  const showDestructiveConfirm = (
    title: string,
    message?: string,
    onConfirm?: () => void,
    onCancel?: () => void,
    confirmText: string = 'Delete',
    cancelText: string = 'Cancel'
  ) => {
    showAlert({
      title,
      message,
      icon: 'warning',
      iconColor: '#FF3B30',
      buttons: [
        { text: cancelText, onPress: onCancel, style: 'cancel' },
        { text: confirmText, onPress: onConfirm, style: 'destructive' },
      ],
    });
  };

  return {
    alertState,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showConfirm,
    showDestructiveConfirm,
  };
};
