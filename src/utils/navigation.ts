export type ViewType = 'landing' | 'auth' | 'dashboard' | 'survey' | 'results';

// Interface for navigation state management
export interface NavigationState {
  currentView: ViewType;
  isLogin: boolean;
}

// Navigation action types
export interface NavigationActions {
  navigateToAuth: (isLogin: boolean) => void;
  navigateToDashboard: () => void;
  navigateToLanding: () => void;
  navigateToSurvey: () => void;
  navigateToResults: () => void;
}

// Helper function to validate view transitions
export function isValidViewTransition(from: ViewType, to: ViewType, isAuthenticated: boolean): boolean {
  // Protected routes require authentication
  const protectedViews: ViewType[] = ['dashboard', 'survey', 'results'];
  
  if (protectedViews.includes(to) && !isAuthenticated) {
    return false;
  }
  
  // Add any other navigation rules here
  return true;
}