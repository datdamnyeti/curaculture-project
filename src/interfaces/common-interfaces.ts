// src/interfaces/common-interfaces.ts

/**
 * Navigation view types
 */
export type ViewType = 'landing' | 'auth' | 'dashboard' | 'survey' | 'results';

/**
 * Navigation state
 */
export interface NavigationState {
  currentView: ViewType;
  isLogin: boolean;
}

/**
 * Navigation actions
 */
export interface NavigationActions {
  navigateToAuth: (isLogin: boolean) => void;
  navigateToDashboard: () => void;
  navigateToLanding: () => void;
  navigateToSurvey: () => void;
  navigateToResults: () => void;
}

/**
 * Validation rule
 */
export interface ValidationRule {
  validate: (value: any, formData?: any) => boolean;
  message: string;
}

/**
 * Validation rules by field
 */
export interface ValidationRules {
  [field: string]: ValidationRule[];
}

/**
 * Validation errors by field
 */
export interface ValidationErrors {
  [field: string]: string[];
}

/**
 * Form validation result
 */
export interface FormValidation<T> {
  values: T;
  errors: ValidationErrors;
  touched: { [key: string]: boolean };
  handleChange: (e: any) => void;
  handleBlur: (e: any) => void;
  setValues: (values: Partial<T>) => void;
  validateAll: () => boolean;
  isValid: boolean;
}

/**
 * App error types
 */
export interface ErrorResponse {
  message: string;
  type: string;
  field?: string;
  statusCode?: number;
  questionId?: string;
  sectionId?: string;
}

/**
 * Landing view props
 */
export interface LandingViewProps {
  onStartAssessment: () => void;
  onSignIn: () => void;
}

/**
 * Email options
 */
export interface EmailOptions {
  to: string;
  subject: string;
  body: string;
}