// src/interfaces/auth-interfaces.ts

/**
 * Authentication token
 */
export interface AuthToken {
    token: string;
    expires: number; // timestamp
    userId: string;
  }
  
  /**
   * User registration data
   */
  export interface UserRegistrationData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    clinicName: string;
  }
  
  /**
   * Login credentials
   */
  export interface LoginCredentials {
    email: string;
    password: string;
  }
  
  /**
   * Authentication result
   */
  export interface AuthResult {
    success: boolean;
    message: string;
    user?: User;
  }
  
  /**
   * User object
   */
  export interface User {
    id?: string;
    email: string;
    firstName?: string;
    lastName?: string;
    clinicName?: string;
    clinicId?: string;
  }
  
  /**
   * Stored user with password (for internal use only)
   */
  export interface StoredUser extends User {
    password: string;
    id: string;
    clinicId: string;
  }
  
  /**
   * Auth context type
   */
  export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<AuthResult>;
    register: (userData: UserRegistrationData) => Promise<AuthResult>;
    logout: () => void;
    loading: boolean;
  }
  
  /**
   * Auth provider props
   */
  export interface AuthProviderProps {
    children: React.ReactNode;
  }
  
  /**
   * Authentication view props
   */
  export interface AuthenticationViewProps {
    isLogin: boolean;
    setIsLogin: React.Dispatch<React.SetStateAction<boolean>>;
    setCurrentView: React.Dispatch<React.SetStateAction<string>>;
  }
  
  /**
   * Auth form data
   */
  export interface AuthFormData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    clinicName: string;
  }