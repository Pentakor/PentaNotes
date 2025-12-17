import React, { useEffect, useState } from 'react';
import { X, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

export type ModalType = 'alert' | 'confirm' | 'error' | 'success' | 'prompt';

interface ModalProps {
  isOpen: boolean;
  type: ModalType;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: (value?: string) => Promise<void> | void;
  confirmText?: string;
  cancelText?: string;
  defaultValue?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  type,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
  defaultValue = '',
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setInputValue(defaultValue);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, defaultValue]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    try {
      if (onConfirm) {
        if (type === 'prompt') {
          await onConfirm(inputValue);
        } else {
          await onConfirm();
        }
      }
      onClose();
    } catch (err) {
      // Keep modal open if confirm handler throws; handler can show its own modal
      console.error('Modal confirm handler failed:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      handleConfirm();
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      case 'success':
        return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case 'confirm':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      default:
        return <AlertCircle className="w-6 h-6 text-indigo-600" />;
    }
  };

  const getButtonStyles = () => {
    switch (type) {
      case 'error':
        return 'bg-red-600 hover:bg-red-700';
      case 'success':
        return 'bg-green-600 hover:bg-green-700';
      case 'confirm':
        return 'bg-yellow-600 hover:bg-yellow-700';
      default:
        return 'bg-indigo-600 hover:bg-indigo-700';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {getIcon()}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-700 whitespace-pre-wrap">{message}</p>
          {type === 'prompt' && (
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="Enter note title..."
              autoFocus
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          {(type === 'confirm' || type === 'prompt') && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={type === 'confirm' || type === 'prompt' ? handleConfirm : onClose}
            disabled={type === 'prompt' && !inputValue.trim()}
            className={`px-4 py-2 text-white rounded-lg transition-colors font-medium ${getButtonStyles()} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};


