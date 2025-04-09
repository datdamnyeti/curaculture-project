// src/utils/scoring.ts

import { SurveyResponses } from '../types';
import { surveyStructure } from '../data/surveyStructure';

export const calculateCategoryScore = (sectionId: string, responses: SurveyResponses): string => {
  const section = surveyStructure.sections.find(s => s.id === sectionId);
  if (!section) return '0';
  
  let totalScore = 0;
  let questionCount = 0;
  
  section.subsections.forEach(subsection => {
    subsection.questions.forEach(question => {
      if (responses[question.id]) {
        totalScore += parseInt(responses[question.id], 10);
        questionCount++;
      }
    });
  });
  
  return questionCount > 0 ? (totalScore / (questionCount * 5) * 100).toFixed(1) : '0';
};

export const getScoreColorClass = (score: string | number): string => {
  const scoreNum = typeof score === 'string' ? parseFloat(score || '0') : score;
  if (scoreNum >= 80) return 'bg-green-500';
  if (scoreNum >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
};