// src/data/surveyTypes.ts

// Import your survey structures
// Note: Replace with the correct import paths for your project
import { retentionSurveyStructure } from './retentionSurveyStructure';

// If you have a culture survey structure, uncomment and update this line
// import { cultureSurveyStructure } from './cultureSurveyStructure';

// Define the survey type
export type SurveyType = 'culture' | 'retention' | 'satisfaction';

// Create a placeholder for the culture survey structure if you don't have it yet
const cultureSurveyStructure = {
  id: 'culture-assessment',
  title: 'Veterinary Practice Culture Assessment',
  description: 'This survey helps identify strengths and areas for improvement in your practice culture.',
  sections: []
};

// Map of survey types to their structures
export const surveyTypes = {
  culture: cultureSurveyStructure,
  retention: retentionSurveyStructure,
  // Add other survey types as they become available
  satisfaction: null // Placeholder for future satisfaction survey
};

// Function to get survey structure by type
export const getSurveyByType = (type: SurveyType) => {
  return surveyTypes[type] || cultureSurveyStructure; // Default to culture survey if type not found
};

// Get a descriptive name for a survey type
export const getSurveyTypeName = (type: SurveyType): string => {
  const names: Record<SurveyType, string> = {
    culture: 'Practice Culture Assessment',
    retention: 'Staff Retention Survey',
    satisfaction: 'Client Satisfaction Survey'
  };
  
  return names[type] || 'Survey';
};

// Get survey type description
export const getSurveyTypeDescription = (type: SurveyType): string => {
  const descriptions: Record<SurveyType, string> = {
    culture: 'Assess your practice culture and identify strengths and areas for improvement',
    retention: 'Identify factors affecting staff retention and satisfaction',
    satisfaction: 'Gather feedback from clients about their experience'
  };
  
  return descriptions[type] || '';
};

// Get recommended survey frequency
export const getSurveyFrequencyRecommendation = (type: SurveyType): string => {
  const frequencies: Record<SurveyType, string> = {
    culture: 'Annually or after significant organizational changes',
    retention: 'Quarterly or semi-annually',
    satisfaction: 'Ongoing or quarterly analysis'
  };
  
  return frequencies[type] || 'As needed';
};

export default surveyTypes;