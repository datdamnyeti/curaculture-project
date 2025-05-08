// src/pages/survey-page.tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { validateSurveyToken } from '../utils/surveyTokens';
import SurveyRouter from '../components/survey/SurveyRouter';
import LoadingOverlay from '../components/ui/LoadingOverlay';

const SurveyPage: React.FC = () => {
  const router = useRouter();
  const { token } = router.query;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [campaignId, setCampaignId] = useState<string | undefined>();
  const [clinicId, setClinicId] = useState<string | undefined>();
  
  useEffect(() => {
    if (!token || typeof token !== 'string') {
      setIsLoading(false);
      return;
    }
    
    // Validate the token
    const result = validateSurveyToken(token);
    
    setIsValidToken(result.valid);
    setCampaignId(result.campaignId);
    setClinicId(result.clinicId);
    setIsLoading(false);
  }, [token]);
  
  if (isLoading) {
    return <LoadingOverlay isLoading={true} text="Loading survey..." />;
  }
  
  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Survey Link</h1>
          <p className="text-gray-700 mb-6">
            This survey link is invalid or has expired. Please contact your administrator for a new link.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <SurveyRouter 
        surveyType="retention"
        isAnonymous={true}
        campaignId={campaignId}
        token={token as string}
      />
    </div>
  );
};

export default SurveyPage;