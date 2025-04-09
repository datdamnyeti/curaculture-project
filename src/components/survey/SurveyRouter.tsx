// src/components/survey/SurveyRouter.tsx
import React from 'react';
import { SurveyType } from '../../data/surveyTypes';

// Import your CulturalSurveyForm
// Note: Update this import path to match your project structure
import CulturalSurveyForm from '../CulturalSurveyForm';

// This is a placeholder component - you'll need to implement this
// after getting retentionSurveyStructure.ts working
const RetentionSurveyForm = ({ onComplete, initialValues, isAnonymous, demographicFields, campaignId, token }: any) => {
  return (
    <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
      <h3 className="text-lg font-medium text-green-800">Retention Survey</h3>
      <p className="text-green-700 mt-2">
        This is a placeholder for the RetentionSurveyForm component that will display the 1-7 Likert scale retention survey.
        Once you've fixed the import errors, you can replace this with your actual RetentionSurveyForm component.
      </p>
      {/* You can pass through the same props that CulturalSurveyForm would use */}
      <div className="mt-4">
        <button
          onClick={() => onComplete && onComplete({})}
          className="px-4 py-2 bg-green-600 text-white rounded-lg"
        >
          Simulate Completion
        </button>
      </div>
    </div>
  );
};

interface SurveyRouterProps {
  surveyType: SurveyType;
  onComplete?: (formValues: Record<string, any>) => void;
  initialValues?: Record<string, any>;
  isAnonymous?: boolean;
  demographicFields?: any[];
  campaignId?: string;
  token?: string;
}

/**
 * SurveyRouter component that routes to the appropriate survey form based on the surveyType
 */
const SurveyRouter: React.FC<SurveyRouterProps> = ({
  surveyType,
  onComplete,
  initialValues = {},
  isAnonymous = false,
  demographicFields = [],
  campaignId,
  token
}) => {
  // Common props for all survey forms
  const surveyProps = {
    onComplete,
    initialValues,
    isAnonymous,
    demographicFields,
    campaignId,
    token
  };
  
  // Route to the appropriate survey form based on surveyType
  switch (surveyType) {
    case 'retention':
      return <RetentionSurveyForm {...surveyProps} />;
      
    case 'satisfaction':
      // Placeholder for future satisfaction survey
      return (
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-medium text-yellow-800">Client Satisfaction Survey</h3>
          <p className="text-yellow-700 mt-2">
            This survey type is coming soon. Please check back later.
          </p>
        </div>
      );
      
    case 'culture':
    default:
      // Default to culture survey
      return <CulturalSurveyForm {...surveyProps} />;
  }
};

export default SurveyRouter;