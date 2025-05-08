// src/data/surveyTypes.ts
import { retentionSurveyStructure } from './retentionSurveyStructure';

// Define the survey type for now - we'll expand this later
export type SurveyType = 'retention';

// Map of survey types to their structures
export const surveyTypes = {
  retention: retentionSurveyStructure,
  // We'll add more survey types here as we implement them
};

// Function to get survey structure by type
export const getSurveyByType = (type: SurveyType) => {
  return surveyTypes[type] || retentionSurveyStructure;
};

// Get a descriptive name for a survey type
export const getSurveyTypeName = (type: SurveyType): string => {
  const names: Record<SurveyType, string> = {
    retention: 'Staff Retention Survey',
  };
  
  return names[type] || 'Survey';
};

// Get survey type description
export const getSurveyTypeDescription = (type: SurveyType): string => {
  const descriptions: Record<SurveyType, string> = {
    retention: 'Identify factors affecting staff retention and satisfaction',
  };
  
  return descriptions[type] || '';
};

// Get recommended survey frequency
export const getSurveyFrequencyRecommendation = (type: SurveyType): string => {
  const frequencies: Record<SurveyType, string> = {
    retention: 'Quarterly or semi-annually',
  };
  
  return frequencies[type] || 'As needed';
};

export default surveyTypes;