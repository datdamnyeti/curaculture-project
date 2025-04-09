// src/hooks/useFormValidation.ts
import { useState, ChangeEvent, FocusEvent } from 'react';
import { validateForm, ValidationErrors, ValidationRules, hasErrors } from '../utils/validation';

/**
 * Custom hook for form validation
 * @param initialValues - Initial form values
 * @param validationRules - Rules to validate the form against
 * @returns Form state, errors, and handler functions
 */
export const useFormValidation = <T extends Record<string, any>>(
  initialValues: T, 
  validationRules: ValidationRules
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // Handle input changes (supports different input types)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let newValue: any = value;

    // Special handling for checkboxes
    if (e.target.type === 'checkbox') {
      const target = e.target as HTMLInputElement; // Type assertion for checkbox properties
      
      if (Array.isArray(values[name])) {
        // For checkbox groups (multiple values)
        const currentValues = [...values[name]];
        
        if (target.checked) {
          newValue = [...currentValues, value];
        } else {
          newValue = currentValues.filter(val => val !== value);
        }
      } else {
        // For single checkbox (boolean value)
        newValue = target.checked;
      }
    }
    
    setValues(prevValues => ({
      ...prevValues,
      [name]: newValue,
    }));
    
    // Validate field on change if it's been touched
    if (touched[name]) {
      const fieldErrors = validateForm({ ...values, [name]: newValue }, { 
        [name]: validationRules[name] 
      });
      setErrors(prev => ({
        ...prev,
        [name]: fieldErrors[name] || [],
      }));
    }
  };
  
  // Handle manual value updates (for non-standard inputs or programmatic changes)
  const setFormValues = (newValues: Partial<T>) => {
    setValues(prev => ({
      ...prev,
      ...newValues,
    }));
  };
  
  // Handle input blur events (mark field as touched and validate)
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));
    
    // Validate field on blur
    const fieldErrors = validateForm(values, { 
      [name]: validationRules[name] 
    });
    setErrors(prev => ({
      ...prev,
      [name]: fieldErrors[name] || [],
    }));
  };
  
  // Validate all fields and mark them as touched
  const validateAll = (): boolean => {
    const newErrors = validateForm(values, validationRules);
    setErrors(newErrors);
    
    // Mark all fields as touched
    const newTouched = Object.keys(validationRules).reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(newTouched);
    
    return !hasErrors(newErrors);
  };
  
  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setValues: setFormValues,
    validateAll,
    isValid: !hasErrors(errors),
  };
};

export default useFormValidation;