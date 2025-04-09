// src/components/survey/SurveyView.tsx
import React from 'react';
import { useForm } from 'react-hook-form';

// Define interfaces for props and survey data
interface SurveyViewProps {
  surveyData: {
    currentSection: number;
    currentSubsection: number;
    responses: Record<string, string>;
    progress: number;
    isComplete: boolean;
  };
  setSurveyData: React.Dispatch<React.SetStateAction<{
    currentSection: number;
    currentSubsection: number;
    responses: Record<string, string>;
    progress: number;
    isComplete: boolean;
  }>>;
  surveyStructure: any; // You might want to create a more specific type for this
  setCurrentView: React.Dispatch<React.SetStateAction<string>>;
}

const SurveyView: React.FC<SurveyViewProps> = ({ 
  surveyData, 
  setSurveyData, 
  surveyStructure,
  setCurrentView 
}) => {
  // Access the current section and subsection from the survey structure
  const currentSection = surveyStructure.sections[surveyData.currentSection];
  const currentSubsection = currentSection?.subsections[surveyData.currentSubsection];

  // Form setup for the survey questions
  const { register, handleSubmit, formState: { errors } } = useForm();

  // Handle advancing to the next subsection or section
  const handleNext = (data: Record<string, string>) => {
    // Store responses
    const newResponses = { 
      ...surveyData.responses,
      ...data 
    };

    // Calculate overall progress
    const totalQuestions = surveyStructure.sections.reduce(
      (total: number, section: any) => total + section.subsections.reduce(
        (subtotal: number, subsection: any) => subtotal + subsection.questions.length, 0
      ), 0
    );
    
    const answeredQuestions = Object.keys(newResponses).length;
    const newProgress = (answeredQuestions / totalQuestions) * 100;

    // Check if we need to move to the next subsection or section
    let newSubsection = surveyData.currentSubsection;
    let newSection = surveyData.currentSection;
    let complete = false;

    if (surveyData.currentSubsection < currentSection.subsections.length - 1) {
      // Move to next subsection within current section
      newSubsection++;
    } else if (surveyData.currentSection < surveyStructure.sections.length - 1) {
      // Move to first subsection of next section
      newSection++;
      newSubsection = 0;
    } else {
      // Survey complete
      complete = true;
    }

    // Update survey state
    setSurveyData({
      currentSection: newSection,
      currentSubsection: newSubsection,
      responses: newResponses,
      progress: newProgress,
      isComplete: complete
    });
  };

  // Handle going back to the previous subsection or section
  const handleBack = () => {
    let newSubsection = surveyData.currentSubsection;
    let newSection = surveyData.currentSection;

    if (surveyData.currentSubsection > 0) {
      // Move to previous subsection within current section
      newSubsection--;
    } else if (surveyData.currentSection > 0) {
      // Move to last subsection of previous section
      newSection--;
      newSubsection = surveyStructure.sections[newSection].subsections.length - 1;
    }

    setSurveyData({
      ...surveyData,
      currentSection: newSection,
      currentSubsection: newSubsection
    });
  };

  // If survey is complete, show summary
  if (surveyData.isComplete) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="bg-green-100 mx-auto rounded-full p-4 w-20 h-20 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Survey Complete</h2>
          <p className="text-gray-600 mb-6">
            Thank you for completing the CuraCulture assessment. Your responses have been recorded.
          </p>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Progress bar */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Survey Progress</span>
            <span>{Math.round(surveyData.progress)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-blue-600 rounded-full transition-all"
              style={{ width: `${surveyData.progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Current section and subsection headers */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">
          {currentSection?.title}
        </h2>
        <h3 className="text-lg font-medium text-gray-700 mb-4">
          {currentSubsection?.title}
        </h3>

        {/* Questions form */}
        <form onSubmit={handleSubmit(handleNext)} className="space-y-6">
          {currentSubsection?.questions.map((question: any) => (
            <div key={question.id} className="border-b pb-4">
              <p className="mb-2 text-gray-800">{question.text}</p>
              <div className="grid grid-cols-5 gap-4 text-sm text-center">
                <div>Strongly Disagree</div>
                <div>Disagree</div>
                <div>Neutral</div>
                <div>Agree</div>
                <div>Strongly Agree</div>
                
                <div className="col-span-5 grid grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label key={value} className="flex flex-col items-center">
                      <input
                        type="radio"
                        {...register(question.id, { required: true })}
                        value={value}
                        defaultChecked={surveyData.responses[question.id] === value.toString()}
                        className="h-4 w-4"
                      />
                    </label>
                  ))}
                </div>
              </div>
              {errors[question.id] && (
                <p className="text-red-500 text-xs mt-1">This question requires a response</p>
              )}
            </div>
          ))}

          {/* Navigation buttons */}
          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={handleBack}
              disabled={surveyData.currentSection === 0 && surveyData.currentSubsection === 0}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {(surveyData.currentSection === surveyStructure.sections.length - 1 && 
                surveyData.currentSubsection === currentSection.subsections.length - 1) 
                ? 'Complete' : 'Next'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SurveyView;