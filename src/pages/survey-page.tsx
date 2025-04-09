// src/pages/survey-page.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { validateSurveyToken, markTokenCompleted } from '../utils/surveyTokens';
import { saveTokenSurvey } from '../utils/anonymousSurveyStorage';
import SurveyRouter from '../components/survey/SurveyRouter';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import { getCampaign } from '../utils/surveyCampaigns';
import { SurveyType, getSurveyTypeName } from '../data/surveyTypes';

const SurveyPage: React.FC = () => {
  const router = useRouter();
  const { token, type = 'culture' } = router.query;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [clinicId, setClinicId] = useState<string | undefined>(undefined);
  const [campaignId, setCampaignId] = useState<string | undefined>(undefined);
  const [campaignName, setCampaignName] = useState<string | undefined>(undefined);
  const [surveyType, setSurveyType] = useState<SurveyType>('culture');
  const [error, setError] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    // Set survey type from query parameter if valid
    if (type && typeof type === 'string') {
      const validType = ['culture', 'retention', 'satisfaction'].includes(type) 
        ? type as SurveyType 
        : 'culture';
      setSurveyType(validType);
    }
    
    if (token && typeof token === 'string') {
      // Validate the token
      const validation = validateSurveyToken(token);
      
      if (validation.valid && validation.clinicId && validation.campaignId) {
        setIsValid(true);
        setClinicId(validation.clinicId);
        setCampaignId(validation.campaignId);
        
        // Get campaign details
        const campaign = getCampaign(validation.campaignId, validation.clinicId);
        if (campaign) {
          setCampaignName(campaign.name);
          
          // Get survey type from campaign
          setSurveyType(campaign.surveyType);
        }
      } else {
        setError('This survey link is invalid or has expired.');
      }
      
      setIsLoading(false);
    } else if (!token) {
      // No token provided, using direct survey type
      setIsValid(true);
      setIsLoading(false);
    }
  }, [token, type]);
  
  const handleSurveyComplete = async (formValues: any) => {
    if (!token || !clinicId || !campaignId || typeof token !== 'string') {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Save the survey response
      await saveTokenSurvey(
        token,
        {
          isComplete: true,
          responses: formValues,
          demographics: {
            role: formValues.role || undefined,
            experienceYears: formValues.experience_years ? Number(formValues.experience_years) : undefined,
            teamSize: formValues.team_size ? Number(formValues.team_size) : undefined
          },
          progress: 100
        },
        campaignId,
        clinicId
      );
      
      // Mark the token as completed
      markTokenCompleted(token);
      
      // Redirect to the thank you page
      router.push('/survey/thank-you');
    } catch (error) {
      console.error('Error completing survey:', error);
      setError('Failed to submit survey. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Helper to get demographic fields for anonymous surveys
  const getDemographicFields = () => {
    return [
      { 
        id: 'role',
        text: 'What is your role in the practice?',
        type: 'dropdown',
        required: true,
        options: [
          { id: 'vet', label: 'Veterinarian', value: 'Veterinarian' },
          { id: 'tech', label: 'Technician', value: 'Technician' },
          { id: 'assistant', label: 'Assistant', value: 'Assistant' },
          { id: 'reception', label: 'Receptionist', value: 'Receptionist' },
          { id: 'manager', label: 'Practice Manager', value: 'Practice Manager' },
          { id: 'admin', label: 'Administrator', value: 'Administrator' },
          { id: 'other', label: 'Other', value: 'Other' }
        ]
      },
      {
        id: 'experience_years',
        text: 'How many years have you worked in veterinary practice?',
        type: 'numeric',
        required: true,
        minValue: 0,
        maxValue: 50
      },
      {
        id: 'team_size',
        text: 'Approximately how many people work at your practice?',
        type: 'numeric',
        required: false,
        minValue: 2,
        maxValue: 200
      }
    ];
  };
  
  if (isLoading) {
    return <LoadingOverlay isLoading={true} text="Loading Survey..." />;
  }
  
  if (error) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-xl text-red-600 font-bold mb-4">Error</h2>
        <p className="text-gray-700">{error}</p>
        <div className="mt-6">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">{getSurveyTypeName(surveyType)}</h1>
          {campaignName && (
            <p className="text-gray-600 mt-2">{campaignName}</p>
          )}
        </div>
        
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <p className="text-blue-700">
            Your responses are anonymous and will help improve the workplace culture at your practice.
            Please answer all questions thoughtfully and honestly.
          </p>
        </div>
        
        <SurveyRouter 
          surveyType={surveyType}
          onComplete={handleSurveyComplete}
          isAnonymous={true}
          demographicFields={getDemographicFields()}
          campaignId={campaignId}
          token={typeof token === 'string' ? token : undefined}
        />
      </div>
    </div>
  );
};

export default SurveyPage;