// src/components/survey/RetentionSurveyForm.tsx
import React, { useState, useEffect } from 'react';
import { RetentionSurveyStructure } from '../../data/retentionSurveyStructure';
import SurveyQuestion, { QuestionType } from './SurveyQuestion';
import { 
  validateForm, 
  ValidationErrors, 
  ValidationRules 
} from '../../utils/validation';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';

// Import UI components
import SurveyProgress from './SurveyProgress';
import QuestionFeedback from './QuestionFeedback';
import SurveyNavigation from './SurveyNavigation';
import SurveyCompletionNotification from './SurveyCompletionNotification';
import { 
  saveAnonymousSurvey, 
  saveSurveyProgress,
  AnonymousSurveyResponse
} from '../../utils/anonymousSurveyStorage';
import { getQuestionValidationRules } from './SurveyQuestion';

// Define types for survey sections and questions
interface SurveyQuestion {
  id: string;
  text: string;
  type: QuestionType;
  required: boolean;
  options?: Array<{id: string; label: string; value: string | number}>;
  minValue?: number;
  maxValue?: number;
  minWords?: number;
  maxWords?: number;
  description?: string;
}

// Define a type for questions with originalSectionId
interface ExtendedSurveyQuestion extends SurveyQuestion {
  originalSectionId?: string;
}

interface SurveySection {
  id: string;
  title: string;
  description?: string;
  questions: SurveyQuestion[];
}

interface SurveyData {
  id: string;
  title: string;
  description?: string;
  sections: SurveySection[];
}

interface RetentionSurveyFormProps {
  onComplete?: (formValues: Record<string, any>) => void;
  initialValues?: Record<string, any>;
  isAnonymous?: boolean;
  demographicFields?: SurveyQuestion[];
  campaignId?: string;
  token?: string;
  hideCategories?: boolean; // Not used anymore, keeping for backward compatibility
}

// Utility functions for survey validation and progress tracking
const calculateSurveyProgress = (
  formValues: Record<string, any>,
  surveyData: SurveyData
): number => {
  const totalQuestions = countAllQuestions(surveyData);
  const answeredQuestions = countAnsweredQuestions(formValues);
  return (answeredQuestions / totalQuestions) * 100;
};

const countAllQuestions = (surveyData: SurveyData): number => {
  if (!surveyData || !surveyData.sections) return 0;
  
  return surveyData.sections.reduce((total: number, section: SurveySection) => {
    return total + section.questions.length;
  }, 0);
};

const countAnsweredQuestions = (formValues: Record<string, any>): number => {
  return Object.keys(formValues).filter(key => {
    // Check if it has a valid value
    const value = formValues[key];
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== undefined && value !== null && value !== '';
  }).length;
};

const validateSection = (
  section: SurveySection,
  formValues: Record<string, any>,
  validationRules: ValidationRules
): ValidationErrors => {
  // Get question IDs from current section
  const questionIds: string[] = section.questions.map(q => q.id);
  
  // Create section validation rules
  const sectionRules: ValidationRules = {};
  questionIds.forEach(id => {
    if (validationRules[id]) {
      sectionRules[id] = validationRules[id];
    }
  });
  
  // Extract section data from form values
  const sectionData: Record<string, any> = {};
  questionIds.forEach(id => {
    sectionData[id] = formValues[id];
  });
  
  // Return validation errors for this section
  return validateForm(sectionData, sectionRules);
};

const isSectionComplete = (
  section: SurveySection,
  formValues: Record<string, any>,
  validationErrors: ValidationErrors
): boolean => {
  // Check if all required fields have values
  const allRequiredFieldsHaveValues = section.questions
    .filter(q => q.required)
    .every(q => {
      const value = formValues[q.id];
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== undefined && value !== null && value !== '';
    });
  
  // Check if section has no validation errors
  const questionIds = section.questions.map(q => q.id);
  const hasNoErrors = questionIds.every(id => !validationErrors[id] || validationErrors[id].length === 0);
  
  return allRequiredFieldsHaveValues && hasNoErrors;
};

