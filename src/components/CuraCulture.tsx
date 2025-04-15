"use client";

// Define interfaces
interface User {
  email: string;
  firstName?: string;
  lastName?: string;
  clinicName?: string;
}

interface AuthFormType {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  clinicName: string;
  role: string;
}

interface SurveyResponses {
  [key: string]: string;
}

// Imports
import React, { useState, useEffect } from 'react';
import { ChevronRight, Users, TrendingUp, Shield, LineChart, Mail, Lock, Building, Eye, Briefcase, Heart, Brain } from 'lucide-react';
import DashboardView from './dashboard/DashboardView';
import LandingView from './landing/LandingView';
import AuthenticationView from './auth/AuthenticationView';
import SurveyResultsView from './survey/SurveyResultsView';
import { useForm } from 'react-hook-form';
import { saveSurveyData, getSurveyData, saveUser, getUser, clearAllData, User as StorageUser } from '../utils/storage';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { UIProvider, useUI } from '../contexts/UIContext';
import LoadingOverlay from './ui/LoadingOverlay';
import ConfirmationDialog from './ui/ConfirmationDialog';
import SurveyRouter from './survey/SurveyRouter';
import { RetentionSurveyStructure } from '../data/retentionSurveyStructure';

// Main app wrapper with auth provider and UI provider
const CuraCultureApp: React.FC = () => {
  return (
    <UIProvider>
      <AuthProvider>
        <CuraCultureContent />
      </AuthProvider>
    </UIProvider>
  );
};

// Main component content
const CuraCultureContent: React.FC = () => {
  // Get auth context
  const { user, isAuthenticated, logout, loading } = useAuth();
  // Get UI context
  const { showSuccessToast, showErrorToast, confirm } = useUI();
  
  // Application State
  const [currentView, setCurrentView] = useState('landing');
  const [isLogin, setIsLogin] = useState(true);
  const [surveyData, setSurveyData] = useState({
    currentSection: 0,
    currentSubsection: 0,
    responses: {} as SurveyResponses,
    progress: 0,
    isComplete: false
  });

  // Effect to redirect to dashboard if authenticated
  useEffect(() => {
    if (isAuthenticated && currentView === 'landing') {
      setCurrentView('dashboard');
      showSuccessToast('Welcome to CuraCulture!');
    }
  }, [isAuthenticated, currentView, showSuccessToast]);
  
  // Effect to redirect to landing if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !loading && ['dashboard', 'survey', 'results'].includes(currentView)) {
      setCurrentView('landing');
    }
  }, [isAuthenticated, loading, currentView]);
  
  // Effect to load survey data when user logs in
  useEffect(() => {
    if (user && user.email) {
      try {
        const savedSurveyData = getSurveyData(user.email);
        if (savedSurveyData) {
          setSurveyData(savedSurveyData);
          if (savedSurveyData.isComplete) {
            showSuccessToast('Your survey data has been loaded');
          }
        }
      } catch (error) {
        showErrorToast('Failed to load your survey data');
        console.error('Error loading survey data:', error);
      }
    }
  }, [user, showSuccessToast, showErrorToast]);
  
  // Effect to save survey data when it changes
  useEffect(() => {
    if (user && user.email) {
      try {
        saveSurveyData(surveyData, user.email);
      } catch (error) {
        showErrorToast('Failed to save your survey progress');
        console.error('Error saving survey data:', error);
      }
    }
  }, [surveyData, user, showErrorToast]);
  
  // Handle survey completion
  const handleSurveyComplete = (formValues: Record<string, any>) => {
    setSurveyData({
      ...surveyData,
      responses: formValues,
      isComplete: true,
      progress: 100
    });
    showSuccessToast('Survey completed successfully!');
    setCurrentView('dashboard');
  };
  
  // Logout handler with confirmation
  const handleLogout = async () => {
    const confirmed = await confirm({
      title: 'Confirm Logout',
      message: 'Are you sure you want to log out? Your progress is saved, but you will need to log in again to continue.',
      type: 'warning',
      confirmText: 'Logout',
      cancelText: 'Cancel'
    });

    if (confirmed) {
      logout();
      setCurrentView('landing');
      showSuccessToast('You have been logged out successfully');
    }
  };
  
  // Start a new survey with confirmation
  const handleStartNewSurvey = async () => {
    if (surveyData.progress > 0 && !surveyData.isComplete) {
      const confirmed = await confirm({
        title: 'Start New Survey',
        message: 'You have an incomplete survey. Starting a new one will reset your progress. Do you want to continue?',
        type: 'warning',
        confirmText: 'Start New',
        cancelText: 'Cancel'
      });

      if (!confirmed) return;
    }

    setSurveyData({
      currentSection: 0,
      currentSubsection: 0,
      responses: {},
      progress: 0,
      isComplete: false
    });
    setCurrentView('survey');
    showSuccessToast('New survey started');
  };
  
  // View survey results with feedback
  const handleViewResults = () => {
    if (!surveyData.isComplete) {
      showErrorToast('Please complete the survey first to view results');
      return;
    }
    
    setCurrentView('results');
  };
  
  // Create a simple adapter for survey results until we can update SurveyResultsView
  const adaptRetentionStructureForResults = () => {
    return {
      sections: RetentionSurveyStructure.sections.map(section => ({
        id: section.id,
        title: section.title,
        subsections: [{
          title: section.description || section.title,
          questions: section.questions.map(q => ({
            id: q.id,
            text: q.text
          }))
        }]
      }))
    };
  };
  
  return (
    <LoadingOverlay isLoading={loading} text="Loading CuraCulture...">
      <div className="min-h-screen bg-gray-50">
        {currentView === 'landing' && (
          <LandingView
            onStartAssessment={() => {
              setCurrentView('auth');
              setIsLogin(false);
            }}
            onSignIn={() => {
              setCurrentView('auth');
              setIsLogin(true);
            }}
          />
        )}
        
        {currentView === 'auth' && (
          <AuthenticationView
            isLogin={isLogin}
            setIsLogin={setIsLogin}
            setCurrentView={setCurrentView}
          />
        )}
        
        {currentView === 'dashboard' && isAuthenticated && (
          <DashboardView
            user={user}
            surveyData={surveyData}
            onLogout={handleLogout}
            onStartSurvey={handleStartNewSurvey}
            onViewResults={handleViewResults}
          />
        )}
        
        {currentView === 'survey' && isAuthenticated && (
          <SurveyRouter 
            surveyType='retention'
            onComplete={handleSurveyComplete}
            initialValues={surveyData.responses}
            isAnonymous={false}
          />
        )}
        
        {currentView === 'results' && isAuthenticated && (
          <SurveyResultsView 
            surveyData={surveyData} 
            surveyStructure={adaptRetentionStructureForResults()}
            setCurrentView={setCurrentView} 
          />
        )}
      </div>
    </LoadingOverlay>
  );
};

export default CuraCultureApp;