// src/components/survey/SurveyRouter.tsx
import React from 'react';
import RetentionSurveyForm from './RetentionSurveyForm';

interface SurveyRouterProps {
  surveyType: string; // We'll keep this for future expansion
  onComplete?: (formValues: Record<string, any>) => void;
  initialValues?: Record<string, any>;
  isAnonymous?: boolean;
  demographicFields?: any[];
  campaignId?: string;
  token?: string;
}

const SurveyRouter: React.FC<SurveyRouterProps> = ({
  surveyType, // Keep this parameter but ignore it for now
  onComplete,
  initialValues = {},
  isAnonymous = false,
  demographicFields = [],
  campaignId,
  token
}) => {
  // For now, always return the RetentionSurveyForm
  // In the future, we'll expand this to support multiple survey types
  return (
    <RetentionSurveyForm 
      onComplete={onComplete}
      initialValues={initialValues}
      isAnonymous={isAnonymous}
      demographicFields={demographicFields}
      campaignId={campaignId}
      token={token}
    />
  );
};

export default SurveyRouter;