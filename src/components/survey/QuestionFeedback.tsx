// src/components/survey/QuestionFeedback.tsx
import React from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface QuestionFeedbackProps {
  error?: string;
  isValid: boolean;
  isTouched: boolean;
  helperText?: string;
  wordCount?: number;
  minWords?: number;
  maxWords?: number;
}

const QuestionFeedback: React.FC<QuestionFeedbackProps> = ({
  error,
  isValid,
  isTouched,
  helperText,
  wordCount,
  minWords,
  maxWords
}) => {
  // Don't show validation feedback if not touched yet
  if (!isTouched && !helperText && wordCount === undefined) {
    return null;
  }
  
  return (
    <div className="mt-2">
      {/* Error message */}
      {error && (
        <div className="flex items-start text-red-500 text-sm mt-1">
          <AlertCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Valid indicator */}
      {isTouched && isValid && !error && (
        <div className="flex items-center text-green-500 text-sm mt-1">
          <CheckCircle className="h-4 w-4 mr-1" />
          <span>Valid response</span>
        </div>
      )}
      
      {/* Helper text */}
      {helperText && (
        <div className="flex items-start text-gray-500 text-sm mt-1">
          <Info className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
          <span>{helperText}</span>
        </div>
      )}
      
      {/* Word count */}
      {wordCount !== undefined && (
        <div className="flex justify-end text-xs text-gray-500 mt-1">
          <span>
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
            {minWords !== undefined && maxWords !== undefined && (
              <span> (min: {minWords}, max: {maxWords})</span>
            )}
            {minWords !== undefined && maxWords === undefined && (
              <span> (min: {minWords})</span>
            )}
            {minWords === undefined && maxWords !== undefined && (
              <span> (max: {maxWords})</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
};

export default QuestionFeedback;