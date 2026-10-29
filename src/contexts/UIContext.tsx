// src/contexts/UIContext.tsx
// Toasts and confirmation dialogs. The previous version built toast objects
// but never stored them, so nothing ever appeared on screen.
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import ToastContainer, { ToastData } from '../components/ui/ToastContainer';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

type ShowToast = (message: string, duration?: number) => void;

interface UIContextType {
  showSuccessToast: ShowToast;
  showErrorToast: ShowToast;
  showInfoToast: ShowToast;
  showWarningToast: ShowToast;
  confirm: (options: ConfirmationOptions) => Promise<boolean>;
}

const noop: ShowToast = () => {};
const UIContext = createContext<UIContextType>({
  showSuccessToast: noop,
  showErrorToast: noop,
  showInfoToast: noop,
  showWarningToast: noop,
  confirm: async () => false,
});

export const useUI = () => useContext(UIContext);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const counter = useRef(0);

  const push = useCallback((type: ToastData['type'], fallback: number) => (message: string, duration = fallback) => {
    counter.current += 1;
    const id = `${Date.now()}-${counter.current}`;
    setToasts((t) => [...t, { id, message, type, duration }]);
  }, []);

  const dismiss = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const [dialog, setDialog] = useState<{ open: boolean; options: ConfirmationOptions; resolve: (v: boolean) => void }>({
    open: false,
    options: { title: '', message: '' },
    resolve: () => {},
  });

  const confirm = useCallback(
    (options: ConfirmationOptions) => new Promise<boolean>((resolve) => setDialog({ open: true, options, resolve })),
    [],
  );
  const close = (answer: boolean) => {
    dialog.resolve(answer);
    setDialog((d) => ({ ...d, open: false }));
  };

  const value: UIContextType = {
    showSuccessToast: push('success', 3000),
    showErrorToast: push('error', 6000),
    showInfoToast: push('info', 3000),
    showWarningToast: push('warning', 4000),
    confirm,
  };

  return (
    <UIContext.Provider value={value}>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <ConfirmationDialog
        isOpen={dialog.open}
        onClose={() => close(false)}
        onConfirm={() => close(true)}
        title={dialog.options.title}
        message={dialog.options.message}
        confirmText={dialog.options.confirmText}
        cancelText={dialog.options.cancelText}
        type={dialog.options.type}
      />
      {children}
    </UIContext.Provider>
  );
};

export default UIProvider;
