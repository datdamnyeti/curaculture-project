// src/components/landing/LandingFeatures.tsx

import React from 'react';
import { Heart, Brain, Briefcase } from 'lucide-react';

const LandingFeatures: React.FC = () => {
  return (
    <div className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900">
            Evidence-Based Practice Development
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Comprehensive cultural assessment framework validated through rigorous research
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="bg-blue-100 rounded-lg p-3 w-fit">
              <Heart className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              Compassionate Care Focus
            </h3>
            <p className="text-gray-600">
              Enhance patient outcomes through validated cultural metrics that support professional fulfillment.
            </p>
          </div>
          <div className="space-y-4">
            <div className="bg-green-100 rounded-lg p-3 w-fit">
              <Brain className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              Professional Development
            </h3>
            <p className="text-gray-600">
              Foster organizational growth through evidence-based assessment and improvement strategies.
            </p>
          </div>
          <div className="space-y-4">
            <div className="bg-purple-100 rounded-lg p-3 w-fit">
              <Briefcase className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              Practice Excellence
            </h3>
            <p className="text-gray-600">
              Build sustainable organizational cultures that support both clinical excellence and team wellbeing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingFeatures;