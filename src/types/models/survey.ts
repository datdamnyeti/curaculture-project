import { 
  QuestionType, 
  QuestionOption, 
  SurveyQuestion 
} from '../models/survey';

export interface QuestionProps {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  options?: QuestionOption[];
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

export interface SurveyProgressProps {
  currentSection: number;
  totalSections: number;
  sectionTitle: string;
  progress: number;
}

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

export interface SurveyCompletionNotificationProps {
  onViewResults?: () => void;
  onStartNewSurvey?: () => void;
  onReturnToDashboard?: () => void;
  clinicName?: string;
  isAnonymous?: boolean;
}

export interface QuestionFeedbackProps {
  error?: string;
  isValid: boolean;
  isTouched: boolean;
  helperText?: string;
  wordCount?: number;
  minWords?: number;
  maxWords?: number;
}