// FIXED: Function to flatten and preserve category mapping in question IDs
const flattenAndPreserveCategoryQuestions = (surveyData: SurveyData, shouldShuffle: boolean = true): SurveyData => {
  // First, create a flat array of all questions, but maintain their category ID in the question metadata
  const allQuestions: ExtendedSurveyQuestion[] = [];
  
  // Skip the demographics section when flattening
  const demographicsSection = surveyData.sections.find(s => s.id === 'demographics');
  const nonDemographicSections = surveyData.sections.filter(s => s.id !== 'demographics');
  
  // Get all questions except demographics, preserving section ID in the question properties
  nonDemographicSections.forEach(section => {
    section.questions.forEach(question => {
      // FIXED: Store the original section ID in the question metadata
      // This is the key fix - we preserve the ORIGINAL section ID, not the flattened one
      allQuestions.push({
        ...question,
        originalSectionId: section.id // This keeps 'fair_compensation', 'team_relationships', etc.
      });
    });
  });
  
  // Only shuffle if shouldShuffle is true
  let finalQuestions = [...allQuestions];
  if (shouldShuffle) {
    finalQuestions = finalQuestions.sort(() => Math.random() - 0.5);
  }
  
  // Create a new survey structure with demographics first, then all randomized questions
  const newSurveyData: SurveyData = {
    ...surveyData,
    sections: [
      // Keep demographics section if it exists
      ...(demographicsSection ? [demographicsSection] : []),
      // Add a single section with all randomized questions, but NO category title
      {
        id: 'all_questions', // Generic section ID for UI purposes only
        title: 'Assessment Questions', // Generic section title
        description: 'Please answer the following questions about your workplace experience.',
        questions: finalQuestions // Questions still have their originalSectionId preserved
      }
    ]
  };
  
  return newSurveyData;
};

