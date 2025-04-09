// src/interfaces/campaign-interfaces.ts

/**
 * Survey campaign
 */
export interface SurveyCampaign {
    id: string;
    clinicId: string;
    name: string;
    description?: string;
    createdAt: Date;
    expiresAt?: Date;
    status: 'draft' | 'active' | 'completed' | 'expired';
    surveyType: 'culture' | 'satisfaction' | 'retention';
    emailSubject: string;
    emailBody: string;
  }
  
  /**
   * Campaign data (for creation/updates, without id/clinicId/timestamp fields)
   */
  export type CampaignData = Omit<SurveyCampaign, 'id' | 'clinicId' | 'createdAt' | 'status'>;
  
  /**
   * Survey invitation
   */
  export interface SurveyInvitation {
    id: string;
    campaignId: string;
    email: string;
    token: string;
    sentAt?: Date;
    completedAt?: Date;
    status: 'pending' | 'sent' | 'clicked' | 'completed' | 'bounced';
    remindersSent: number;
  }
  
  /**
   * Campaign invitation result
   */
  export interface CampaignInvitationResult {
    success: boolean;
    sent: number;
    failed: number;
  }
  
  /**
   * Token validation result
   */
  export interface TokenValidationResult {
    valid: boolean;
    campaignId?: string;
    clinicId?: string;
  }
  
  /**
   * Campaign statistics
   */
  export interface CampaignStatistics {
    sent: number;
    completed: number;
    pending: number;
    clicked: number;
    responseRate: number;
  }
  
  /**
   * Response distribution by question
   */
  export interface ResponseDistribution {
    [value: string]: number;
  }
  
  /**
   * Campaign results
   */
  export interface CampaignResults {
    campaignId: string;
    campaignName: string;
    responses: number;
    responseRate: number;
    averageScores: Record<string, number>;
    demographics: {
      roles: Record<string, number>;
      experienceYears: Record<string, number>;
      teamSize: number;
    };
    strengths: string[];
    improvementAreas: string[];
  }
  
  /**
   * Section comparison
   */
  export interface SectionComparison {
    clinicScore: number;
    industryAverage: number;
  }