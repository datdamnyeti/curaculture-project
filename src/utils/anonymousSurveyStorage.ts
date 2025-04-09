// src/utils/anonymousSurveyStorage.ts

/**
 * Anonymous Survey Response interface
 * Stores survey data without identifying individuals
 */
export interface AnonymousSurveyResponse {
  id: string;
  clinicId: string;
  campaignId?: string;  // Added for campaign linkage
  token?: string;       // Added for token linkage
  timestamp: Date;
  isComplete: boolean;
  // Demographic info without personally identifiable information
  demographics: {
    role?: string;         // e.g., "Veterinarian", "Technician"
    experienceYears?: number;
    teamSize?: number;
    // Other non-identifying attributes that might be useful for analysis
  };
  responses: Record<string, any>;
  progress?: number;
}

/**
 * Generate a unique ID for the survey
 */
const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * Save an anonymous survey response
 * @param surveyData Partial survey data
 * @param clinicId The clinic ID
 * @returns The generated survey ID
 */
export const saveAnonymousSurvey = async (
  surveyData: Partial<AnonymousSurveyResponse>,
  clinicId: string
): Promise<string> => {
  // Ensure clinicId is valid
  if (!clinicId || clinicId === 'default') {
    console.error('Invalid clinicId for saving survey:', clinicId);
    throw new Error('Invalid clinic ID');
  }
  
  const surveyId = surveyData.id || generateUniqueId();
  
  const anonymousSurvey: AnonymousSurveyResponse = {
    id: surveyId,
    clinicId,
    campaignId: surveyData.campaignId,
    token: surveyData.token,
    timestamp: new Date(),
    isComplete: !!surveyData.isComplete,
    demographics: surveyData.demographics || {},
    responses: surveyData.responses || {},
    progress: surveyData.progress || 0
  };
  
  try {
    const storedSurveys = getAnonymousSurveys(clinicId);
    
    // Update existing survey if ID exists, otherwise add new
    const existingIndex = storedSurveys.findIndex(s => s.id === surveyId);
    
    if (existingIndex >= 0) {
      storedSurveys[existingIndex] = {
        ...storedSurveys[existingIndex],
        ...anonymousSurvey,
        timestamp: new Date() // Update timestamp
      };
    } else {
      storedSurveys.push(anonymousSurvey);
    }
    
    localStorage.setItem(`clinic_${clinicId}_surveys`, JSON.stringify(storedSurveys));
    return surveyId;
  } catch (error) {
    console.error('Error saving anonymous survey:', error);
    throw new Error('Failed to save survey');
  }
};

/**
 * Save a token-based anonymous survey response
 * @param token The survey access token
 * @param surveyData Partial survey data
 * @param campaignId The campaign ID
 * @param clinicId The clinic ID
 * @returns The survey ID
 */
export const saveTokenSurvey = async (
  token: string,
  surveyData: Partial<AnonymousSurveyResponse>,
  campaignId: string,
  clinicId: string
): Promise<string> => {
  // Use the existing saveAnonymousSurvey function with token data
  return saveAnonymousSurvey(
    {
      ...surveyData,
      token,
      campaignId
    },
    clinicId
  );
};

/**
 * Save survey progress without marking it complete
 * @param surveyData Survey data with responses
 * @param clinicId The clinic ID
 * @param progress The progress percentage (0-100)
 * @returns The survey ID
 */
export const saveSurveyProgress = async (
  surveyData: Partial<AnonymousSurveyResponse>,
  clinicId: string,
  progress: number
): Promise<string> => {
  return saveAnonymousSurvey(
    {
      ...surveyData,
      isComplete: false,
      progress
    },
    clinicId
  );
};

/**
 * Get anonymous survey responses for a clinic
 * @param clinicId The clinic ID
 * @param filters Optional filters
 * @returns Array of anonymous survey responses
 */
