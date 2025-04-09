// src/components/AuthenticationView.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useUI } from '../contexts/UIContext';
import { validationRules } from '../utils/validation';
import { useFormValidation } from '../hooks/useFormValidation';
import Input from './ui/Input';
import Button from './ui/Button';
import LoadingOverlay from './ui/LoadingOverlay';

type AuthMode = 'login' | 'register';

interface AuthenticationViewProps {
  onSuccess?: () => void;
}

// Define properly typed interfaces for form values
interface LoginValues {
  email: string;
  password: string;
}

interface RegisterValues extends LoginValues {
  confirmPassword: string;
  clinicName: string;
  licenseNumber: string;
}

type FormValues = LoginValues | RegisterValues;

const AuthenticationView: React.FC<AuthenticationViewProps> = ({ onSuccess }) => {
  const router = useRouter();
  const { showErrorToast, showSuccessToast } = useUI();
  const [mode, setMode] = useState<AuthMode>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Define validation rules based on auth mode
  const getValidationRules = (authMode: AuthMode) => {
    const baseRules = {
      email: [
        validationRules.required('Email is required'),
        validationRules.email('Please enter a valid email address')
      ],
      password: [
        validationRules.required('Password is required'),
        validationRules.minLength(8, 'Password must be at least 8 characters long'),
        validationRules.pattern(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
          'Password must include uppercase, lowercase, number and special character'
        )
      ]
    };

    if (authMode === 'register') {
      return {
        ...baseRules,
        confirmPassword: [
          validationRules.required('Please confirm your password'),
          validationRules.matches('password', 'Passwords do not match')
        ],
        clinicName: [
          validationRules.required('Clinic name is required'),
          validationRules.minLength(2, 'Clinic name must be at least 2 characters'),
          validationRules.maxLength(100, 'Clinic name cannot exceed 100 characters'),
          validationRules.clinicNameFormat()
        ],
        licenseNumber: [
          validationRules.required('License number is required'),
          validationRules.licenseFormat()
        ]
      };
    }

    return baseRules;
  };

  // Initial form values
  const getInitialValues = (authMode: AuthMode): LoginValues | RegisterValues => {
    const baseValues: LoginValues = {
      email: '',
      password: ''
    };

    if (authMode === 'register') {
      return {
        ...baseValues,
        confirmPassword: '',
        clinicName: '',
        licenseNumber: ''
      };
    }

    return baseValues;
  };

  // Initialize form validation
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setValues,
    validateAll,
    isValid
  } = useFormValidation<FormValues>(getInitialValues(mode) as FormValues, getValidationRules(mode));

  // Update form when mode changes
  React.useEffect(() => {
    setValues(getInitialValues(mode) as FormValues);
  }, [mode, setValues]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields before submission
    const isFormValid = validateAll();
    if (!isFormValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        // Simulate login API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Store authentication state (in a real app, would store tokens securely)
        localStorage.setItem('isAuthenticated', 'true');
        
        showSuccessToast('Login successful!');
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/survey');
        }
      } else {
        // Simulate registration API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        showSuccessToast('Registration successful! You can now log in.');
        setMode('login');
        setValues(getInitialValues('login') as FormValues);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      showErrorToast(
        error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
  };

  // Helper function to safely access form values for either login or register
  const getValue = (key: keyof RegisterValues): string => {
    return (values as any)[key] || '';
  };

  // Helper function to safely access errors
  const getError = (key: keyof RegisterValues): string | undefined => {
    return touched[key] && errors[key] ? errors[key][0] : undefined;
  };

  return (
    <LoadingOverlay isLoading={isSubmitting} text={mode === 'login' ? 'Logging in...' : 'Creating account...'}>
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {mode === 'login' ? 'Login' : 'Create an Account'}
        </h2>
        
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            <Input
              id="email"
              name="email"
              type="email"
              label="Email"
              value={getValue('email')}
              onChange={handleChange}
              onBlur={handleBlur}
              error={getError('email')}
              isRequired
              fullWidth
            />
            
            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              value={getValue('password')}
              onChange={handleChange}
              onBlur={handleBlur}
              error={getError('password')}
              isRequired
              fullWidth
            />
            
            {mode === 'register' && (
              <>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  label="Confirm Password"
                  value={getValue('confirmPassword')}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={getError('confirmPassword')}
                  isRequired
                  fullWidth
                />
                
                <Input
                  id="clinicName"
                  name="clinicName"
                  type="text"
                  label="Clinic Name"
                  value={getValue('clinicName')}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={getError('clinicName')}
                  isRequired
                  fullWidth
                />
                
                <Input
                  id="licenseNumber"
                  name="licenseNumber"
                  type="text"
                  label="License Number"
                  helperText="Format: XX-12345"
                  value={getValue('licenseNumber')}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={getError('licenseNumber')}
                  isRequired
                  fullWidth
                />
              </>
            )}
          </div>
          
          <div className="mt-6">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isSubmitting}
              loadingText={mode === 'login' ? 'Logging in...' : 'Creating account...'}
              disabled={isSubmitting || !isValid}
            >
              {mode === 'login' ? 'Login' : 'Create Account'}
            </Button>
          </div>
          
          <div className="mt-4 text-center">
            <Button
              type="button"
              variant="ghost"
              onClick={toggleMode}
              disabled={isSubmitting}
            >
              {mode === 'login' 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Login"}
            </Button>
          </div>
        </form>
      </div>
    </LoadingOverlay>
  );
};

export default AuthenticationView;