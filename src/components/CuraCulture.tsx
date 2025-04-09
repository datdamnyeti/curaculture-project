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
import AuthenticationView from '../components/auth/AuthenticationView';
import SurveyView from './survey/SurveyView';
import SurveyResultsView from './survey/SurveyResultsView';
import { useForm } from 'react-hook-form';
import { saveSurveyData, getSurveyData, saveUser, getUser, clearAllData, User as StorageUser } from '../utils/storage';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { UIProvider, useUI } from '../contexts/UIContext';
import LoadingOverlay from './ui/LoadingOverlay';
import ConfirmationDialog from './ui/ConfirmationDialog';

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
  
  // Survey Structure
  const surveyStructure = {
    sections: [
      {
        id: 'purpose',
        title: 'I. Sense of Purpose',
        subsections: [
          {
            title: 'Compassion Satisfaction',
            questions: [
              { id: 'cs_1', text: 'I find deep professional fulfillment in providing veterinary care' },
              { id: 'cs_2', text: 'My work makes a meaningful difference in patients\' lives' },
              { id: 'cs_3', text: 'I experience satisfaction when improving animal health outcomes' },
              { id: 'cs_4', text: 'The practice environment supports my ability to provide compassionate care' }
            ]
          },
          {
            title: 'Professional Identity',
            questions: [
              { id: 'pi_1', text: 'I am proud to be a member of the veterinary profession' },
              { id: 'pi_2', text: 'My role in animal healthcare aligns with my personal values' },
              { id: 'pi_3', text: 'I feel my work reflects my professional calling' },
              { id: 'pi_4', text: 'I have opportunities to make meaningful contributions in my practice' }
            ]
          }
        ]
      },
      {
        id: 'wellbeing',
        title: 'II. Team Wellbeing',
        subsections: [
          {
            title: 'Work-Life Balance',
            questions: [
              { id: 'wb_1', text: 'My practice supports a healthy work-life balance' },
              { id: 'wb_2', text: 'I can take time off when needed without guilt or excessive stress' },
              { id: 'wb_3', text: 'The scheduling approach at my practice is sustainable' },
              { id: 'wb_4', text: 'I feel able to separate my professional and personal life appropriately' }
            ]
          },
          {
            title: 'Psychological Safety',
            questions: [
              { id: 'ps_1', text: 'I feel comfortable expressing concerns within my workplace' },
              { id: 'ps_2', text: 'My colleagues are supportive when mistakes happen' },
              { id: 'ps_3', text: 'Different perspectives are valued within our practice culture' },
              { id: 'ps_4', text: 'Our practice encourages open communication about challenges' }
            ]
          }
        ]
      },
      {
        id: 'leadership',
        title: 'III. Practice Leadership',
        subsections: [
          {
            title: 'Vision and Values',
            questions: [
              { id: 'vv_1', text: 'Our practice has a clear mission that guides our work' },
              { id: 'vv_2', text: 'Leadership consistently demonstrates our stated values' },
              { id: 'vv_3', text: 'I understand how my role contributes to our practice goals' },
              { id: 'vv_4', text: 'Our practice values are reflected in day-to-day operations' }
            ]
          },
          {
            title: 'Supportive Leadership',
            questions: [
              { id: 'sl_1', text: 'Practice leadership is accessible when needed' },
              { id: 'sl_2', text: 'My professional development is supported by leadership' },
              { id: 'sl_3', text: 'Leadership provides constructive feedback in a supportive manner' },
              { id: 'sl_4', text: 'I feel valued by practice leadership' }
            ]
          }
        ]
      }
    ]
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
          <SurveyView 
            surveyData={surveyData}
            setSurveyData={setSurveyData}
            surveyStructure={surveyStructure}
            setCurrentView={setCurrentView}
          />
        )}
        
        {currentView === 'results' && isAuthenticated && (
          <SurveyResultsView 
            surveyData={surveyData} 
            surveyStructure={surveyStructure} 
            setCurrentView={setCurrentView} 
          />
        )}
      </div>
    </LoadingOverlay>
  );
};

export default CuraCultureApp;