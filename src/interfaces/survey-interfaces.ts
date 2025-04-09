// src/interfaces/survey-interfaces.ts

/**
 * Survey question option (for dropdown, multiple choice, checkbox group, etc.)
 */
export interface SurveyQuestionOption {
    id: string;
    label: string;
    value: string | number;
  }
  
  /**
   * Survey question type (determines input type)
   */
  export type QuestionType = 
    | 'likert'      // Likert scale (1-5, 1-7, etc.)
    | 'text'        // Short text response
    | 'textarea'    // Long text response
    | 'multipleChoice' // Single selection from options
    | 'checkboxGroup' // Multiple selection from options
    | 'numeric'     // Numeric input
    | 'dropdown';   // Dropdown selection
  
  /**
   * Survey question definition
   */
  export interface SurveyQuestion {
    id: string;
    text: string;
    type: QuestionType;
    required: boolean;
    options?: SurveyQuestionOption[];
    minValue?: number;
    maxValue?: number;
    minWords?: number;
    maxWords?: number;
    description?: string;
  }
  
  /**
   * Survey section containing a group of questions
   */
  export interface SurveySection {
    id: string;
    title: string;
    description?: string;
    questions: SurveyQuestion[];
  }
  
  /**
   * Complete survey structure
   */
  export interface SurveyData {
    id: string;
    title: string;
    description?: string;
    sections: SurveySection[];
  }
  
  /**
   * Props for the CulturalSurveyForm component
   */
  export interface CulturalSurveyFormProps {
    onComplete?: (formValues: FormValues) => void;
    initialValues?: FormValues;
    isAnonymous?: boolean;
    demographicFields?: SurveyQuestion[];
    campaignId?: string;
    token?: string;
  }
  
  /**
   * Form values from survey responses
   */
  export interface FormValues {
    [key: string]: any;
  }
  
  /**
   * Anonymous survey response
   */
  export interface AnonymousSurveyResponse {
    id: string;
    clinicId: string;
    campaignId?: string;
    token?: string;
    timestamp: Date;
    isComplete: boolean;
    demographics: {
      role?: string;
      experienceYears?: number;
      teamSize?: number;
      [key: string]: any;
    };
    responses: FormValues;
    progress?: number;
  }
  
  /**
   * Props for SurveyQuestion component
   */
  export interface QuestionProps {
    id: string;
    type: QuestionType;
    text: string;
    required: boolean;
    options?: SurveyQuestionOption[];
    minValue?: number;
    maxValue?: number;
    minWords?: number;
    maxWords?: number;
    value: any;
    onChange: (id: string, value: any) => void;
    onBlur: (id: string) => void;
    error?: string;
    disabled?: boolean;
  }
  
  /**
   * Props for SurveyCompletionNotification component
   */
  export interface SurveyCompletionNotificationProps {
    onViewResults?: () => void;
    onStartNewSurvey?: () => void;
    onReturnToDashboard?: () => void;
    clinicName?: string;
    isAnonymous?: boolean;
  }
  
  /**
   * Props for SurveyProgress component
   */
  export interface SurveyProgressProps {
    currentSection: number;
    totalSections: number;
    sectionTitle: string;
    progress: number;
  }
  
  /**
   * Props for SurveyNavigation component
   */
  export interface SurveyNavigationProps {
    currentSection: number;
    totalSections: number;
    isFirstSection: boolean;
    isLastSection: boolean;
    isSubmitting: boolean;
    isSectionValid: boolean;
    onPrevious: () => void;
    onNext: () => void;
    onSave?: () => void;
    showSaveButton?: boolean;
  }
  
  /**
   * Props for QuestionFeedback component
   */
  export interface QuestionFeedbackProps {
    error?: string;
    isValid: boolean;
    isTouched: boolean;
    helperText?: string;
    wordCount?: number;
    minWords?: number;
    maxWords?: number;
  }