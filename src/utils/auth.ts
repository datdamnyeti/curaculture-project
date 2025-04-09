// src/utils/auth.ts

import { User } from '../utils/storage';

// Check if we're running in a browser environment
const isBrowser = typeof window !== 'undefined';

// Token structure
interface AuthToken {
  token: string;
  expires: number; // timestamp
  userId: string;
}

// Keys for local storage
const AUTH_TOKEN_KEY = 'curaCulture_auth_token';
const USERS_KEY = 'curaCulture_users';

// Simulated user database
interface StoredUser extends User {
  password: string; // In a real app, this would be hashed
  id: string;
  clinicId: string; // Ensure this exists
}

// Get users from localStorage or initialize empty array
const getUsers = (): StoredUser[] => {
  if (!isBrowser) return [];
  
  try {
    const usersJson = localStorage.getItem(USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

// Save users to localStorage
const saveUsers = (users: StoredUser[]): void => {
  if (!isBrowser) return;
  
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Error saving users:', error);
  }
};

// Generate a unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Generate an auth token
const generateToken = (userId: string): AuthToken => {
  // Token expires in 24 hours
  const expires = Date.now() + 24 * 60 * 60 * 1000;
  const token = btoa(`${userId}:${expires}:${Math.random()}`);
  
  return {
    token,
    expires,
    userId
  };
};

// Save token to localStorage
const saveToken = (token: AuthToken): void => {
  if (!isBrowser) return;
  
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(token));
  } catch (error) {
    console.error('Error saving auth token:', error);
  }
};

// Get token from localStorage
export const getToken = (): AuthToken | null => {
  if (!isBrowser) return null;
  
  try {
    const tokenJson = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!tokenJson) return null;
    
    const token = JSON.parse(tokenJson) as AuthToken;
    
    // Check if token is expired
    if (token.expires < Date.now()) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      return null;
    }
    
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Register a new user
export const registerUser = (userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  clinicName: string;
}): { success: boolean; message: string; user?: User } => {
  if (!isBrowser) return { success: false, message: 'Registration unavailable' };
  
  try {
    const users = getUsers();
    
    // Check if user already exists
    if (users.some(user => user.email === userData.email)) {
      return { success: false, message: 'User with this email already exists' };
    }
    
    // Always generate a unique clinicId regardless of clinic name
    const clinicId = 'clinic-' + generateId();
    
    // Create new user (in a real app, password would be hashed)
    const newUser: StoredUser = {
      ...userData,
      id: generateId(),
      clinicId
    };
    
    // Add to "database"
    users.push(newUser);
    saveUsers(users);
    
    // Generate and save token
    const token = generateToken(newUser.id);
    saveToken(token);
    
    // Return user without password
    const { password, ...userWithoutPassword } = newUser;
    return { 
      success: true, 
      message: 'Registration successful',
      user: userWithoutPassword
    };
  } catch (error) {
    console.error('Error registering user:', error);
    return { success: false, message: 'Registration failed' };
  }
};

// Login a user
export const loginUser = (
  email: string,
  password: string
): { success: boolean; message: string; user?: User } => {
  if (!isBrowser) return { success: false, message: 'Login unavailable' };
  
  try {
    const users = getUsers();
    
    // Find user
    const user = users.find(u => u.email === email);
    
    // Check if user exists and password matches
    if (!user || user.password !== password) {
      return { success: false, message: 'Invalid email or password' };
    }
    
    // Generate and save token
    const token = generateToken(user.id);
    saveToken(token);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return { 
      success: true, 
      message: 'Login successful',
      user: userWithoutPassword
    };
  } catch (error) {
    console.error('Error logging in:', error);
    return { success: false, message: 'Login failed' };
  }
};

// Logout user
export const logoutUser = (): void => {
  if (!isBrowser) return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return getToken() !== null;
};

// Get current user
export const getCurrentUser = (): User | null => {
  if (!isBrowser) return null;
  
  const token = getToken();
  if (!token) return null;
  
  const users = getUsers();
  const user = users.find(u => u.id === token.userId);
  
  if (!user) return null;
  
  // Return user without password
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// Initialize with a demo account if no users exist
export const initializeAuth = (): void => {
  if (!isBrowser) return;
  
  const users = getUsers();
  if (users.length === 0) {
    // Add demo account with clinic ID
    const demoUser: StoredUser = {
      id: 'demo1',
      email: 'demo@example.com',
      password: 'password123',
      firstName: 'Demo',
      lastName: 'User',
      clinicName: 'Demo Clinic',
      clinicId: 'demo-clinic'
    };
    
    users.push(demoUser);
    saveUsers(users);
    console.log('Demo account created: demo@example.com / password123');
  } else {
    // Update existing users to add clinicId if missing
    let updatedUsers = false;
    
    users.forEach(user => {
      if (!user.clinicId) {
        user.clinicId = 'clinic-' + generateId();
        updatedUsers = true;
      }
    });
    
    if (updatedUsers) {
      saveUsers(users);
      console.log('Updated existing users with clinic IDs');
    }
  }
};