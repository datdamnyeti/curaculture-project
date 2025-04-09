// src/utils/surveyCampaigns.ts
import { v4 as uuidv4 } from 'uuid';
import { generateSurveyToken, saveSurveyToken, markTokenSent } from './surveyTokens';
import { sendSurveyInvitation } from '../services/emailService';

// Types
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

export type CampaignData = Omit<SurveyCampaign, 'id' | 'clinicId' | 'createdAt' | 'status'>;

/**
 * Create a new survey campaign
 */
export const createSurveyCampaign = (
  clinicId: string,
  data: CampaignData
): SurveyCampaign => {
  const id = generateCampaignId();
  
  const campaign: SurveyCampaign = {
    id,
    clinicId,
    ...data,
    createdAt: new Date(),
    status: 'draft'
  };
  
  // Save to localStorage
  saveCampaign(campaign);
  
  return campaign;
};

/**
 * Generate a unique campaign ID
 */
const generateCampaignId = (): string => {
  return 'camp-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
};

/**
 * Save a campaign to localStorage
 */
const saveCampaign = (campaign: SurveyCampaign): void => {
  try {
    const campaigns = getCampaigns(campaign.clinicId);
    
    // Find existing campaign or add new one
    const existingIndex = campaigns.findIndex(c => c.id === campaign.id);
    
    if (existingIndex >= 0) {
      campaigns[existingIndex] = campaign;
    } else {
      campaigns.push(campaign);
    }
    
    // Save to localStorage
    localStorage.setItem(`curaCulture_campaigns_${campaign.clinicId}`, JSON.stringify(campaigns));
  } catch (error) {
    console.error('Error saving campaign:', error);
    throw new Error('Failed to save campaign');
  }
};

/**
 * Get all campaigns for a clinic
 */
export const getCampaigns = (clinicId: string): SurveyCampaign[] => {
  try {
    const campaignsJson = localStorage.getItem(`curaCulture_campaigns_${clinicId}`);
    if (!campaignsJson) return [];
    
    const campaigns: SurveyCampaign[] = JSON.parse(campaignsJson);
    
    // Ensure dates are properly parsed
    return campaigns.map(campaign => ({
      ...campaign,
      createdAt: new Date(campaign.createdAt),
      expiresAt: campaign.expiresAt ? new Date(campaign.expiresAt) : undefined
    }));
  } catch (error) {
    console.error('Error retrieving campaigns:', error);
    return [];
  }
};

/**
 * Get a specific campaign
 */
export const getCampaign = (campaignId: string, clinicId: string): SurveyCampaign | null => {
  const campaigns = getCampaigns(clinicId);
  return campaigns.find(c => c.id === campaignId) || null;
};

/**
 * Update a campaign
 */
export const updateCampaign = (
  campaignId: string,
  clinicId: string,
  updates: Partial<Omit<SurveyCampaign, 'id' | 'clinicId'>>
): SurveyCampaign | null => {
  const campaign = getCampaign(campaignId, clinicId);
  
  if (!campaign) {
    console.error(`Campaign not found: ${campaignId}`);
    return null;
  }
  
  const updatedCampaign = {
    ...campaign,
    ...updates
  };
  
  saveCampaign(updatedCampaign);
  
  return updatedCampaign;
};

/**
 * Delete a campaign
 */
export const deleteCampaign = (campaignId: string, clinicId: string): boolean => {
  try {
    const campaigns = getCampaigns(clinicId);
    const updatedCampaigns = campaigns.filter(c => c.id !== campaignId);
    
    // If no campaigns were removed, return false
    if (updatedCampaigns.length === campaigns.length) {
      return false;
    }
    
    localStorage.setItem(`curaCulture_campaigns_${clinicId}`, JSON.stringify(updatedCampaigns));
    return true;
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return false;
  }
};

/**
 * Send invitations for a campaign
 */
export const sendCampaignInvitations = async (
  campaignId: string,
  clinicId: string,
  emails: string[]
): Promise<{ success: boolean; sent: number; failed: number }> => {
  const campaign = getCampaign(campaignId, clinicId);
  
  if (!campaign) {
    console.error(`Campaign not found: ${campaignId}`);
    return { success: false, sent: 0, failed: emails.length };
  }
  
  let sent = 0;
  let failed = 0;
  
  // Process each email
  for (const email of emails) {
    try {
      // Generate a token for this invitation
      const token = generateSurveyToken();
      
      // Save the token with associated campaign and email
      saveSurveyToken(token, campaignId, email);
      
      // Create the survey link
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : 'http://localhost:3000';
      const surveyLink = `${baseUrl}/survey-page?token=${token}`;
      
      // Send the invitation email
      const success = await sendSurveyInvitation(
        email,
        surveyLink,
        campaign.emailSubject,
        campaign.emailBody
      );
      
      if (success) {
        // Mark the token as sent
        markTokenSent(token);
        sent++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`Error sending invitation to ${email}:`, error);
      failed++;
    }
  }
  
  // If any invitations were sent successfully, update campaign status to active
  if (sent > 0 && campaign.status === 'draft') {
    updateCampaign(campaignId, clinicId, { status: 'active' });
  }
  
  return { success: true, sent, failed };
};

/**
 * Initialize with sample campaigns for demo purposes
 */
export const initializeSampleCampaigns = (clinicId: string): void => {
  // Check if campaigns already exist
  const existingCampaigns = getCampaigns(clinicId);
  
  if (existingCampaigns.length > 0) {
    return;
  }
  
  // Default email template
  const defaultEmailTemplate = `
Dear Team Member,

You are invited to participate in our practice culture assessment. Your feedback is important to us and will help identify areas where we can improve.

The survey is anonymous and should take about 10-15 minutes to complete. Please click the link below to access the survey:

{{surveyLink}}

Thank you for your participation!

Best regards,
Practice Management Team
  `.trim();
  
  // Create sample campaigns
  const sampleCampaigns: CampaignData[] = [
    {
      name: 'Spring 2025 Culture Assessment',
      description: 'Annual culture assessment for all staff members',
      surveyType: 'culture',
      emailSubject: 'Please participate in our Culture Assessment',
      emailBody: defaultEmailTemplate
    },
    {
      name: 'Team Satisfaction Survey',
      description: 'Quarterly team satisfaction pulse check',
      surveyType: 'satisfaction',
      emailSubject: 'Your input matters: Team Satisfaction Survey',
      emailBody: defaultEmailTemplate
    }
  ];
  
  // Create each sample campaign
  sampleCampaigns.forEach(campaignData => {
    createSurveyCampaign(clinicId, campaignData);
  });
  
  console.log(`Initialized ${sampleCampaigns.length} sample campaigns for clinic ${clinicId}`);
};