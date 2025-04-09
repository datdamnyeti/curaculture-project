// src/utils/storage.ts

// Define the shape of our survey data for type safety
export interface SurveyData {
    currentSection: number;
    currentSubsection: number;
    responses: Record<string, string>;
    progress: number;
    isComplete: boolean;
  }
  
  // Keys for our storage
  const SURVEY_DATA_KEY = 'curaCulture_surveyData';
  const USER_KEY = 'curaCulture_user';
  
  /**
   * Save survey data to localStorage
   */
  export const saveSurveyData = (surveyData: SurveyData, userId: string): void => {
    try {
      // We'll store survey data by user ID, allowing for multiple users
      const allSurveyData = getSavedSurveys();
      allSurveyData[userId] = surveyData;
      
      localStorage.setItem(SURVEY_DATA_KEY, JSON.stringify(allSurveyData));
      console.log('Survey data saved successfully');
    } catch (error) {
      console.error('Error saving survey data:', error);
    }
  };
  
  /**
   * Retrieve saved survey data for a specific user
   */
  export const getSurveyData = (userId: string): SurveyData | null => {
    try {
      const allSurveyData = getSavedSurveys();
      return allSurveyData[userId] || null;
    } catch (error) {
      console.error('Error retrieving survey data:', error);
      return null;
    }
  };
  
  /**
   * Get all saved surveys
   */
  export const getSavedSurveys = (): Record<string, SurveyData> => {
    try {
      const savedData = localStorage.getItem(SURVEY_DATA_KEY);
      return savedData ? JSON.parse(savedData) : {};
    } catch (error) {
      console.error('Error parsing saved surveys:', error);
      return {};
    }
  };
  
  /**
   * Save user data
   */
 // Update in src/utils/storage.ts
// Add this to your existing User interface

export interface User {
  email: string;
  firstName?: string;
  lastName?: string;
  clinicName?: string;
  clinicId?: string; // Add this property
  id?: string; // Include this for consistency
}
  
  export const saveUser = (user: User): void => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      console.log('User data saved successfully');
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };
  
  /**
   * Load user data
   */
  export const getUser = (): User | null => {
    try {
      const userData = localStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return null;
    }
  };
  
  /**
   * Clear all saved data (for logout)
   */
  export const clearAllData = (): void => {
    try {
      localStorage.removeItem(USER_KEY);
      console.log('User data cleared successfully');
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  };