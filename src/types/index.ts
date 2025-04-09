// src/types/index.ts

export interface User {
  email: string;
  clinicId?: string; // Add this property
}

export interface AuthFormType {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  clinicName: string;
  role: string;
}

export interface SurveyResponses {
  [key: string]: string;
}

export interface SurveyData {
  currentSection: number;
  currentSubsection: number;
  responses: SurveyResponses;
  progress: number;
  isComplete: boolean;
}