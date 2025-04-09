// src/interfaces/dashboard-interfaces.ts
import { User } from '../utils/storage';

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  teamMembers: number;
  responseRate: number;
  activeCampaigns: number;
}

/**
 * Props for DashboardView component
 */
export interface DashboardViewProps {
  user: User | null;
  surveyData: SurveyData;
  onLogout: () => void;
  onStartSurvey: () => void;
  onViewResults: () => void;
}

/**
 * Dashboard survey data
 */
export interface SurveyData {
  currentSection: number;
  currentSubsection: number;
  responses: Record<string, string>;
  progress: number;
  isComplete: boolean;
}

/**
 * Campaign stats
 */
export interface CampaignStats {
  sent: number;
  completed: number;
  pending: number;
  clicked: number;
  responseRate: number;
}

/**
 * Props for CampaignManagement component
 */
export interface CampaignManagementProps {
  clinicId?: string;
}

/**
 * Campaign summary for dashboard display
 */
export interface CampaignSummary {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'completed' | 'expired';
  responseCount: number;
  responseRate: number;
  createdAt: Date;
  surveyType: 'culture' | 'satisfaction' | 'retention';
}

/**
 * Props for SurveyResultsDashboard component
 */
export interface SurveyResultsDashboardProps {
  clinicId?: string;
  campaignId?: string;
}

/**
 * Section score data
 */
export interface SectionScore {
  id: string;
  title: string;
  score: number;
  maxScore: number;
  percentage: number;
}

/**
 * Survey comparison data
 */
export interface SurveyComparison {
  sectionId: string;
  sectionName: string;
  clinicScore: number;
  industryAverage: number;
  difference: number;
}

/**
 * Strengths and areas for improvement
 */
export interface StrengthsAndImprovements {
  strengths: string[];
  improvementAreas: string[];
}