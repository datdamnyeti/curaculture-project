// src/utils/validation.ts - Fixed version

/**
 * Type definitions for validation
 */
export type ValidationRule = {
    validate: (value: any, formData?: any) => boolean;
    message: string;
  };
  
  export type ValidationRules = {
    [field: string]: ValidationRule[];
  };
  
  export type ValidationErrors = {
    [field: string]: string[];
  };
  
  /**
   * Validates form data against provided validation rules
   * @param formData - Object containing form field values
   * @param rules - Object containing validation rules for each field
   * @returns Object containing validation errors for each field
   */
  export const validateForm = (formData: any, rules: ValidationRules): ValidationErrors => {
    const errors: ValidationErrors = {};
  
    Object.keys(rules).forEach((field) => {
      const fieldRules = rules[field];
      const value = formData[field];
      const fieldErrors: string[] = [];
  
      fieldRules.forEach((rule) => {
        if (!rule.validate(value, formData)) {
          fieldErrors.push(rule.message);
        }
      });
  
      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }
    });
  
    return errors;
  };
  
  /**
   * Checks if there are any validation errors
   * @param errors - Validation errors object
   * @returns Boolean indicating if there are any errors
   */
  export const hasErrors = (errors: ValidationErrors): boolean => {
    return Object.keys(errors).length > 0;
  };
  
  /**
   * Format credit card number with spaces
   * Helper function for validation display
   */
  export const formatCreditCard = (value: string): string => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts: string[] = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };
  
  /**
   * Common validation rules that can be reused across the application
   */
  export const validationRules = {
    required: (message = 'This field is required'): ValidationRule => ({
      validate: (value) => {
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        return !!value || value === 0;
      },
      message,
    }),
    
    email: (message = 'Please enter a valid email address'): ValidationRule => ({
      validate: (value) => {
        if (!value) return true; // Don't validate empty values, use required rule for that
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
      },
      message,
    }),
    
    minLength: (length: number, message = `Minimum length is ${length} characters`): ValidationRule => ({
      validate: (value) => {
        if (!value) return true; // Don't validate empty values, use required rule for that
        return String(value).length >= length;
      },
      message,
    }),
    
    maxLength: (length: number, message = `Maximum length is ${length} characters`): ValidationRule => ({
      validate: (value) => {
        if (!value) return true; // Don't validate empty values
        return String(value).length <= length;
      },
      message,
    }),
    
    pattern: (regex: RegExp, message = 'Input format is incorrect'): ValidationRule => ({
      validate: (value) => {
        if (!value) return true; // Don't validate empty values
        return regex.test(value);
      },
      message,
    }),
    
    // For password confirmation
    matches: (fieldToMatch: string, message = 'Fields do not match'): ValidationRule => ({
      validate: (value, formData) => {
        if (!value) return true; // Don't validate empty values
        return value === formData[fieldToMatch];
      },
      message,
    }),
  
    // Custom veterinary clinic culture validations
    clinicNameFormat: (message = 'Clinic name must not contain special characters'): ValidationRule => ({
      validate: (value) => {
        if (!value) return true;
        return /^[a-zA-Z0-9\s\-&.,]+$/.test(value);
      },
      message,
    }),
  
    // Veterinary license format (for practitioner identification)
    licenseFormat: (message = 'License must be in a valid format (XX-12345)'): ValidationRule => ({
      validate: (value) => {
        if (!value) return true;
        return /^[A-Z]{2}-\d{5}$/.test(value);
      },
      message,
    }),
    
    // Number validation
    isNumber: (message = 'Must be a valid number'): ValidationRule => ({
      validate: (value) => {
        if (!value && value !== 0) return true;
        return !isNaN(Number(value));
      },
      message,
    }),
    
    // Min value validation
    min: (minValue: number, message = `Value must be at least ${minValue}`): ValidationRule => ({
      validate: (value) => {
        if (!value && value !== 0) return true;
        const numValue = Number(value);
        return !isNaN(numValue) && numValue >= minValue;
      },
      message,
    }),
    
    // Max value validation
    max: (maxValue: number, message = `Value must not exceed ${maxValue}`): ValidationRule => ({
      validate: (value) => {
        if (!value && value !== 0) return true;
        const numValue = Number(value);
        return !isNaN(numValue) && numValue <= maxValue;
      },
      message,
    }),
    
    // Integer validation
    integer: (message = 'Must be a whole number'): ValidationRule => ({
      validate: (value) => {
        if (!value && value !== 0) return true;
        const numValue = Number(value);
        return !isNaN(numValue) && Number.isInteger(numValue);
      },
      message,
    }),
    
    // URL validation
    url: (message = 'Must be a valid URL'): ValidationRule => ({
      validate: (value) => {
        if (!value) return true;
        try {
          new URL(String(value));
          return true;
        } catch (e) {
          return false;
        }
      },
      message,
    }),
    
    // Zipcode validation (US format)
    zipCodeUS: (message = 'Must be a valid US ZIP code'): ValidationRule => ({
      validate: (value) => {
        if (!value) return true;
        // US ZIP code: 12345 or 12345-6789
        return /^\d{5}(-\d{4})?$/.test(String(value));
      },
      message,
    }),
    
    // Credit card validation
    creditCard: (message = 'Must be a valid credit card number'): ValidationRule => ({
      validate: (value) => {
        if (!value) return true;
        
        // Remove all non-digit characters
        const cardNumber = String(value).replace(/\D/g, '');
        
        // Check length (13-19 digits)
        if (cardNumber.length < 13 || cardNumber.length > 19) {
          return false;
        }
        
        // Luhn algorithm
        let sum = 0;
        let shouldDouble = false;
        
        // Loop from right to left
        for (let i = cardNumber.length - 1; i >= 0; i--) {
          let digit = parseInt(cardNumber.charAt(i), 10);
          
          if (shouldDouble) {
            digit *= 2;
            if (digit > 9) {
              digit -= 9;
            }
          }
          
          sum += digit;
          shouldDouble = !shouldDouble;
        }
        
        return sum % 10 === 0;
      },
      message,
    }),
    
    // CVV validation (for credit cards)
    cvv: (message = 'Must be a valid CVV code'): ValidationRule => ({
      validate: (value) => {
        if (!value) return true;
        // CVV is typically 3 or 4 digits
        return /^[0-9]{3,4}$/.test(String(value));
      },
      message,
    }),
    
    // Expiration date validation
    expirationDate: (message = 'Must be a valid expiration date (MM/YY)'): ValidationRule => ({
      validate: (value) => {
        if (!value) return true;
        
        // Check format (MM/YY)
        if (!/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(String(value))) {
          return false;
        }
        
        // Extract month and year
        const parts = String(value).split('/');
        const month = parseInt(parts[0], 10);
        const year = parseInt(parts[1], 10);
        
        // Create dates for comparison
        const now = new Date();
        const currentYear = now.getFullYear() % 100; // Get last 2 digits
        const currentMonth = now.getMonth() + 1; // JS months are 0-indexed
        
        // Check if date is in the future
        return (year > currentYear) || (year === currentYear && month >= currentMonth);
      },
      message,
    }),
    
    // Subscription plan validation
    subscriptionPlan: (validPlans: string[], message = 'Must be a valid subscription plan'): ValidationRule => ({
      validate: (value) => {
        if (!value) return true;
        return validPlans.includes(String(value));
      },
      message,
    }),
    
    // Custom strength password validation
    strongPassword: (message = 'Password must include uppercase, lowercase, number and special character'): ValidationRule => ({
      validate: (value) => {
        if (!value) return true;
        // At least one uppercase, one lowercase, one number, one special character
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
        return regex.test(String(value));
      },
      message,
    }),
    
    // Conditional validation
    // Validate only if another field has a certain value
    conditional: (
      dependentField: string, 
      expectedValue: any, 
      validationRule: ValidationRule
    ): ValidationRule => ({
      validate: (value, formData) => {
        // If the condition is not met, skip validation
        if (formData[dependentField] !== expectedValue) {
          return true;
        }
        // Otherwise, apply the validation rule
        return validationRule.validate(value, formData);
      },
      message: validationRule.message,
    }),
    
    // Array length validation
    arrayLength: (
      min: number, 
      max: number, 
      message = `Must select between ${min} and ${max} items`
    ): ValidationRule => ({
      validate: (value) => {
        if (!Array.isArray(value)) return false;
        return value.length >= min && value.length <= max;
      },
      message,
    }),
  
    // Culture Assessment Specific Validations
    
    // Validate response length for open-ended culture questions
    responseLength: (
      minWords: number = 5, 
      maxWords: number = 500,
      message = `Response should be between ${minWords} and ${maxWords} words`
    ): ValidationRule => ({
      validate: (value) => {
        if (!value) return true;
        const wordCount = String(value).trim().split(/\s+/).length;
        return wordCount >= minWords && wordCount <= maxWords;
      },
      message,
    }),
  
    // Validate team size for culture assessment context
    teamSizeValidator: (message = 'Team size must be a reasonable number'): ValidationRule => ({
      validate: (value) => {
        if (!value) return true;
        const size = Number(value);
        // Most veterinary teams are between 2 and 200 people
        return !isNaN(size) && size >= 2 && size <= 200 && Number.isInteger(size);
      },
      message,
    }),
  
    // Validate Likert scale responses (common in cultural assessments)
    likertScale: (
      min: number = 1, 
      max: number = 5, 
      message = `Rating must be between ${min} and ${max}`
    ): ValidationRule => ({
      validate: (value) => {
        if (!value && value !== 0) return true;
        const rating = Number(value);
        return !isNaN(rating) && 
              rating >= min && 
              rating <= max && 
              Number.isInteger(rating);
      },
      message,
    }),
  
    // Validate year ranges for experience questions
    yearRange: (
      minYears: number = 0, 
      maxYears: number = 50,
      message = `Years should be between ${minYears} and ${maxYears}`
    ): ValidationRule => ({
      validate: (value) => {
        if (!value) return true;
        const years = Number(value);
        return !isNaN(years) && 
              years >= minYears && 
              years <= maxYears;
      },
      message,
    }),
  
    // Validate percentage inputs for culture metrics
    percentageValue: (message = 'Percentage must be between 0 and 100'): ValidationRule => ({
      validate: (value) => {
        if (!value && value !== 0) return true;
        const percentage = Number(value);
        return !isNaN(percentage) && percentage >= 0 && percentage <= 100;
      },
      message,
    }),
  
    // Validate role selection against clinic roles relevant to culture assessment
    roleValidator: (message = 'Please select a valid role'): ValidationRule => ({
      validate: (value) => {
        const validRoles = [
          'Veterinarian', 
          'Technician', 
          'Assistant', 
          'Receptionist', 
          'Practice Manager',
          'Administrator',
          'Owner',
          'Other'
        ];
        if (!value) return true;
        return validRoles.includes(String(value));
      },
      message,
    }),
  
    // Validate department selection for larger practices
    departmentValidator: (message = 'Please select a valid department'): ValidationRule => ({
      validate: (value) => {
        const validDepartments = [
          'Clinical Care',
          'Administration',
          'Reception',
          'Management',
          'Support Staff',
          'Other'
        ];
        if (!value) return true;
        return validDepartments.includes(String(value));
      },
      message,
    }),
  
    // Validate employment status
    employmentStatusValidator: (message = 'Please select a valid employment status'): ValidationRule => ({
      validate: (value) => {
        const validStatuses = [
          'Full-time',
          'Part-time',
          'Relief',
          'Contractor',
          'Other'
        ];
        if (!value) return true;
        return validStatuses.includes(String(value));
      },
      message,
    }),
  
    // Validate work experience in veterinary field
    veterinaryExperience: (message = 'Please enter valid experience (0-50 years)'): ValidationRule => ({
      validate: (value) => {
        if (!value) return true;
        const years = Number(value);
        return !isNaN(years) && years >= 0 && years <= 50;
      },
      message,
    }),
  
    // Validate workload hours (reasonable range for veterinary practice)
    workloadHours: (message = 'Weekly hours should be between 1 and 80'): ValidationRule => ({
      validate: (value) => {
        if (!value) return true;
        const hours = Number(value);
        return !isNaN(hours) && hours >= 1 && hours <= 80;
      },
      message,
    })
  };
  
  // Interface for hook return type
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
  
  // The hook interface defined to document what the actual hook implementation in useFormValidation.ts will provide
  export const useFormValidation = <T extends Record<string, any>>(
    initialValues: T, 
    validationRules: ValidationRules
  ): FormValidation<T> => {
    // This is just a placeholder interface - the actual implementation
    // is in ../hooks/useFormValidation.ts
    return {
      values: initialValues,
      errors: {},
      touched: {},
      handleChange: (e: any) => {},
      handleBlur: (e: any) => {},
      setValues: (values: Partial<T>) => {},
      validateAll: () => true,
      isValid: true
    };
  };