// src/components/survey/SurveyResultsView.tsx
import React from 'react';

// Define the props interface
interface SurveyResultsViewProps {
  surveyData: {
    responses: Record<string, string>;
  };
  surveyStructure: {
    sections: Array<{
      id: string;
      title: string;
      subsections: Array<{
        title: string;
        questions: Array<{
          id: string;
          text: string;
        }>;
      }>;
    }>;
  };
  setCurrentView: React.Dispatch<React.SetStateAction<string>>;
}

const SurveyResultsView: React.FC<SurveyResultsViewProps> = ({
  surveyData,
  surveyStructure,
  setCurrentView
}) => {
  // Calculate category scores
  const calculateCategoryScore = (sectionId: string): string => {
    const section = surveyStructure.sections.find(s => s.id === sectionId);
    if (!section) return '0';
    
    let totalScore = 0;
    let questionCount = 0;
    
    section.subsections.forEach(subsection => {
      subsection.questions.forEach(question => {
        if (surveyData.responses[question.id]) {
          totalScore += parseInt(surveyData.responses[question.id], 10);
          questionCount++;
        }
      });
    });
    
    return questionCount > 0 ? (totalScore / (questionCount * 5) * 100).toFixed(1) : '0';
  };

  // Get category scores
  const purposeScore = calculateCategoryScore('purpose');
  const wellbeingScore = calculateCategoryScore('wellbeing');
  const leadershipScore = calculateCategoryScore('leadership');
  
  // Calculate overall score
  const overallScore = (
    (parseFloat(purposeScore) + parseFloat(wellbeingScore) + parseFloat(leadershipScore)) / 3
  ).toFixed(1);

  // Helper function to get color class based on score
  const getScoreColorClass = (score: string | number) => {
    const scoreNum = typeof score === 'string' ? parseFloat(score || '0') : score;
    if (scoreNum >= 80) return 'bg-green-500';
    if (scoreNum >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
          Practice Culture Assessment Results
        </h2>
        
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Overall Culture Score</h3>
          <div className="flex items-center space-x-4">
            <div className={`text-white font-bold text-xl rounded-full h-16 w-16 flex items-center justify-center ${getScoreColorClass(overallScore)}`}>
              {overallScore}%
            </div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded-full">
                <div 
                  className={`h-4 rounded-full ${getScoreColorClass(overallScore)}`} 
                  style={{ width: `${overallScore}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">Sense of Purpose</h4>
            <div className={`text-white text-sm rounded-full px-2 py-1 inline-block mb-1 ${getScoreColorClass(purposeScore)}`}>
              {purposeScore}%
            </div>
            <div className="h-2 bg-gray-200 rounded-full mt-2">
              <div 
                className={`h-2 rounded-full ${getScoreColorClass(purposeScore)}`} 
                style={{ width: `${purposeScore}%` }}
              ></div>
            </div>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">Team Wellbeing</h4>
            <div className={`text-white text-sm rounded-full px-2 py-1 inline-block mb-1 ${getScoreColorClass(wellbeingScore)}`}>
              {wellbeingScore}%
            </div>
            <div className="h-2 bg-gray-200 rounded-full mt-2">
              <div 
                className={`h-2 rounded-full ${getScoreColorClass(wellbeingScore)}`} 
                style={{ width: `${wellbeingScore}%` }}
              ></div>
            </div>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">Practice Leadership</h4>
            <div className={`text-white text-sm rounded-full px-2 py-1 inline-block mb-1 ${getScoreColorClass(leadershipScore)}`}>
              {leadershipScore}%
            </div>
            <div className="h-2 bg-gray-200 rounded-full mt-2">
              <div 
                className={`h-2 rounded-full ${getScoreColorClass(leadershipScore)}`} 
                style={{ width: `${leadershipScore}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Insights and Recommendations</h3>
          
          {Number(purposeScore || '0') < 60 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800">Purpose Improvement Area</h4>
              <p className="text-sm text-red-700">
                Your team may benefit from initiatives that reinforce connection to purpose and professional fulfillment. 
                Consider implementing regular case success sharing or client appreciation practices.
              </p>
            </div>
          )}
          
          {Number(wellbeingScore || '0') < 60 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800">Wellbeing Improvement Area</h4>
              <p className="text-sm text-red-700">
                Team wellbeing scores indicate an opportunity for improvement. Consider reviewing scheduling practices, 
                implementing stress management resources, or evaluating communication pathways.
              </p>
            </div>
          )}
          
          {Number(leadershipScore || '0') < 60 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800">Leadership Improvement Area</h4>
              <p className="text-sm text-red-700">
                Leadership scores suggest opportunities for greater alignment. Review how practice values are communicated 
                and demonstrated, and consider implementing regular feedback mechanisms.
              </p>
            </div>
          )}
          
          {Number(overallScore || '0') >= 80 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800">Strength Area</h4>
              <p className="text-sm text-green-700">
                Your practice demonstrates strong cultural foundations. Continue building on these strengths while 
                monitoring for any emerging challenges as your practice evolves.
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-8 text-center">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default SurveyResultsView;