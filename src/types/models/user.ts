// src/types/models/user.ts

export interface User {
    id?: string;
    email: string;
    firstName?: string;
    lastName?: string;
    clinicName?: string;
    clinicId?: string;
  }
  
  export interface StoredUser extends User {
    password: string;
    id: string;
    clinicId: string;
  }
  
  export interface AuthToken {
    token: string;
    expires: number; // timestamp
    userId: string;
  }
  
  export interface UserRegistrationData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    clinicName: string;
  }
  
  export interface AuthResult {
    success: boolean;
    message: string;
    user?: User;
  }