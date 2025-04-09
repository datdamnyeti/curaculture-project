// src/components/dashboard/SurveyResultsDashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  getAggregatedSectionScores, 
  getAnonymousSurveys,
  getStrengthsAndImprovementAreas
} from '../../utils/anonymousSurveyStorage';
import { useAuth } from '../../contexts/AuthContext';
import { RetentionSurveyStructure } from '../../data/retentionSurveyStructure';

interface SectionScore {
  id: string;
  name: string;
  score: number;
  percentage: number;
  color: string;
}

interface StrengthsAreasType {
  strengths: string[];
  improvementAreas: string[];
}

interface SurveyResultsDashboardProps {
  clinicId?: string;
}

const SurveyResultsDashboard: React.FC<SurveyResultsDashboardProps> = ({ clinicId }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [responseCount, setResponseCount] = useState(0);
  const [sectionScores, setSectionScores] = useState<SectionScore[]>([]);
  const [overallScore, setOverallScore] = useState<number>(0);
  const [strengthsAreas, setStrengthsAreas] = useState<StrengthsAreasType>({ 
    strengths: [], 
    improvementAreas: [] 
  });
  
  // Section IDs for our survey - update these to match your RetentionSurveyStructure
  const sectionIds = [
    'fair_compensation',
    'team_relationships',
    'work_life_balance', 
    'practice_environment',
    'leadership_quality',
    'moral_ethical_alignment',
    'psychological_safety',
    'career_development',
    'purpose_meaning',
    'organizational_justice'
  ];
  
  // Use ONLY the current user's clinicId and not a default
  const effectiveClinicId = clinicId || user?.clinicId;
  
  // Simple console log for debugging
  useEffect(() => {
    console.log('Current user clinicId:', user?.clinicId);
  }, [user]);
  
  // Don't show anything if there's no valid clinicId
  if (!effectiveClinicId) {
    console.log('No valid clinicId available');
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Assessment Results</h2>
        <div className="py-12 text-center text-gray-500">
          No clinic information available
        </div>
      </div>
    );
  }
  
  useEffect(() => {
    const loadData = () => {
      setLoading(true);
      
      try {
        // Get total survey count
        const surveys = getAnonymousSurveys(effectiveClinicId, { isComplete: true });
        setResponseCount(surveys.length);
        
        // Get aggregated scores by section
        const rawSectionScores = getAggregatedSectionScores(effectiveClinicId, sectionIds);
        
        // Process the scores
        const processedScores = Object.entries(rawSectionScores).map(([id, score]) => {
          const percentage = (score / 7) * 100; // Convert 1-7 scale to percentage
          return {
            id,
            name: getSectionName(id),
            score: score,
            percentage: percentage,
            color: getColorForScore(percentage)
          };
        });
        
        // Sort by score (highest to lowest)
        processedScores.sort((a, b) => b.percentage - a.percentage);
        
        setSectionScores(processedScores);
        
        // Calculate overall average score
        const totalScore = processedScores.reduce((sum, section) => sum + section.percentage, 0);
        const avgScore = processedScores.length > 0 ? totalScore / processedScores.length : 0;
        setOverallScore(avgScore);
        
        // Get strengths and improvement areas
        const areas = getStrengthsAndImprovementAreas(effectiveClinicId);
        setStrengthsAreas(areas);
      } catch (error) {
        console.error('Error loading survey results data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [effectiveClinicId, sectionIds]);
  
  // Helper function to get a human-readable section name
  const getSectionName = (sectionId: string): string => {
    // Look up section names from RetentionSurveyStructure
    const section = RetentionSurveyStructure.sections.find(s => s.id === sectionId);
    if (section) {
      // Remove numbering from title (e.g., "1. Fair Compensation" -> "Fair Compensation")
      return section.title.replace(/^\d+\.\s+/, '');
    }
    
    // Fallback naming for sections not found in structure
    const names: Record<string, string> = {
      fair_compensation: 'Fair Compensation',
      team_relationships: 'Team Relationships and Camaraderie',
      work_life_balance: 'Work-Life Balance',
      practice_environment: 'Practice Environment',
      leadership_quality: 'Leadership Quality',
      moral_ethical_alignment: 'Moral and Ethical Alignment',
      psychological_safety: 'Psychological Safety',
      career_development: 'Career Development',
      purpose_meaning: 'Sense of Purpose and Meaning',
      organizational_justice: 'Organizational Justice'
    };
    
    return names[sectionId] || sectionId;
  };
  
  // Get the appropriate color class based on score
  const getColorForScore = (percentage: number): string => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  // Get a text color class based on score
  const getTextColorForScore = (percentage: number): string => {
    if (percentage >= 80) return 'text-green-700';
    if (percentage >= 60) return 'text-yellow-700';
    return 'text-red-700';
  };

  // Get a descriptive label based on score
  const getScoreLabel = (percentage: number): string => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 80) return 'Very Good';
    if (percentage >= 70) return 'Good';
    if (percentage >= 60) return 'Fair';
    if (percentage >= 50) return 'Needs Improvement';
    return 'Serious Concern';
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // If no responses, show placeholder message
  if (responseCount === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Assessment Results</h2>
        <div className="py-12 text-center">
          <div className="text-gray-500 mb-4">No survey responses yet</div>
          <p className="text-gray-600">
            Once team members complete the assessment, results will appear here.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-1">Assessment Results</h2>
        <p className="text-gray-500 mb-6">Based on {responseCount} anonymous responses</p>
        
        {/* Overall Score */}
        <div className="mb-8">
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-xl font-medium mb-3 text-center">Overall Practice Score</h3>
            <div className="flex flex-col items-center">
              <div className={`w-40 h-40 rounded-full flex flex-col items-center justify-center ${getColorForScore(overallScore)} text-white mb-4`}>
                <span className="text-4xl font-bold">{Math.round(overallScore)}</span>
                <span className="text-sm mt-1">out of 100</span>
              </div>
              <span className="text-lg font-medium mt-2 mb-1">{getScoreLabel(overallScore)}</span>
              <p className="text-gray-500 text-center max-w-md text-sm">
                This is the average score across all assessment categories. It represents your overall practice health.
              </p>
            </div>
            
            {/* Overall Progress Bar */}
            <div className="mt-6">
              <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                <div 
                  className={`${getColorForScore(overallScore)} h-4 rounded-full`} 
                  style={{ width: `${overallScore}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Section Scores */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">Assessment Categories</h3>
          <div className="grid gap-4">
            {sectionScores.map((section) => (
              <div key={section.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">{section.name}</h4>
                  <div className="flex items-center">
                    <div className={`mr-2 px-2 py-1 rounded-lg ${getTextColorForScore(section.percentage)} bg-opacity-20 ${section.color.replace('bg-', 'bg-opacity-20 bg-')} font-semibold`}>
                      {Math.round(section.percentage)}
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                  <div 
                    className={`${section.color} h-2.5 rounded-full`} 
                    style={{ width: `${section.percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>0</span>
                  <span>100</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Strengths and Improvement Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-lg font-medium text-green-800 mb-3">Strengths</h3>
            <ul className="space-y-2">
              {strengthsAreas.strengths.map((area, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h3 className="text-lg font-medium text-red-800 mb-3">Improvement Areas</h3>
            <ul className="space-y-2">
              {strengthsAreas.improvementAreas.map((area, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-red-500 mr-2">!</span>
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyResultsDashboard;