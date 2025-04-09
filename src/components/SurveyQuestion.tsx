// src/components/SurveyQuestion.tsx
import React from 'react';
import { validationRules } from '../utils/validation';

// Question type definitions
export type QuestionType = 
  | 'likert'      // Likert scale (1-5, 1-7, etc.)
  | 'text'        // Short text response
  | 'textarea'    // Long text response
  | 'multipleChoice' // Single selection from options
  | 'checkboxGroup' // Multiple selection from options
  | 'numeric'     // Numeric input
  | 'dropdown';   // Dropdown selection

export interface QuestionOption {
  id: string;
  label: string;
  value: string | number;
}

export interface QuestionProps {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  options?: QuestionOption[];
  minValue?: number;
  maxValue?: number;
  minWords?: number;
  maxWords?: number;
  value: any;
  onChange: (id: string, value: any) => void;
  onBlur: (id: string) => void;
  error?: string;
  disabled?: boolean;
}

// Helper function to count words in a text string
const countWords = (text: string): number => {
  return text.trim().split(/\s+/).filter(Boolean).length;
};

/**
 * Configures validation rules based on question type and properties
 */
export const getQuestionValidationRules = (question: Omit<QuestionProps, 'onChange' | 'onBlur' | 'value' | 'error'>) => {
  const rules = [];
  
  // Add required validation if the question is required
  if (question.required) {
    rules.push(validationRules.required(`This ${question.type === 'text' || question.type === 'textarea' ? 'answer' : 'selection'} is required`));
  }
  
  // Add type-specific validation rules
  switch (question.type) {
    case 'likert':
      rules.push(validationRules.likertScale(
        question.minValue || 1, 
        question.maxValue || 5,
        `Rating must be between ${question.minValue || 1} and ${question.maxValue || 5}`
      ));
      break;
      
    case 'text':
    case 'textarea':
      if (question.minWords) {
        rules.push({
          validate: (value: string) => {
            if (!value) return !question.required; // Skip if not required and empty
            return countWords(value) >= (question.minWords || 0);
          },
          message: `Response must be at least ${question.minWords} words`
        });
      }
      
      if (question.maxWords) {
        rules.push({
          validate: (value: string) => {
            if (!value) return true;
            return countWords(value) <= (question.maxWords || Infinity);
          },
          message: `Response cannot exceed ${question.maxWords} words`
        });
      }
      break;
      
    case 'numeric':
      rules.push(validationRules.isNumber('Please enter a valid number'));
      
      if (question.minValue !== undefined) {
        rules.push(validationRules.min(
          question.minValue,
          `Value must be at least ${question.minValue}`
        ));
      }
      
      if (question.maxValue !== undefined) {
        rules.push(validationRules.max(
          question.maxValue,
          `Value cannot exceed ${question.maxValue}`
        ));
      }
      break;
      
    case 'checkboxGroup':
      if (question.minValue !== undefined) {
        rules.push({
          validate: (value: any[]) => {
            if (!Array.isArray(value)) return false;
            return value.length >= (question.minValue || 0);
          },
          message: `Please select at least ${question.minValue} option(s)`
        });
      }
      
      if (question.maxValue !== undefined) {
        rules.push({
          validate: (value: any[]) => {
            if (!Array.isArray(value)) return true;
            return value.length <= (question.maxValue || Infinity);
          },
          message: `Please select no more than ${question.maxValue} option(s)`
        });
      }
      break;
  }
  
  return rules;
};

