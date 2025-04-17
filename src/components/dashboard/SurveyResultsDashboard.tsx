// src/components/dashboard/SurveyResultsDashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  getAggregatedSectionScores, 
  getAnonymousSurveys,
  getStrengthsAndImprovementAreas
} from '../../utils/anonymousSurveyStorage';
import { useAuth } from '../../contexts/AuthContext';
import { RetentionSurveyStructure } from '../../data/retentionSurveyStructure';
import { getCategoryName, getCategoryById } from '../../utils/categoryDescriptions';
import InfoTooltip from '../ui/InfoTooltip';

interface SectionScore {
  id: string;
  name: string;
  score: number;
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
  
  // Section IDs that match the RetentionSurveyStructure
  // These IDs must match the exact section IDs used in categorizing question responses
  // Updating them to match the exact IDs from the survey structure
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
  
  // Get the appropriate color class based on raw Likert score
  const getColorForScore = (score: number): string => {
    if (score >= 5.5) return 'bg-green-500';  // Green for 5.5-7
    if (score >= 2.6) return 'bg-yellow-500'; // Yellow for 2.6-5.4
    return 'bg-red-500';                      // Red for 1-2.5
  };
  
  // Get a text color class based on score
  const getTextColorForScore = (score: number): string => {
    if (score >= 5.5) return 'text-green-700';  // Green for 5.5-7
    if (score >= 2.6) return 'text-yellow-700'; // Yellow for 2.6-5.4
    return 'text-red-700';                     // Red for 1-2.5
  };
  
  // Get a descriptive label based on score
  const getScoreLabel = (score: number): string => {
    if (score >= 6.5) return 'Excellent';
    if (score >= 5.5) return 'Very Good';
    if (score >= 4.5) return 'Good';
    if (score >= 3.5) return 'Fair';
    if (score >= 2.6) return 'Needs Improvement';
    return 'Serious Concern';
  };
  
  useEffect(() => {
    const loadData = () => {
      setLoading(true);
      
      try {
        // Get total survey count
        const surveys = getAnonymousSurveys(effectiveClinicId, { isComplete: true });
        setResponseCount(surveys.length);
        
        console.log('Fetching scores for sections:', sectionIds);
        
        // Get aggregated scores by section
        const rawSectionScores = getAggregatedSectionScores(effectiveClinicId, sectionIds);
        
        console.log('Raw section scores:', rawSectionScores);
        
        // Process the scores
        const processedScores = Object.entries(rawSectionScores).map(([id, score]) => {
          return {
            id,
            name: getCategoryName(id), // Use our helper function for human-readable names
            score: score,
            color: getColorForScore(score)
          };
        });
        
        // Sort by score (highest to lowest)
        processedScores.sort((a, b) => b.score - a.score);
        
        setSectionScores(processedScores);
        
        // Calculate overall average score
        const totalScore = processedScores.reduce((sum, section) => sum + section.score, 0);
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
                <span className="text-4xl font-bold">{overallScore.toFixed(1)}</span>
                <span className="text-sm mt-1">out of 7</span>
              </div>
              <span className="text-lg font-medium mt-2 mb-1">{getScoreLabel(overallScore)}</span>
              <p className="text-gray-500 text-center max-w-md text-sm">
                This is the average score across all assessment categories. It represents your overall practice health.
              </p>
            </div>
            
            {/* Scale explanation */}
            <div className="mt-6 text-sm text-gray-600">
              <div className="flex justify-between mb-2">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
                <span>6</span>
                <span>7</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                <div 
                  className={`${getColorForScore(overallScore)} h-4 rounded-full transition-all duration-300`} 
                  style={{ width: `${(overallScore / 7) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between">
                <span>Strongly Disagree</span>
                <span className="text-center">Neutral</span>
                <span>Strongly Agree</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scale Legend */}
        <div className="mt-4 mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium mb-2">Understanding Your Results</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center">
              <span className="w-4 h-4 inline-block bg-green-500 rounded-full mr-2"></span>
              <span><strong>5.5-7.0</strong>: Strong performance - Areas where your practice excels</span>
            </li>
            <li className="flex items-center">
              <span className="w-4 h-4 inline-block bg-yellow-500 rounded-full mr-2"></span>
              <span><strong>2.6-5.4</strong>: Moderate performance - Areas with room for improvement</span>
            </li>
            <li className="flex items-center">
              <span className="w-4 h-4 inline-block bg-red-500 rounded-full mr-2"></span>
              <span><strong>1.0-2.5</strong>: Needs attention - Areas requiring significant improvement</span>
            </li>
          </ul>
        </div>
        
        {/* Section Scores */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">Assessment Categories</h3>
          <div className="grid gap-4">
            {sectionScores.map((section) => (
              <div key={section.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <h4 className="font-medium">{section.name}</h4>
                    <div className="ml-2">
                      <InfoTooltip 
                        content={getCategoryById(section.id)?.description || ''} 
                        position="right"
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className={`mr-2 px-2 py-1 rounded-lg ${getTextColorForScore(section.score)} bg-opacity-20 ${section.color.replace('bg-', 'bg-opacity-20 bg-')} font-semibold`}>
                      {section.score.toFixed(1)}
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                  <div 
                    className={`${section.color} h-2.5 rounded-full`} 
                    style={{ width: `${(section.score / 7) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>1</span>
                  <span>7</span>
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