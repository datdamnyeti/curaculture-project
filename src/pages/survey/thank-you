// src/pages/survey/thank-you.tsx
import React from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

const ThankYouPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex flex-col items-center">
          <div className="bg-green-100 p-3 rounded-full mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-center mb-4">
            Thank You for Completing the Survey!
          </h1>
          
          <p className="text-gray-600 text-center mb-6">
            Your feedback is valuable in helping your practice improve its culture and operations.
            All responses are anonymous and will be analyzed at the group level.
          </p>
          
          <p className="text-sm text-gray-500 text-center mb-8">
            You may close this window now or click the button below to return to the homepage.
          </p>
          
          <Link href="/">
            <span className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block cursor-pointer">
              Return to Homepage
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;