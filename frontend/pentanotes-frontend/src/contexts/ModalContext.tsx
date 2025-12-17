import React, { createContext, useContext, useState, useCallback } from 'react';
import { Modal, ModalType } from '../components/Modal';

interface ModalOptions {
  type?: ModalType;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

interface ModalContextType {
  showAlert: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showSuccess: (message: string, title?: string) => void;
  showConfirm: (message: string, onConfirm: () => void, title?: string) => void;
  showPrompt: (message: string, onConfirm: (value: string) => void, title?: string, defaultValue?: string) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
};

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: ModalType;
    title: string;
    message: string;
    onConfirm?: (value?: string) => void;
    confirmText?: string;
    cancelText?: string;
    defaultValue?: string;
  }>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
  });

  const showModal = useCallback((options: ModalOptions & { 
    type: ModalType; 
    onConfirm?: (value?: string) => void;
    defaultValue?: string;
  }) => {
    setModal({
      isOpen: true,
      type: options.type,
      title: options.title || (
        options.type === 'error' ? 'Error' : 
        options.type === 'success' ? 'Success' : 
        options.type === 'confirm' ? 'Confirm' : 
        options.type === 'prompt' ? 'Input Required' :
        'Alert'
      ),
      message: options.message,
      onConfirm: options.onConfirm,
      confirmText: options.confirmText,
      cancelText: options.cancelText,
      defaultValue: options.defaultValue,
    });
  }, []);

  const showAlert = useCallback((message: string, title?: string) => {
    showModal({ type: 'alert', message, title });
  }, [showModal]);

  const showError = useCallback((message: string, title?: string) => {
    showModal({ type: 'error', message, title });
  }, [showModal]);

  const showSuccess = useCallback((message: string, title?: string) => {
    showModal({ type: 'success', message, title });
  }, [showModal]);

  const showConfirm = useCallback((message: string, onConfirm: () => void, title?: string) => {
    showModal({ type: 'confirm', message, title, onConfirm });
  }, [showModal]);

  const showPrompt = useCallback((
    message: string, 
    onConfirm: (value: string) => void, 
    title?: string,
    defaultValue?: string
  ) => {
    showModal({ 
      type: 'prompt', 
      message, 
      title, 
      onConfirm: (value?: string) => {
        if (value !== undefined) {
          onConfirm(value);
        }
      }, 
      defaultValue 
    });
  }, [showModal]);

  const closeModal = useCallback(() => {
    setModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <ModalContext.Provider value={{ showAlert, showError, showSuccess, showConfirm, showPrompt }}>
      {children}
      <Modal
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
        onConfirm={modal.onConfirm}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        defaultValue={modal.defaultValue}
      />
    </ModalContext.Provider>
  );
};

