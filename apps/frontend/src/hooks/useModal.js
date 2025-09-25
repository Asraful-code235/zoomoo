import { useState } from 'react';

export const useModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalProps, setModalProps] = useState({});

  const showModal = ({ 
    title, 
    message, 
    type = 'info', 
    confirmText = 'OK', 
    cancelText = 'Cancel',
    onConfirm,
    showCancel = false
  }) => {
    setModalProps({
      title,
      message,
      type,
      confirmText,
      cancelText,
      onConfirm,
      showCancel
    });
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setModalProps({});
  };

  // Convenient methods for different types of modals
  const showAlert = (message, title = null, type = 'info') => {
    showModal({
      title,
      message,
      type,
      confirmText: 'OK',
      showCancel: false
    });
  };

  const showSuccess = (message, title = 'Success') => {
    showAlert(message, title, 'success');
  };

  const showError = (message, title = 'Error') => {
    showAlert(message, title, 'error');
  };

  const showWarning = (message, title = 'Warning') => {
    showAlert(message, title, 'warning');
  };

  const showConfirm = (message, onConfirm, title = 'Confirm') => {
    showModal({
      title,
      message,
      type: 'confirm',
      confirmText: 'Yes',
      cancelText: 'No',
      onConfirm,
      showCancel: true
    });
  };

  return {
    isOpen,
    modalProps,
    closeModal,
    showModal,
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showConfirm
  };
};
