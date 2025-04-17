// src/components/survey/SurveyRouter.tsx
import React from 'react';
import { SurveyType } from '../../data/surveyTypes';

// Import only the RetentionSurveyForm
import RetentionSurveyForm from './RetentionSurveyForm';

interface SurveyRouterProps {
  surveyType: SurveyType;
  onComplete?: (formValues: Record<string, any>) => void;
  initialValues?: Record<string, any>;
  isAnonymous?: boolean;
  demographicFields?: any[];
  campaignId?: string;
  token?: string;
  hideCategories?: boolean; // Added the missing property
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
  token,
  hideCategories = false // Set default value to false
}) => {
  // Common props for all survey forms
  const surveyProps = {
    onComplete,
    initialValues,
    isAnonymous,
    demographicFields,
    campaignId,
    token,
    hideCategories // Pass the property to the form
  };
  
  // Always return the RetentionSurveyForm regardless of surveyType
  return <RetentionSurveyForm {...surveyProps} />;
};

export default SurveyRouter;