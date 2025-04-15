// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  isAuthenticated as checkAuth,
  initializeAuth
} from '../utils/auth';
import { User } from '../utils/storage';
import { initializeSampleCampaigns } from '../utils/surveyCampaigns';

// Initialize auth system with demo account if needed
initializeAuth();

// Define the shape of our context
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    clinicName: string;
  }) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  loading: boolean;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user on initial render
  useEffect(() => {
    const loadUser = () => {
      setLoading(true);
     
      // Check if user is authenticated
      const isAuth = checkAuth();
      setIsAuthenticated(isAuth);
     
      if (isAuth) {
        // Get current user
        const currentUser = getCurrentUser();
        setUser(currentUser);
      }
     
      setLoading(false);
    };
   
    loadUser();
  }, []);

  // Login user
  const login = async (email: string, password: string) => {
    const result = loginUser(email, password);
   
    if (result.success && result.user) {
      setUser(result.user);
      setIsAuthenticated(true);
      
      // Check if the user has any campaigns - if not, initialize sample retention campaign
      if (result.user.clinicId) {
        setTimeout(() => {
          try {
            // Initialize a sample retention campaign
            initializeSampleCampaigns(result.user!.clinicId!);
          } catch (error) {
            console.error("Error initializing sample campaign:", error);
          }
        }, 500);
      }
    }
   
    return result;
  };

  // Register user
  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    clinicName: string;
  }) => {
    const result = registerUser(userData);
   
    if (result.success && result.user) {
      setUser(result.user);
      setIsAuthenticated(true);
      
      // Initialize sample retention campaign for new user
      if (result.user.clinicId) {
        try {
          initializeSampleCampaigns(result.user.clinicId);
          console.log(`Initialized sample retention campaign for new user: ${result.user.email}`);
        } catch (error) {
          console.error("Error initializing sample campaign:", error);
        }
      }
    }
   
    return result;
  };

  // Logout user
  const logout = () => {
    logoutUser();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      login,
      register,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
 
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
 
  return context;
};