const SurveyQuestion: React.FC<QuestionProps> = ({
  id,
  type,
  text,
  required,
  options = [],
  minValue,
  maxValue,
  value,
  onChange,
  onBlur,
  error,
  disabled = false
}) => {
  // Handler functions
  const handleValueChange = (newValue: any) => {
    onChange(id, newValue);
  };

  const handleBlur = () => {
    onBlur(id);
  };

  // Helper to count words for text inputs with word limits
  const wordCount = type === 'text' || type === 'textarea' 
    ? countWords(value || '')
    : 0;

  // Used to display word count information
  const renderWordCount = () => {
    if (type !== 'text' && type !== 'textarea') return null;
    
    const minText = minValue ? `Min: ${minValue} words` : '';
    const maxText = maxValue ? `Max: ${maxValue} words` : '';
    const limits = [minText, maxText].filter(Boolean).join(' / ');
    
    return (
      <div className="text-xs text-gray-500 mt-1 flex justify-between">
        <span>{limits}</span>
        <span>{wordCount} words</span>
      </div>
    );
  };

  // Render different input types based on question type
  const renderQuestionInput = () => {
    switch (type) {
      case 'likert':
        // Likert scale (1-5, 1-7, etc.)
        const min = minValue || 1;
        const max = maxValue || 5;
        
        return (
          <div className="mt-2">
            <div className="flex justify-between mb-1">
              {/* Scale labels */}
              <span className="text-xs">{min} (Strongly Disagree)</span>
              <span className="text-xs">{max} (Strongly Agree)</span>
            </div>
            
            {/* Likert scale buttons */}
            <div className="flex justify-between items-center">
              {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleValueChange(num)}
                  onBlur={handleBlur}
                  className={`w-10 h-10 rounded-full border ${
                    value === num 
                      ? 'bg-blue-500 text-white border-blue-500' 
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                  disabled={disabled}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        );
      
      case 'text':
        // Short text input
        return (
          <div className="mt-2">
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleValueChange(e.target.value)}
              onBlur={handleBlur}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 
                ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
              disabled={disabled}
            />
            {renderWordCount()}
          </div>
        );
        
      case 'textarea':
        // Long text input
        return (
          <div className="mt-2">
            <textarea
              value={value || ''}
              onChange={(e) => handleValueChange(e.target.value)}
              onBlur={handleBlur}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 
                ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
              disabled={disabled}
            />
            {renderWordCount()}
          </div>
        );
        
      case 'multipleChoice':
        // Radio buttons for single selection
        return (
          <div className="mt-2 space-y-2">
            {options.map((option) => (
              <div key={option.id} className="flex items-center">
                <input
                  type="radio"
                  id={`${id}-${option.id}`}
                  name={id}
                  value={option.value.toString()}
                  checked={value === option.value.toString()}
                  onChange={() => handleValueChange(option.value.toString())}
                  onBlur={handleBlur}
                  className="mr-2"
                  disabled={disabled}
                />
                <label htmlFor={`${id}-${option.id}`} className="text-gray-700">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );
        
      case 'checkboxGroup':
        // Checkboxes for multiple selection
        const selectedValues = Array.isArray(value) ? value : [];
        
        return (
          <div className="mt-2 space-y-2">
            {options.map((option) => (
              <div key={option.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`${id}-${option.id}`}
                  name={id}
                  value={option.value.toString()}
                  checked={selectedValues.includes(option.value.toString())}
                  onChange={(e) => {
                    const optionValue = option.value.toString();
                    if (e.target.checked) {
                      handleValueChange([...selectedValues, optionValue]);
                    } else {
                      handleValueChange(selectedValues.filter(v => v !== optionValue));
                    }
                  }}
                  onBlur={handleBlur}
                  className="mr-2"
                  disabled={disabled}
                />
                <label htmlFor={`${id}-${option.id}`} className="text-gray-700">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );
        
      case 'numeric':
        // Numeric input
        return (
          <div className="mt-2">
            <input
              type="number"
              value={value || ''}
              min={minValue}
              max={maxValue}
              onChange={(e) => handleValueChange(e.target.value)}
              onBlur={handleBlur}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 
                ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
              disabled={disabled}
            />
            {(minValue !== undefined || maxValue !== undefined) && (
              <div className="text-xs text-gray-500 mt-1 flex justify-between">
                {minValue !== undefined && <span>Min: {minValue}</span>}
                {maxValue !== undefined && <span>Max: {maxValue}</span>}
              </div>
            )}
          </div>
        );
        
      case 'dropdown':
        // Dropdown selection
        return (
          <div className="mt-2">
            <select
              value={value || ''}
              onChange={(e) => handleValueChange(e.target.value)}
              onBlur={handleBlur}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 
                ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
              disabled={disabled}
            >
              <option value="">Select an option</option>
              {options.map((option) => (
                <option key={option.id} value={option.value.toString()}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );
        
      default:
        return <div>Unsupported question type</div>;
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-start">
        <label htmlFor={id} className="block text-gray-700 font-medium">
          {text}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>
      
      {renderQuestionInput()}
      
      {error && (
        <div className="mt-1 text-red-500 text-sm">{error}</div>
      )}
    </div>
  );
};

export default SurveyQuestion;