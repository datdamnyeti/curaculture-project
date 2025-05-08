// src/components/CuraCulture.tsx
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
  
  const navigateToSurvey = () => {
    setCurrentView('survey');
  };
  
  const navigateToResults = () => {
    setCurrentView('results');
  };
  
  const handleLogout = () => {
    logout();
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
          <DashboardView 
            user={user}
            surveyData={surveyData}
            onLogout={handleLogout}
            onStartSurvey={navigateToSurvey}
            onViewResults={navigateToResults}
          />
        );
        
      case 'survey':
        return (
          <SurveyRouter 
            surveyType="retention"
            onComplete={(formValues) => {
              setSurveyData(prev => ({
                ...prev,
                responses: formValues,
                isComplete: true,
                progress: 100
              }));
              
              // Redirect to dashboard after completion
              setTimeout(() => {
                navigateToDashboard();
              }, 2000);
            }}
            initialValues={surveyData.responses}
            isAnonymous={false}
          />
        );
        
      case 'results':
        return (
          <SurveyResultsDashboard clinicId={user?.clinicId} />
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