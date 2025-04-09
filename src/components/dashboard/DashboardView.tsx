// src/components/dashboard/DashboardView.tsx
import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { User, SurveyData } from '../../types';
import CampaignManagement from './CampaignManagement';
import { getAnonymousSurveys, getCampaignResponseRate } from '../../utils/anonymousSurveyStorage';

// Define the props for the dashboard
interface DashboardViewProps {
  user: User | null;          // Current user information
  surveyData: SurveyData;     // Survey state for controlling what buttons to show
  onLogout: () => void;       // Function to handle user logout
  onStartSurvey: () => void;  // Function to start a new survey
  onViewResults: () => void;  // Function to view existing results
}

const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  surveyData,
  onLogout,
  onStartSurvey,
  onViewResults
}) => {
  const [showCampaigns, setShowCampaigns] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    teamMembers: 0,
    responseRate: 0,
    activeCampaigns: 0
  });

  // Load dashboard stats
  useEffect(() => {
    if (user?.clinicId) {
      // Get all surveys
      const allSurveys = getAnonymousSurveys(user.clinicId, { isComplete: true });
      
      // Get campaigns from localStorage
      let campaigns: any[] = [];
      try {
        const campaignsJson = localStorage.getItem(`curaCulture_campaigns_${user.clinicId}`);
        if (campaignsJson) {
          campaigns = JSON.parse(campaignsJson);
        }
      } catch (error) {
        console.error('Error loading campaigns:', error);
      }
      
      // Calculate active campaigns
      const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
      
      // Calculate response rate (average of all campaign response rates)
      let responseRate = 0;
      if (campaigns.length > 0) {
        const campaignRates = campaigns.map(c => getCampaignResponseRate(user.clinicId || '', c.id));
        responseRate = campaignRates.reduce((sum, rate) => sum + rate, 0) / campaignRates.length;
      }
      
      // Calculate unique team members based on demographics
      const uniqueRoles = new Set(allSurveys.map(s => s.demographics.role)).size;
      const estimatedTeamSize = Math.max(
        20, // Default size if we can't estimate
        Math.round(allSurveys.reduce((sum, s) => sum + (s.demographics.teamSize || 0), 0) / Math.max(1, allSurveys.length))
      );
      
      setDashboardStats({
        teamMembers: estimatedTeamSize,
        responseRate: Math.round(responseRate),
        activeCampaigns: activeCampaigns
      });
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-blue-900">CuraCulture</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">{user?.email}</span>
              <button 
                onClick={onLogout} 
                className="text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Team Members Stat */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-gray-600">Team Members</p>
                <p className="text-2xl font-bold">{dashboardStats.teamMembers}</p>
              </div>
            </div>
          </div>

          {/* Response Rate Stat */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-gray-600">Response Rate</p>
                <p className="text-2xl font-bold">{dashboardStats.responseRate}%</p>
              </div>
            </div>
          </div>

          {/* Active Surveys Stat */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-gray-600">Active Campaigns</p>
                <p className="text-2xl font-bold">{dashboardStats.activeCampaigns}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          
          <div className="space-y-4">
            {/* Show results button only if survey is complete */}
            {surveyData.isComplete && (
              <button
                onClick={onViewResults}
                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 mb-4"
              >
                View Assessment Results
              </button>
            )}
            
            {/* Start/Continue Survey Button */}
            <button
              onClick={onStartSurvey}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {surveyData.isComplete ? 'Start New Assessment' : 'Continue Assessment'}
            </button>
          </div>
        </div>
        
        {/* Campaign Management Section */}
        <div className="space-y-2">
          <div 
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setShowCampaigns(!showCampaigns)}
          >
            <h2 className="text-lg font-semibold text-gray-900">Survey Campaigns</h2>
            <button className="p-1 rounded-full hover:bg-gray-200">
              {showCampaigns ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
          
          {showCampaigns && (
            <CampaignManagement />
          )}
        </div>
      </div>
    </div>
  );
};export default DashboardView;