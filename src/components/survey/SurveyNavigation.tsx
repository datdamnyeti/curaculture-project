// src/components/survey/SurveyNavigation.tsx
import React from 'react';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';

interface SurveyNavigationProps {
  currentSection: number;
  totalSections: number;
  isFirstSection: boolean;
  isLastSection: boolean;
  isSubmitting: boolean;
  isSectionValid: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSave?: () => void;
  showSaveButton?: boolean;
}

const SurveyNavigation: React.FC<SurveyNavigationProps> = ({
  currentSection,
  totalSections,
  isFirstSection,
  isLastSection,
  isSubmitting,
  isSectionValid,
  onPrevious,
  onNext,
  onSave,
  showSaveButton = true
}) => {
  return (
    <div className="flex justify-between items-center mt-8">
      {/* Previous button */}
      <button
        type="button"
        onClick={onPrevious}
        disabled={isFirstSection || isSubmitting}
        className={`px-4 py-2 flex items-center space-x-2 border rounded-lg ${
          isFirstSection || isSubmitting
            ? 'opacity-50 cursor-not-allowed text-gray-400 border-gray-200'
            : 'text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Previous</span>
      </button>
      
      {/* Center area (save button) */}
      <div>
        {showSaveButton && onSave && (
          <button
            type="button"
            onClick={onSave}
            disabled={isSubmitting}
            className={`px-4 py-2 flex items-center space-x-2 border border-blue-300 text-blue-600 rounded-lg ${
              isSubmitting
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-blue-50'
            }`}
          >
            <Save className="h-4 w-4" />
            <span>Save Progress</span>
          </button>
        )}
      </div>
      
      {/* Next/Submit button */}
      <button
        type="button"
        onClick={onNext}
        disabled={isSubmitting || !isSectionValid}
        className={`px-4 py-2 flex items-center space-x-2 bg-blue-600 text-white rounded-lg ${
          isSubmitting || !isSectionValid
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-blue-700'
        }`}
      >
        <span>{isLastSection ? 'Submit' : 'Next'}</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export default SurveyNavigation;