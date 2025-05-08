// src/components/auth/AuthenticationView.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Lock, Building, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ViewType } from '../../utils/navigation';

// Form data structure
interface AuthFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  clinicName: string;
}

// Component props
interface AuthenticationViewProps {
  isLogin: boolean;
  setIsLogin: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentView: React.Dispatch<React.SetStateAction<ViewType>>;
}

const AuthenticationView: React.FC<AuthenticationViewProps> = ({
  isLogin,
  setIsLogin,
  setCurrentView
}) => {
  // Get authentication methods from context
  const { login, register: registerUser } = useAuth();
  
  // Form state
  const methods = useForm<AuthFormData>();
const { register, handleSubmit, reset, formState: { errors } } = methods;
  
  // Status message state
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Handle form submission
  const onSubmit = async (data: AuthFormData) => {
    try {
      let result;
      
      if (isLogin) {
        // Login flow
        result = await login(data.email, data.password);
      } else {
        // Registration flow
        result = await registerUser({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          clinicName: data.clinicName
        });
      }
      
      if (result.success) {
        // Show success message
        setStatusMessage({
          type: 'success',
          message: result.message
        });
        
        // Redirect to dashboard
        setTimeout(() => {
          setCurrentView('dashboard');
        }, 1000);
        
        // Clear form
        reset();
      } else {
        // Show error message
        setStatusMessage({
          type: 'error',
          message: result.message
        });
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setStatusMessage({
        type: 'error',
        message: 'An unexpected error occurred'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {isLogin ? 'Welcome Back' : 'Join CuraCulture'}
          </h2>
          <p className="text-gray-600 mt-2">
            {isLogin
              ? 'Continue your journey in practice development'
              : 'Begin transforming your practice culture'}
          </p>
        </div>
        
        {/* Status message */}
        {statusMessage && (
          <div className={`mb-4 p-3 rounded-lg flex items-center ${
            statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{statusMessage.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    {...register("firstName", { required: !isLogin })}
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">First name is required</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    {...register("lastName", { required: !isLogin })}
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">Last name is required</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Practice Name</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    {...register("clinicName", { required: !isLogin })}
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg"
                    placeholder="Veterinary Practice Name"
                  />
                </div>
                {errors.clinicName && <p className="text-red-500 text-xs mt-1">Practice name is required</p>}
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                {...register("email", { 
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address"
                  }
                })}
                type="email"
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                placeholder="your@email.com"
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters"
                  }
                })}
                type="password"
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                placeholder="••••••••"
              />
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setStatusMessage(null);
                reset();
              }}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthenticationView;