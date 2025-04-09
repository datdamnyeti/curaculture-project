// src/contexts/UIContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import ToastContainer, { toast, ToastData } from '../components/ui/ToastContainer';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface UIContextType {
  // Global loading state
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  startLoading: () => void;
  stopLoading: () => void;
  
  // Toast notifications
  showToast: typeof toast.show;
  showSuccessToast: typeof toast.success;
  showErrorToast: typeof toast.error;
  showInfoToast: typeof toast.info;
  showWarningToast: typeof toast.warning;
  
  // Confirmation dialogs
  confirm: (options: ConfirmationOptions) => Promise<boolean>;
}

// Create context with default values
const UIContext = createContext<UIContextType>({
  isLoading: false,
  setIsLoading: () => {},
  startLoading: () => {},
  stopLoading: () => {},
  
  showToast: toast.show,
  showSuccessToast: toast.success,
  showErrorToast: toast.error,
  showInfoToast: toast.info,
  showWarningToast: toast.warning,
  
  confirm: async () => false,
});

// Custom hook to use the UI context
export const useUI = () => useContext(UIContext);

// UI Provider component
export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Global loading state
  const [isLoading, setIsLoading] = useState(false);
  
  const startLoading = useCallback(() => setIsLoading(true), []);
  const stopLoading = useCallback(() => setIsLoading(false), []);
  
  // Confirmation dialog state
  const [confirmationState, setConfirmationState] = useState<{
    isOpen: boolean;
    options: ConfirmationOptions;
    resolve: (value: boolean) => void;
  }>({
    isOpen: false,
    options: {
      title: '',
      message: '',
    },
    resolve: () => {},
  });
  
  // Show confirmation dialog and return a promise
  const confirm = useCallback((options: ConfirmationOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmationState({
        isOpen: true,
        options,
        resolve,
      });
    });
  }, []);
  
  // Handle confirmation dialog close
  const handleCloseConfirmation = useCallback(() => {
    setConfirmationState((prev) => ({
      ...prev,
      isOpen: false,
    }));
    confirmationState.resolve(false);
  }, [confirmationState]);
  
  // Handle confirmation
  const handleConfirm = useCallback(() => {
    confirmationState.resolve(true);
    setConfirmationState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, [confirmationState]);
  
  // Toast notification methods
  const showToast = useCallback(toast.show, []);
  const showSuccessToast = useCallback(toast.success, []);
  const showErrorToast = useCallback(toast.error, []);
  const showInfoToast = useCallback(toast.info, []);
  const showWarningToast = useCallback(toast.warning, []);
  
  // Create context value
  const contextValue: UIContextType = {
    isLoading,
    setIsLoading,
    startLoading,
    stopLoading,
    
    showToast,
    showSuccessToast,
    showErrorToast,
    showInfoToast,
    showWarningToast,
    
    confirm,
  };
  
  return (
    <UIContext.Provider value={contextValue}>
      {/* Global loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-2 text-gray-700 font-medium">Loading...</p>
          </div>
        </div>
      )}
      
      {/* Toast container for notifications */}
      <ToastContainer />
      
      {/* Confirmation dialog */}
      <ConfirmationDialog
        isOpen={confirmationState.isOpen}
        onClose={handleCloseConfirmation}
        onConfirm={handleConfirm}
        title={confirmationState.options.title}
        message={confirmationState.options.message}
        confirmText={confirmationState.options.confirmText}
        cancelText={confirmationState.options.cancelText}
        type={confirmationState.options.type}
      />
      
      {children}
    </UIContext.Provider>
  );
};

export default UIProvider;