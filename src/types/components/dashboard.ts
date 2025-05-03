// src/types/components/dashboard.ts
import { User } from '../models/user';
import { SurveyType } from '../models/campaign';

export interface DashboardViewProps {
  user: User | null;
  surveyData: {
    currentSection: number;
    currentSubsection: number;
    responses: Record<string, string>;
    progress: number;
    isComplete: boolean;
  };
  onLogout: () => void;
  onStartSurvey: () => void;
  onViewResults: () => void;
}

export interface DashboardStats {
  teamMembers: number;
  responseRate: number;
  activeCampaigns: number;
}

export interface CampaignFormProps {
  onSubmit: (campaignData: {
    name: string;
    description: string;
    surveyType: SurveyType;
    emailSubject: string;
    emailBody: string;
  }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export interface CampaignManagementProps {
  clinicId?: string;
}

export interface SurveyResultsDashboardProps {
  clinicId?: string;
  campaignId?: string;
}

export interface SectionScore {
  id: string;
  name: string;
  score: number;
  color: string;
}