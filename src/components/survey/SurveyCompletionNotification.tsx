// src/components/survey/SurveyCompletionNotification.tsx
import React from 'react';
import { CheckCircle } from 'lucide-react';

interface SurveyCompletionNotificationProps {
  onViewResults?: () => void;
  onStartNewSurvey?: () => void;
  onReturnToDashboard?: () => void;
  clinicName?: string;
  isAnonymous?: boolean;
}

const SurveyCompletionNotification: React.FC<SurveyCompletionNotificationProps> = ({
  onViewResults,
  onStartNewSurvey,
  onReturnToDashboard,
  clinicName = 'your practice',
  isAnonymous = false
}) => {
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
      <div className="flex flex-col items-center">
        <div className="bg-green-100 p-3 rounded-full mb-4">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
       
        <h2 className="text-2xl font-bold text-green-600 mb-4">Survey Completed!</h2>
       
        <p className="text-gray-700 mb-6">
          {isAnonymous ? (
            <>
              Thank you for completing the survey. Your responses are anonymous and will help
              improve the workplace culture at your practice.
            </>
          ) : (
            <>
              Thank you for completing the {clinicName} cultural assessment.
              Your responses will help identify strengths and areas for improvement in your practice culture.
            </>
          )}
        </p>
       
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mt-4">
          {!isAnonymous && onViewResults && (
            <button
              type="button"
              onClick={onViewResults}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View Results
            </button>
          )}
         
          {!isAnonymous && onStartNewSurvey && (
            <button
              type="button"
              onClick={onStartNewSurvey}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Start New Survey
            </button>
          )}
         
          {onReturnToDashboard && !isAnonymous && (
            <button
              type="button"
              onClick={onReturnToDashboard}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Return to Dashboard
            </button>
          )}
         
          {isAnonymous && (
            <button
              type="button"
              onClick={() => window.close()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close Window
            </button>
          )}
        </div>
       
        {isAnonymous && (
          <p className="mt-8 text-sm text-gray-500">
            You may now close this window. Thank you for your participation.
          </p>
        )}
      </div>
    </div>
  );
};

export default SurveyCompletionNotification;