const RetentionSurveyForm: React.FC<RetentionSurveyFormProps> = ({
  onComplete,
  initialValues = {},
  isAnonymous = false,
  demographicFields = [],
  campaignId,
  token
}) => {
  // Get UI context for toast notifications and confirm dialogs
  const uiContext = useUI ? useUI() : {
    showSuccessToast: (msg: string) => console.log('Success:', msg),
    showErrorToast: (msg: string) => console.error('Error:', msg)
  };
  const { showSuccessToast, showErrorToast } = uiContext;
  
  // Get auth context for user information
  const { user } = useAuth ? useAuth() : { user: null };
  
  // State variables for form handling
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>(initialValues);
  const [formErrors, setFormErrors] = useState<ValidationErrors>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [isSectionValid, setIsSectionValid] = useState(false);
  const [currentSurveyId, setCurrentSurveyId] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Prepare survey data based on props
  const [surveyData, setSurveyData] = useState<SurveyData>(RetentionSurveyStructure as unknown as SurveyData);
  
  // Update survey data - flatten and randomize questions while preserving category info
  useEffect(() => {
    let tempSurvey = {...surveyData};
    
    // Add demographic fields if provided
    if (demographicFields && demographicFields.length > 0) {
      const customDemographicsSection: SurveySection = {
        id: 'demographics',
        title: 'About You',
        description: 'Please provide some non-identifying information to help us categorize responses',
        questions: demographicFields.map((field) => ({
          ...field,
          id: field.id || `demo_${field.text.toLowerCase().replace(/\s+/g, '_')}`
        }))
      };
      
      tempSurvey = {
        ...tempSurvey,
        sections: [
          customDemographicsSection,
          ...tempSurvey.sections.filter(section => section.id !== 'demographics')
        ]
      };
    }
    
    // Only shuffle on initial load, not on subsequent renders
    tempSurvey = flattenAndPreserveCategoryQuestions(tempSurvey, isInitialLoad);
    
    // Set that we're no longer on initial load
    if (isInitialLoad) {
      setIsInitialLoad(false);
    }
    
    setSurveyData(tempSurvey);
  }, [demographicFields, surveyData, isInitialLoad]);
  
  // Create validation rules based on survey questions
  const buildValidationRules = (): ValidationRules => {
    const rules: ValidationRules = {};
    
    surveyData.sections.forEach((section: SurveySection) => {
      section.questions.forEach((question: SurveyQuestion) => {
        rules[question.id] = getQuestionValidationRules(question);
      });
    });
    
    return rules;
  };
  
  // Get current section
  const currentSection = surveyData.sections[currentSectionIndex];
  
  // Calculate survey progress
  const progress = calculateSurveyProgress(formValues, surveyData);
  
  // FIXED: Organize responses with proper section prefixes for dashboard compatibility
  const organizeResponses = (): Record<string, any> => {
    const organizedResponses: Record<string, any> = {};
    
    Object.keys(formValues).forEach(questionId => {
      // Find the question in our flattened survey data
      const allQuestions = surveyData.sections
        .flatMap(section => section.questions as ExtendedSurveyQuestion[]);
        
      const question = allQuestions.find(q => q.id === questionId);
      
      if (question && 'originalSectionId' in question && question.originalSectionId) {
        // FIXED: Use the preserved original section ID to create proper category prefixes
        // This creates keys like: "fair_compensation_compensation_1" (which is what the dashboard expects)
        organizedResponses[`${question.originalSectionId}_${questionId}`] = formValues[questionId];
        
        // DEBUG: Log the key creation for verification
        console.log(`Creating key: ${question.originalSectionId}_${questionId} = ${formValues[questionId]}`);
      } else {
        // For demographics or questions without category, use as-is
        organizedResponses[questionId] = formValues[questionId];
      }
    });
    
    console.log('Final organized responses:', organizedResponses);
    return organizedResponses;
  };
  
  // Validate the current section continuously
  useEffect(() => {
    if (!currentSection) return;
    
    const validateCurrentSectionEffect = () => {
      // Get question IDs from current section
      const questionIds: string[] = currentSection.questions.map(q => q.id);
      const rules = buildValidationRules();
      
      // Create section rules
      const sectionRules: ValidationRules = {};
      questionIds.forEach(id => {
        if (rules[id]) {
          sectionRules[id] = rules[id];
        }
      });
      
      // Validate section data
      const sectionData: Record<string, any> = {};
      questionIds.forEach(id => {
        sectionData[id] = formValues[id];
      });
      
      // Manual validation implementation
      const sectionErrors: ValidationErrors = {};
      Object.keys(sectionRules).forEach(field => {
        const fieldRules = sectionRules[field];
        const value = sectionData[field];
        const fieldErrors: string[] = [];
        
        fieldRules.forEach(rule => {
          if (!rule.validate(value, sectionData)) {
            fieldErrors.push(rule.message);
          }
        });
        
        if (fieldErrors.length > 0) {
          sectionErrors[field] = fieldErrors;
        }
      });
      
      // Check if all required fields have values and there are no errors
      const allRequiredFieldsHaveValues = currentSection.questions
        .filter(q => q.required)
        .every(q => {
          const value = formValues[q.id];
          if (Array.isArray(value)) {
            return value.length > 0;
          }
          return value !== undefined && value !== null && value !== '';
        });
      
      const hasNoErrors = questionIds.every(id => !sectionErrors[id] || sectionErrors[id].length === 0);
      
      // Update section validation state
      setIsSectionValid(allRequiredFieldsHaveValues && hasNoErrors);
    };
    
    validateCurrentSectionEffect();
  }, [formValues, currentSectionIndex, currentSection]);
  
  // Custom handlers for form inputs
  const handleQuestionChange = (questionId: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // If field has been touched, validate it
    if (touchedFields[questionId]) {
      validateField(questionId, value);
    }
  };
  
  // Handle field touched state
  const handleQuestionBlur = (questionId: string) => {
    setTouchedFields(prev => ({
      ...prev,
      [questionId]: true
    }));
    
    validateField(questionId, formValues[questionId]);
  };
  
  // Validate a single field
  const validateField = (questionId: string, value: any) => {
    const rules = buildValidationRules();
    
    if (!rules[questionId]) return;
    
    let fieldErrors: string[] = [];
    
    // Apply each validation rule
    rules[questionId].forEach(rule => {
      if (!rule.validate(value, formValues)) {
        fieldErrors.push(rule.message);
      }
    });
    
    setFormErrors(prev => ({
      ...prev,
      [questionId]: fieldErrors
    }));
  };
  
  // Get error message for a field
  const getErrorMessage = (questionId: string): string | undefined => {
    if (touchedFields[questionId] && formErrors[questionId]?.length > 0) {
      return formErrors[questionId][0];
    }
    return undefined;
  };
  
  // Count words for text inputs
  const countWords = (text: string): number => {
    return text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  };
  
  // Validate the current section
  const validateCurrentSection = (): boolean => {
    if (!currentSection) return false;
    
    // Get question IDs from current section
    const questionIds: string[] = currentSection.questions.map(q => q.id);
    const rules = buildValidationRules();
    
    // Create section rules
    const sectionRules: ValidationRules = {};
    questionIds.forEach(id => {
      if (rules[id]) {
        sectionRules[id] = rules[id];
      }
    });
    
    // Validate section data
    const sectionData: Record<string, any> = {};
    questionIds.forEach(id => {
      sectionData[id] = formValues[id];
    });
    
    // Manual validation implementation
    const sectionErrors: ValidationErrors = {};
    Object.keys(sectionRules).forEach(field => {
      const fieldRules = sectionRules[field];
      const value = sectionData[field];
      const fieldErrors: string[] = [];
      
      fieldRules.forEach(rule => {
        if (!rule.validate(value, sectionData)) {
          fieldErrors.push(rule.message);
        }
      });
      
      if (fieldErrors.length > 0) {
        sectionErrors[field] = fieldErrors;
      }
    });
    
    // Update touched state and errors
    const newTouched = { ...touchedFields };
    questionIds.forEach(id => {
      newTouched[id] = true;
    });
    setTouchedFields(newTouched);
    
    // Merge new errors with existing ones
    setFormErrors(prev => ({
      ...prev,
      ...sectionErrors
    }));
    
    // Check if there are any errors in the current section
    return questionIds.every(id => !sectionErrors[id] || sectionErrors[id].length === 0);
  };
  
  // Validate all form fields
  const validateAll = (): boolean => {
    const rules = buildValidationRules();
    
    // Manual validation implementation
    const allErrors: ValidationErrors = {};
    Object.keys(rules).forEach(field => {
      const fieldRules = rules[field];
      const value = formValues[field];
      const fieldErrors: string[] = [];
      
      fieldRules.forEach(rule => {
        if (!rule.validate(value, formValues)) {
          fieldErrors.push(rule.message);
        }
      });
      
      if (fieldErrors.length > 0) {
        allErrors[field] = fieldErrors;
      }
    });
    
    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    surveyData.sections.forEach(section => {
      section.questions.forEach(question => {
        allTouched[question.id] = true;
      });
    });
    
    setTouchedFields(allTouched);
    setFormErrors(allErrors);
    
    // Check if there are any errors
    return Object.keys(allErrors).length === 0;
  };
  
  // Extract demographic data from form values
  const extractDemographicData = () => {
    // Get demographic fields from form values
    const demographicData: Record<string, any> = {};
    
    // Find all demographic questions
    const demographicSection = surveyData.sections.find(s => s.id === 'demographics');
    
    if (demographicSection) {
      demographicSection.questions.forEach(question => {
        if (formValues[question.id] !== undefined) {
          // Map specific fields to standard demographic fields
          if (question.id === 'role' || question.id.includes('role')) {
            demographicData.role = formValues[question.id];
          } else if (question.id === 'experience_years' || question.id.includes('experience')) {
            demographicData.experienceYears = Number(formValues[question.id]);
          } else if (question.id === 'team_size' || question.id.includes('team_size')) {
            demographicData.teamSize = Number(formValues[question.id]);
          } else {
            // Store other demographic fields
            demographicData[question.id] = formValues[question.id];
          }
        }
      });
    }
    
    return demographicData;
  };
  
  // Handle saving survey progress
  const handleSaveProgress = async () => {
    setIsSaving(true);
    
    try {
      // Extract demographic data from form values
      const demographicData = extractDemographicData();
      
      // Calculate current progress
      const currentProgress = progress;
      
      // Get the appropriate clinic ID
      const clinicId = user?.clinicId || 'default';
      
      // Use the helper function to organize responses
      const organizedResponses = organizeResponses();
      
      // Create survey data object
      const surveyDataObj: Partial<AnonymousSurveyResponse> = {
        id: currentSurveyId || undefined, // Use existing ID if available
        isComplete: false,
        demographics: demographicData,
        responses: organizedResponses,
        progress: currentProgress,
        campaignId: campaignId, // Include if provided
        token: token // Include if provided
      };
      
      // Save progress
      const surveyId = typeof saveSurveyProgress === 'function' 
        ? await saveSurveyProgress(surveyDataObj, clinicId, currentProgress)
        : 'mock-survey-id';
      
      // Update current survey ID if it's new
      if (!currentSurveyId) {
        setCurrentSurveyId(surveyId);
      }
      
      setLastSavedAt(new Date());
      showSuccessToast('Your progress has been saved');
    } catch (error) {
      console.error('Error saving progress:', error);
      showErrorToast('Failed to save your progress. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Navigate to the next section
  const handleNextSection = () => {
    // Validate current section before proceeding
    const isSectionValid = validateCurrentSection();
    
    if (!isSectionValid) {
      showErrorToast('Please complete all required questions before proceeding.');
      return;
    }
    
    if (currentSectionIndex < surveyData.sections.length - 1) {
      // Go to next section
      setCurrentSectionIndex(currentSectionIndex + 1);
      window.scrollTo(0, 0);
      handleSaveProgress();
    } else {
      // This is the last section, submit the form
      handleSubmit();
    }
  };
  
  // Navigate to the previous section
  const handlePreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
      window.scrollTo(0, 0);
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    // Validate all fields
    const isFormValid = validateAll();
    if (!isFormValid) {
      // Find the first section with an error
      let sectionWithError = 0;
      
      for (let i = 0; i < surveyData.sections.length; i++) {
        const section = surveyData.sections[i];
        const questionIds = section.questions.map(q => q.id);
        
        // Check if any question in this section has an error
        const hasError = questionIds.some(id => {
          return formErrors[id] && formErrors[id].length > 0;
        });
        
        if (hasError) {
          sectionWithError = i;
          break;
        }
      }
      
      // Navigate to the section with the error
      setCurrentSectionIndex(sectionWithError);
      showErrorToast('Please complete all required questions before submitting.');
      return;
    }
    
    // Form is valid, proceed with submission
    setIsSubmitting(true);
    
    try {
      // Extract demographic data from form values
      const demographicData = extractDemographicData();
      
      // Get the appropriate clinic ID
      const clinicId = user?.clinicId || 'default';
      
      // Use the helper function to organize responses
      const organizedResponses = organizeResponses();
      
      // Create survey data object with properly categorized responses
      const surveyDataObj: Partial<AnonymousSurveyResponse> = {
        id: currentSurveyId || undefined,
        isComplete: true,
        demographics: demographicData,
        responses: organizedResponses,
        progress: 100,
        campaignId: campaignId,
        token: token
      };
      
      // Save the completed survey
      if (typeof saveAnonymousSurvey === 'function') {
        await saveAnonymousSurvey(surveyDataObj, clinicId);
      } else {
        console.log('Mock saving survey:', surveyDataObj);
      }
      
      console.log('Survey submitted successfully:', organizedResponses);
      
      // Show completion state
      setIsComplete(true);
      setIsSubmitting(false);
      showSuccessToast('Survey completed successfully!');
      
      // Call the onComplete callback if provided
      if (onComplete) {
        onComplete(organizedResponses); // Pass organized responses to onComplete
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
      setIsSubmitting(false);
      showErrorToast('There was an error submitting your survey. Please try again.');
    }
  };
  
  // Get the clinic name for the completion notification
  const clinicName = user?.clinicName;
  
  // Render the completion screen
  if (isComplete) {
    return (
      <SurveyCompletionNotification
        onViewResults={() => {
          // Use the onComplete callback with properly organized data
          if (onComplete) {
            onComplete(organizeResponses());
          }
        }}
        onStartNewSurvey={() => {
          // Reset the form and start over
          setFormValues({});
          setFormErrors({});
          setTouchedFields({});
          setCurrentSectionIndex(0);
          setIsComplete(false);
          setLastSavedAt(null);
        }}
        onReturnToDashboard={() => {
          // Use the onComplete callback with properly organized data
          if (onComplete) {
            onComplete(organizeResponses());
          }
        }}
        clinicName={clinicName}
        isAnonymous={isAnonymous}
      />
    );
  }
  
  // Make sure we have a current section before rendering
  if (!currentSection) {
    return <div className="text-center p-6">Loading survey...</div>;
  }
  
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-2 text-center">Veterinary Practice Assessment</h2>
      <p className="text-gray-600 mb-6 text-center">
        This assessment helps identify key factors affecting workplace quality and staff retention in your veterinary practice.
      </p>
      
      {/* Survey Progress component */}
      <SurveyProgress
        currentSection={currentSectionIndex}
        totalSections={surveyData.sections.length}
        sectionTitle={currentSection.title}
        progress={progress}
      />
      
      {/* Current section */}
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-2">{currentSection.title}</h3>
        {currentSection.description && (
          <p className="text-gray-600 mb-6">{currentSection.description}</p>
        )}
        
        {/* Last saved notification */}
        {lastSavedAt && (
          <div className="text-sm text-gray-500 mb-4 flex items-center">
            <span>Last saved: {lastSavedAt.toLocaleTimeString()}</span>
          </div>
        )}
        
        {/* Questions */}
        <div className="space-y-6 mt-6">
          {currentSection.questions.map((question) => (
            <div key={question.id} className="border-b pb-6">
              <SurveyQuestion
                id={question.id}
                type={question.type}
                text={question.text}
                required={question.required}
                options={question.options || []}
                minValue={question.minValue}
                maxValue={question.maxValue}
                minWords={question.minWords}
                maxWords={question.maxWords}
                value={formValues[question.id]}
                onChange={handleQuestionChange}
                onBlur={handleQuestionBlur}
                error={getErrorMessage(question.id)}
                disabled={isSubmitting}
              />
              
              {/* Add the QuestionFeedback component */}
              <QuestionFeedback
                error={getErrorMessage(question.id)}
                isValid={!formErrors[question.id] || formErrors[question.id].length === 0}
                isTouched={!!touchedFields[question.id]}
                helperText={question.description}
                wordCount={
                  (question.type === 'text' || question.type === 'textarea') && formValues[question.id]
                    ? countWords(formValues[question.id])
                    : undefined
                }
                minWords={question.minWords}
                maxWords={question.maxWords}
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Survey Navigation component */}
      <SurveyNavigation
        currentSection={currentSectionIndex}
        totalSections={surveyData.sections.length}
        isFirstSection={currentSectionIndex === 0}
        isLastSection={currentSectionIndex === surveyData.sections.length - 1}
        isSubmitting={isSubmitting || isSaving}
        isSectionValid={isSectionValid}
        onPrevious={handlePreviousSection}
        onNext={handleNextSection}
        onSave={handleSaveProgress}
        showSaveButton={!isAnonymous} // Only show save button for logged-in users
      />
    </div>
  );
};

export default RetentionSurveyForm;