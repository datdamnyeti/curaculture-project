// src/components/CuraCulture.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { getSurveyData, saveSurveyData } from '../utils/storage';
import { ViewType } from '../utils/navigation';

// Import view components
import LandingView from './landing/LandingView';
import AuthenticationView from './auth/AuthenticationView';
import DashboardView from './dashboard/DashboardView';
import SurveyRouter from './survey/SurveyRouter';
import SurveyResultsDashboard from './dashboard/SurveyResultsDashboard';
import AppNavigation from './ui/AppNavigation';

const CuraCulture: React.FC = () => {
  // Get authentication context
  const { user, isAuthenticated, logout } = useAuth();
  
  // Get UI context for showing notifications
  const { showSuccessToast } = useUI();
  
  // State for current view and login/register toggle
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [isLogin, setIsLogin] = useState(true);
  
  // Survey data state
  const [surveyData, setSurveyData] = useState({
    currentSection: 0,
    currentSubsection: 0,
    responses: {},
    progress: 0,
    isComplete: false
  });
  
  // Effect to load survey data for authenticated user
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const savedSurvey = getSurveyData(user.id);
      if (savedSurvey) {
        setSurveyData(savedSurvey);
      }
    }
  }, [isAuthenticated, user]);
  
  // Effect to redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated && (currentView === 'landing' || currentView === 'auth')) {
      setCurrentView('dashboard');
    }
  }, [isAuthenticated, currentView]);
  
  // Navigation handlers
  const navigateToAuth = (isLoginMode: boolean) => {
    setIsLogin(isLoginMode);
    setCurrentView('auth');
  };
  
  const navigateToDashboard = () => {
    if (isAuthenticated) {
      setCurrentView('dashboard');
    } else {
      navigateToAuth(true);
    }
  };
  
  // FIXED: Clear survey data when starting a new survey
  const navigateToSurvey = () => {
    console.log('Starting new survey - clearing previous data');
    
    // Reset survey data to empty state
    const emptySurveyData = {
      currentSection: 0,
      currentSubsection: 0,
      responses: {}, // CRITICAL: Empty responses object
      progress: 0,
      isComplete: false
    };
    
    setSurveyData(emptySurveyData);
    
    // Also clear from persistent storage to prevent reload issues
    if (isAuthenticated && user?.id) {
      saveSurveyData(emptySurveyData, user.id);
    }
    
    // Navigate to survey view
    setCurrentView('survey');
  };
  
  const navigateToResults = () => {
    setCurrentView('results');
  };
  
  const handleLogout = () => {
    logout();
    // FIXED: Also clear survey data on logout
    setSurveyData({
      currentSection: 0,
      currentSubsection: 0,
      responses: {},
      progress: 0,
      isComplete: false
    });
    setCurrentView('landing');
    showSuccessToast('You have been logged out successfully');
  };
  
  // Render the appropriate view
  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return (
          <LandingView 
            onStartAssessment={() => isAuthenticated ? navigateToSurvey() : navigateToAuth(false)}
            onSignIn={() => navigateToAuth(true)}
          />
        );
        
      case 'auth':
        return (
          <AuthenticationView 
            isLogin={isLogin}
            setIsLogin={setIsLogin}
            setCurrentView={setCurrentView}
          />
        );
        
      case 'dashboard':
        return (
          <div className="min-h-screen bg-gray-50">
            <AppNavigation
              user={user}
              currentPage="Dashboard"
              onNavigateDashboard={() => {}} // Current page
              onNavigateResults={navigateToResults}
              onLogout={handleLogout}
            />
            <div className="max-w-7xl mx-auto p-6">
              <DashboardView 
                user={user}
                surveyData={surveyData}
                onLogout={handleLogout}
                onStartSurvey={navigateToSurvey} // This will now clear data first
                onViewResults={navigateToResults}
              />
            </div>
          </div>
        );
        
      case 'survey':
        console.log('Rendering survey with initial values:', surveyData.responses);
        return (
          <SurveyRouter 
            surveyType="retention"
            onComplete={(formValues) => {
              console.log('Survey completed with values:', formValues);
              
              // Save the organized responses (already organized in RetentionSurveyForm)
              const completedSurveyData = {
                currentSection: 0,
                currentSubsection: 0,
                responses: formValues, // Already organized in RetentionSurveyForm
                isComplete: true,
                progress: 100
              };
              
              setSurveyData(completedSurveyData);
              
              // Save the data to persistent storage if user is authenticated
              if (isAuthenticated && user?.id) {
                saveSurveyData(completedSurveyData, user.id);
              }
              
              // Redirect to dashboard immediately
              navigateToDashboard();
            }}
            initialValues={surveyData.responses} // Now this will be empty {} for new surveys
            isAnonymous={false}
          />
        );
        
      case 'results':
        return (
          <SurveyResultsDashboard 
            clinicId={user?.clinicId}
            onNavigateDashboard={navigateToDashboard}
            onLogout={handleLogout}
          />
        );
        
      default:
        return <div>Invalid view</div>;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {renderView()}
    </div>
  );
};

export default CuraCulture;