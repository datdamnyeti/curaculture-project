// src/interfaces/ui-interfaces.ts

/**
 * Loading overlay props
 */
export interface LoadingOverlayProps {
    isLoading: boolean;
    text?: string;
    children?: React.ReactNode;
    className?: string;
  }
  
  /**
   * Loading spinner props
   */
  export interface LoadingSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    color?: 'primary' | 'secondary' | 'white';
    className?: string;
  }
  
  /**
   * Button variants
   */
  export type ButtonVariant = 
    | 'primary' 
    | 'secondary' 
    | 'success' 
    | 'danger' 
    | 'warning' 
    | 'info' 
    | 'outline' 
    | 'ghost';
  
  /**
   * Button sizes
   */
  export type ButtonSize = 'sm' | 'md' | 'lg';
  
  /**
   * Button props
   */
  export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    loadingText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
    className?: string;
  }
  
  /**
   * Input props
   */
  export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
    isRequired?: boolean;
    className?: string;
  }
  
  /**
   * Toast types
   */
  export type ToastType = 'success' | 'error' | 'warning' | 'info';
  
  /**
   * Toast data
   */
  export interface ToastData {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
  }
  
  /**
   * Toast container props
   */
  export interface ToastContainerProps {
    toasts: ToastData[];
    onDismiss: (id: string) => void;
  }
  
  /**
   * Toast props
   */
  export interface ToastProps {
    id: string;
    type: ToastType;
    message: string;
    title?: string;
    duration?: number;
    onClose: (id: string) => void;
  }
  
  /**
   * Confirmation dialog props
   */
  export interface ConfirmationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
  }
  
  /**
   * Confirmation options
   */
  export interface ConfirmationOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
  }
  
  /**
   * UI context type
   */
  export interface UIContextType {
    isLoading: boolean;
    setIsLoading: (isLoading: boolean) => void;
    startLoading: () => void;
    stopLoading: () => void;
    
    showToast: (message: string, type?: ToastType, duration?: number) => ToastData;
    showSuccessToast: (message: string, duration?: number) => ToastData;
    showErrorToast: (message: string, duration?: number) => ToastData;
    showInfoToast: (message: string, duration?: number) => ToastData;
    showWarningToast: (message: string, duration?: number) => ToastData;
    
    confirm: (options: ConfirmationOptions) => Promise<boolean>;
  }
  
  /**
   * UI provider props
   */
  export interface UIProviderProps {
    children: React.ReactNode;
  }