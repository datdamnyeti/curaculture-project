// src/components/landing/LandingHero.tsx

import React from 'react';
import { ChevronRight } from 'lucide-react';

interface LandingHeroProps {
  onStartAssessment: () => void;  // For the "Start Assessment" button
  onSignIn: () => void;           // For the "Sign In" button
}

const LandingHero: React.FC<LandingHeroProps> = ({
  onStartAssessment,
  onSignIn
}) => {
  return (
    <div className="bg-gradient-to-b from-blue-50 to-white py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center space-y-8">
          <h1 className="text-5xl font-bold text-gray-900 max-w-4xl mx-auto leading-tight">
            Transform Your Veterinary Practice Through Evidence-Based Cultural Development
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Integrate validated assessment methodologies with actionable insights to nurture organizational wellbeing.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={onStartAssessment}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <span>Start Your Assessment</span>
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              onClick={onSignIn}
              className="border border-blue-600 text-blue-600 px-8 py-4 rounded-lg hover:bg-blue-50"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingHero;