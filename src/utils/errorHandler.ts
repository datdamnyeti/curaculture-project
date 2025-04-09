// src/utils/errorHandler.ts

/**
 * Custom error types for better error handling in the application
 */

// Base application error
export class AppError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AppError';
    }
  }
  
  // Authentication errors
  export class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
      super(message);
      this.name = 'AuthenticationError';
    }
  }
  
  export class InvalidCredentialsError extends AuthenticationError {
    constructor(message = 'Invalid email or password') {
      super(message);
      this.name = 'InvalidCredentialsError';
    }
  }
  
  export class RegistrationError extends AuthenticationError {
    constructor(message = 'Registration failed') {
      super(message);
      this.name = 'RegistrationError';
    }
  }
  
  // Validation errors
  export class ValidationError extends AppError {
    public field?: string;
    
    constructor(message: string, field?: string) {
      super(message);
      this.name = 'ValidationError';
      this.field = field;
    }
  }
  
  // Storage errors
  export class StorageError extends AppError {
    constructor(message = 'Storage operation failed') {
      super(message);
      this.name = 'StorageError';
    }
  }
  
  // API errors
  export class ApiError extends AppError {
    public statusCode: number;
    
    constructor(message: string, statusCode: number = 500) {
      super(message);
      this.name = 'ApiError';
      this.statusCode = statusCode;
    }
  }
  
  // Survey-specific errors
  export class SurveyError extends AppError {
    constructor(message = 'Survey operation failed') {
      super(message);
      this.name = 'SurveyError';
    }
  }
  
  export class SurveyValidationError extends ValidationError {
    public sectionId?: string;
    public questionId?: string;
    
    constructor(message: string, questionId?: string, sectionId?: string) {
      super(message);
      this.name = 'SurveyValidationError';
      this.questionId = questionId;
      this.sectionId = sectionId;
    }
  }
  
  /**
   * Error handler function to process and standardize error responses
   * @param error - The error to handle
   * @returns Object containing error details
   */
  export const handleError = (error: unknown): { 
    message: string; 
    type: string;
    field?: string;
    statusCode?: number;
    questionId?: string;
    sectionId?: string;
  } => {
    // Default error response
    let errorResponse = { 
      message: 'An unexpected error occurred', 
      type: 'UnknownError'
    };
    
    if (error instanceof Error) {
      errorResponse.message = error.message;
      errorResponse.type = error.name;
      
      // Handle specific error types
      if (error instanceof ValidationError) {
        return {
          ...errorResponse,
          field: error.field
        };
      }
      
      if (error instanceof ApiError) {
        return {
          ...errorResponse,
          statusCode: error.statusCode
        };
      }
      
      if (error instanceof SurveyValidationError) {
        return {
          ...errorResponse,
          questionId: error.questionId,
          sectionId: error.sectionId
        };
      }
    }
    
    // Log error for debugging
    console.error('Error occurred:', error);
    
    return errorResponse;
  };
  
  /**
   * Centralized error logger
   * @param error - The error to log
   * @param context - Additional context about where the error occurred
   */
  export const logError = (error: unknown, context?: string): void => {
    const timestamp = new Date().toISOString();
    const contextInfo = context ? ` in ${context}` : '';
    
    if (error instanceof Error) {
      console.error(`[${timestamp}] Error${contextInfo}: ${error.name} - ${error.message}`);
      if (error.stack) {
        console.error(error.stack);
      }
    } else {
      console.error(`[${timestamp}] Unknown error${contextInfo}:`, error);
    }
    
    // Here you could add integration with error monitoring services
    // like Sentry, LogRocket, etc.
  };
  
  /**
   * Format validation errors for display
   * @param errors - Validation errors object
   * @returns Formatted error messages
   */
  export const formatValidationErrors = (errors: Record<string, string[]>): string => {
    const errorMessages: string[] = [];
    
    Object.entries(errors).forEach(([field, messages]) => {
      messages.forEach(message => {
        errorMessages.push(`${field}: ${message}`);
      });
    });
    
    return errorMessages.join('\n');
  };
  
  /**
   * Helper to throw appropriate errors based on API responses
   * @param response - Fetch API Response object
   */
  export const handleApiResponse = async (response: Response): Promise<any> => {
    if (!response.ok) {
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // Ignore JSON parsing errors
      }
      
      throw new ApiError(errorMessage, response.status);
    }
    
    try {
      return await response.json();
    } catch (e) {
      // Handle empty responses
      if (response.status === 204) {
        return null;
      }
      throw new ApiError('Invalid JSON response from API');
    }
  };
  
  /**
   * Try-catch wrapper for async functions with standardized error handling
   * @param asyncFn - Async function to execute
   * @param errorHandler - Optional custom error handler
   * @returns Result of the async function or throws a handled error
   */
  export const tryCatch = async <T>(
    asyncFn: () => Promise<T>,
    errorHandler?: (error: unknown) => never
  ): Promise<T> => {
    try {
      return await asyncFn();
    } catch (error) {
      if (errorHandler) {
        errorHandler(error);
      }
      
      // Default error handling
      const handleErrorResult = handleError(error);
      logError(error);
      
      // Re-throw with standardized error
      throw new AppError(handleErrorResult.message);
    }
  };
  
  /**
   * Display an error notification to the user
   * @param error - Error object or message
   * @param title - Optional title for the notification
   */
  export const showErrorNotification = (error: unknown, title = 'Error'): void => {
    let message = 'An unexpected error occurred';
    
    if (typeof error === 'string') {
      message = error;
    } else if (error instanceof Error) {
      message = error.message;
    }
    
    // This is a placeholder - replace with your actual notification system
    // For example, with a toast notification library
    console.error(title, message);
    
    // If you're using a UI notification system, uncomment and adapt this:
    // toast.error(message, { title });
  };
  
  /**
   * Validates field input and throws a ValidationError if invalid
   * @param value - Value to validate
   * @param validators - Array of validation functions
   * @param fieldName - Name of the field (for error reporting)
   */
  export const validateField = (
    value: any,
    validators: Array<(value: any) => { valid: boolean; message: string }>,
    fieldName: string
  ): void => {
    for (const validator of validators) {
      const result = validator(value);
      if (!result.valid) {
        throw new ValidationError(result.message, fieldName);
      }
    }
  };
  
  /**
   * Form validation utility function for use with form submissions
   * @param formData - Form data to validate
   * @param validationSchema - Schema defining validation rules
   * @throws ValidationError if validation fails
   */
  export const validateFormSubmission = (
    formData: Record<string, any>,
    validationSchema: Record<string, Array<(value: any) => { valid: boolean; message: string }>>
  ): void => {
    const errors: Record<string, string> = {};
    
    Object.entries(validationSchema).forEach(([field, validators]) => {
      try {
        validateField(formData[field], validators, field);
      } catch (error) {
        if (error instanceof ValidationError && error.field) {
          errors[error.field] = error.message;
        }
      }
    });
    
    if (Object.keys(errors).length > 0) {
      const errorMessage = formatValidationErrors(
        Object.entries(errors).reduce((acc, [field, message]) => {
          acc[field] = [message];
          return acc;
        }, {} as Record<string, string[]>)
      );
      throw new ValidationError(errorMessage);
    }
  };