export const getAnonymousSurveys = (
  clinicId: string,
  filters?: {
    isComplete?: boolean;
    role?: string;
    dateRange?: [Date, Date];
    campaignId?: string;
  }
): AnonymousSurveyResponse[] => {
  try {
    // Ensure clinicId is valid and not a generic default
    if (!clinicId || clinicId === 'default') {
      console.log('Invalid clinicId:', clinicId);
      return [];
    }
    
    const storageKey = `clinic_${clinicId}_surveys`;
    console.log('Looking for surveys with key:', storageKey);
    
    const surveysJson = localStorage.getItem(storageKey);
    if (!surveysJson) {
      console.log('No surveys found for clinic:', clinicId);
      return [];
    }
    
    let surveys: AnonymousSurveyResponse[] = JSON.parse(surveysJson);
    
    // Convert date strings to Date objects
    surveys = surveys.map(survey => ({
      ...survey,
      timestamp: new Date(survey.timestamp)
    }));
    
    // Verify surveys belong to this clinic
    surveys = surveys.filter(survey => survey.clinicId === clinicId);
    
    // Apply filters if provided
    if (filters) {
      if (filters.isComplete !== undefined) {
        surveys = surveys.filter(s => s.isComplete === filters.isComplete);
      }
      
      if (filters.role) {
        surveys = surveys.filter(s => s.demographics.role === filters.role);
      }
      
      if (filters.campaignId) {
        surveys = surveys.filter(s => s.campaignId === filters.campaignId);
      }
      
      if (filters.dateRange) {
        const [startDate, endDate] = filters.dateRange.map(d => new Date(d));
        surveys = surveys.filter(s => {
          const surveyDate = new Date(s.timestamp);
          return surveyDate >= startDate && surveyDate <= endDate;
        });
      }
    }
    
    return surveys;
  } catch (error) {
    console.error('Error retrieving anonymous surveys:', error);
    return [];
  }
};

/**
 * Get survey responses for a specific campaign
 * @param clinicId The clinic ID
 * @param campaignId The campaign ID
 * @returns Array of survey responses for the campaign
 */
export const getCampaignResponses = (
  clinicId: string,
  campaignId: string
): AnonymousSurveyResponse[] => {
  try {
    const surveys = getAnonymousSurveys(clinicId, { campaignId });
    return surveys;
  } catch (error) {
    console.error('Error retrieving campaign responses:', error);
    return [];
  }
};

/**
 * Get aggregated scores by survey section
 * @param clinicId The clinic ID
 * @param sectionIds Array of section IDs to calculate scores for
 * @param filters Optional filters
 * @returns Object with section IDs as keys and average scores as values
 */
export const getAggregatedSectionScores = (
  clinicId: string,
  sectionIds: string[],
  filters?: {
    role?: string;
    dateRange?: [Date, Date];
    campaignId?: string;
  }
): Record<string, number> => {
  const surveys = getAnonymousSurveys(clinicId, { ...filters, isComplete: true });
  
  // Early return if no surveys
  if (surveys.length === 0) {
    return sectionIds.reduce((acc, id) => ({ ...acc, [id]: 0 }), {});
  }
  
  // Calculate scores for each section
  const sectionScores = sectionIds.reduce((acc, sectionId) => {
    // Get all responses for questions in this section
    const sectionResponses = surveys.map(survey => {
      // Filter responses that belong to this section (questions starting with section ID)
      const sectionQuestions = Object.keys(survey.responses)
        .filter(key => key.startsWith(`${sectionId}_`) || 
                       key.includes(`${sectionId.toLowerCase()}_`));
      
      // Get average score for numeric responses in this section
      const numericResponses = sectionQuestions
        .map(key => survey.responses[key])
        .filter(value => typeof value === 'number');
      
      if (numericResponses.length === 0) return null;
      
      return numericResponses.reduce((sum, val) => sum + (val || 0), 0) / numericResponses.length;
    }).filter(Boolean);
    
    // Calculate section average
    const sectionAverage = sectionResponses.length > 0 
      ? (sectionResponses as number[]).reduce((sum, val) => sum + val, 0) / sectionResponses.length
      : 0;
    
    return { ...acc, [sectionId]: sectionAverage };
  }, {});
  
  return sectionScores;
};

