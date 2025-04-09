// src/utils/surveyTokens.ts

/**
 * Utility functions for generating and validating survey tokens
 * These enable anonymous survey access through tokenized links
 */

// In a real application, this would use a database
// For this implementation, we'll use localStorage
const TOKEN_STORE_KEY = 'curaCulture_token_store';

// Token invitation interface
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

// Get token store from localStorage
const getTokenStore = (): Record<string, SurveyInvitation> => {
  if (typeof window === 'undefined') return {};
  
  try {
    const storedData = localStorage.getItem(TOKEN_STORE_KEY);
    return storedData ? JSON.parse(storedData) : {};
  } catch (error) {
    console.error('Error retrieving token store:', error);
    return {};
  }
};

// Save token store to localStorage
const saveTokenStore = (tokenStore: Record<string, SurveyInvitation>): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(TOKEN_STORE_KEY, JSON.stringify(tokenStore));
  } catch (error) {
    console.error('Error saving token store:', error);
  }
};

/**
 * Generate a unique token for survey access
 */
export const generateSurveyToken = (): string => {
  // Generate a UUID-like string for the token
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Save a token with its associated information
 */
export const saveSurveyToken = (
  token: string,
  campaignId: string,
  email: string
): SurveyInvitation => {
  // Generate ID for the invitation
  const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
  
  const tokenStore = getTokenStore();
  
  // Create invitation object
  const invitation: SurveyInvitation = {
    id,
    campaignId,
    email,
    token,
    status: 'pending',
    remindersSent: 0
  };
  
  // Save to store
  tokenStore[token] = invitation;
  saveTokenStore(tokenStore);
  
  return invitation;
};

/**
 * Validate a survey token
 */
export const validateSurveyToken = (
  token: string
): { valid: boolean; campaignId?: string; clinicId?: string } => {
  const tokenStore = getTokenStore();
  const invitation = tokenStore[token];
  
  if (!invitation) {
    return { valid: false };
  }
  
  // In a real implementation, you would fetch the campaign to get the clinicId
  // For now, we'll extract it from the campaignId since our campaigns include clinicId
  const campaigns = JSON.parse(localStorage.getItem('curaCulture_campaigns') || '{}');
  const campaign = Object.values(campaigns).find((c: any) => c.id === invitation.campaignId);
  
  // If the campaign doesn't exist, the token is invalid
  if (!campaign) {
    return { valid: false };
  }
  
  // Mark the token as clicked if it was pending or sent
  if (invitation.status === 'pending' || invitation.status === 'sent') {
    tokenStore[token].status = 'clicked';
    saveTokenStore(tokenStore);
  }
  
  return {
    valid: true,
    campaignId: invitation.campaignId,
    clinicId: (campaign as any).clinicId
  };
};

/**
 * Mark a token as completed
 */
export const markTokenCompleted = (token: string): void => {
  const tokenStore = getTokenStore();
  
  if (tokenStore[token]) {
    tokenStore[token].status = 'completed';
    tokenStore[token].completedAt = new Date();
    saveTokenStore(tokenStore);
  }
};

/**
 * Update token status when sending invitations
 */
export const markTokenSent = (token: string): void => {
  const tokenStore = getTokenStore();
  
  if (tokenStore[token]) {
    tokenStore[token].status = 'sent';
    tokenStore[token].sentAt = new Date();
    saveTokenStore(tokenStore);
  }
};

/**
 * Get completion statistics for a campaign
 */
export const getCampaignStats = (
  campaignId: string
): { sent: number; completed: number; pending: number; clicked: number } => {
  const tokenStore = getTokenStore();
  const invitations = Object.values(tokenStore).filter(
    inv => inv.campaignId === campaignId
  );
  
  return {
    sent: invitations.filter(inv => ['sent', 'clicked', 'completed'].includes(inv.status)).length,
    completed: invitations.filter(inv => inv.status === 'completed').length,
    pending: invitations.filter(inv => inv.status === 'pending').length,
    clicked: invitations.filter(inv => inv.status === 'clicked').length
  };
};

/**
 * Get all invitations for a campaign
 */
export const getCampaignInvitations = (
  campaignId: string
): SurveyInvitation[] => {
  const tokenStore = getTokenStore();
  return Object.values(tokenStore).filter(
    inv => inv.campaignId === campaignId
  );
};