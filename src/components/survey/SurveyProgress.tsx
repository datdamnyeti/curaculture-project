// src/components/survey/SurveyProgress.tsx
import React from 'react';

import { SurveyProgressProps } from '../../types';

const SurveyProgress: React.FC<SurveyProgressProps> = ({
  currentSection,
  totalSections,
  sectionTitle,
  progress
}) => {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-600">
          Section {currentSection + 1} of {totalSections}: {sectionTitle}
        </span>
        <span className="text-sm font-medium text-blue-600">
          {Math.round(progress)}% Complete
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      {/* Section indicators */}
      <div className="mt-2 flex justify-between">
        {Array.from({ length: totalSections }).map((_, index) => (
          <div 
            key={index}
            className={`h-2 w-2 rounded-full ${
              index < currentSection 
                ? 'bg-blue-600' // completed
                : index === currentSection 
                  ? 'bg-blue-400 ring-2 ring-blue-200' // current
                  : 'bg-gray-300' // upcoming
            }`}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default SurveyProgress;