/**
 * Get campaign aggregated scores by section
 * @param clinicId The clinic ID
 * @param campaignId The campaign ID
 * @param sectionIds Array of section IDs
 * @returns Object with section scores
 */
export const getCampaignSectionScores = (
  clinicId: string,
  campaignId: string,
  sectionIds: string[]
): Record<string, number> => {
  return getAggregatedSectionScores(clinicId, sectionIds, { campaignId });
};

/**
 * Get response distribution for a specific question
 * @param clinicId The clinic ID
 * @param questionId The question ID
 * @param campaignId Optional campaign ID to filter by
 * @returns Object with response values as keys and counts as values
 */
export const getResponseDistribution = (
  clinicId: string,
  questionId: string,
  campaignId?: string
): Record<string | number, number> => {
  const surveys = getAnonymousSurveys(clinicId, { 
    isComplete: true,
    campaignId
  });
  
  // Create distribution object
  const distribution = surveys.reduce((acc, survey) => {
    const response = survey.responses[questionId];
    if (response === undefined) return acc;
    
    const responseKey = response.toString();
    return {
      ...acc,
      [responseKey]: (acc[responseKey] || 0) + 1
    };
  }, {} as Record<string, number>);
  
  return distribution;
};

/**
 * Get a specific anonymous survey by ID
 * @param surveyId The survey ID
 * @param clinicId The clinic ID
 * @returns The survey response or null if not found
 */
export const getAnonymousSurveyById = (
  surveyId: string,
  clinicId: string
): AnonymousSurveyResponse | null => {
  const surveys = getAnonymousSurveys(clinicId);
  return surveys.find(s => s.id === surveyId) || null;
};

/**
 * Calculate strengths and improvement areas based on survey responses
 * @param clinicId The clinic ID
 * @param campaignId Optional campaign ID to filter by
 * @returns Object with strengths and improvement areas
 */
export const getStrengthsAndImprovementAreas = (
  clinicId: string,
  campaignId?: string
): { strengths: string[]; improvementAreas: string[] } => {
  const sectionIds = ['purpose', 'wellbeing', 'leadership'];
  const sectionScores = getAggregatedSectionScores(clinicId, sectionIds, { campaignId });
  
  // Sort sections by score
  const sortedSections = Object.entries(sectionScores)
    .sort((a, b) => b[1] - a[1]);
  
  // Top third are strengths, bottom third are improvement areas
  const numSections = sortedSections.length;
  const strengthsCount = Math.ceil(numSections / 3);
  
  // Map section IDs to human-readable names
  const sectionNames: Record<string, string> = {
    purpose: 'Sense of Purpose',
    wellbeing: 'Team Wellbeing',
    leadership: 'Practice Leadership'
  };
  
  const strengths = sortedSections
    .slice(0, strengthsCount)
    .map(([id, _]) => sectionNames[id] || id);
    
  const improvementAreas = sortedSections
    .slice(-strengthsCount)
    .map(([id, _]) => sectionNames[id] || id);
    
  return { strengths, improvementAreas };
};

/**
 * Get response rate for a campaign
 * @param clinicId The clinic ID
 * @param campaignId The campaign ID
 * @returns Response rate as a percentage
 */
export const getCampaignResponseRate = (
  clinicId: string,
  campaignId: string
): number => {
  // This would normally be calculated by comparing invitations sent vs responses received
  // For this implementation, we'll check tokens in the token store vs completed surveys
  
  // Get all tokens for this campaign
  const tokenStoreJson = localStorage.getItem('curaCulture_token_store');
  if (!tokenStoreJson) return 0;
  
  const tokenStore = JSON.parse(tokenStoreJson);
  const campaignInvitations = Object.values(tokenStore).filter(
    (inv: any) => inv.campaignId === campaignId
  );
  
  // Get completed surveys for this campaign
  const completedSurveys = getAnonymousSurveys(clinicId, {
    isComplete: true,
    campaignId
  });
  
  if (campaignInvitations.length === 0) return 0;
  
  return (completedSurveys.length / campaignInvitations.length) * 100;
};