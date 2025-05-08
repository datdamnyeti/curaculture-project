// src/components/dashboard/CampaignManagement.tsx
import React, { useState, useEffect } from 'react';
import { Mail, PieChart, Trash } from 'lucide-react';
import CampaignForm from './CampaignForm';

// Define types for our component
interface SurveyCampaign {
  id: string;
  name: string;
  description?: string;
  surveyType: string;
  status: 'draft' | 'active' | 'completed' | 'expired';
  createdAt: Date;
  emailSubject: string;
  emailBody: string;
}

interface CampaignStats {
  sent: number;
  completed: number;
  pending: number;
  clicked: number;
}

interface CampaignManagementProps {
  clinicId?: string;
}

// Mock functions to simulate the functionality
// In a real app, these would interact with your actual storage
const createSurveyCampaign = (clinicId: string, data: Omit<SurveyCampaign, 'id' | 'status' | 'createdAt'>) => {
  const newCampaign: SurveyCampaign = {
    id: `campaign-${Date.now()}`,
    status: 'draft',
    createdAt: new Date(),
    ...data
  };
  
  // In a real app, save to storage here
  console.log('Creating campaign:', newCampaign);
  return newCampaign;
};

const getCampaigns = (clinicId: string): SurveyCampaign[] => {
  // In a real app, fetch from storage
  return []; // Return empty array for now
};

const deleteCampaign = (campaignId: string, clinicId: string): boolean => {
  // In a real app, delete from storage
  console.log('Deleting campaign:', campaignId);
  return true;
};

const getCampaignStats = (campaignId: string): CampaignStats => {
  // In a real app, calculate real stats
  return {
    sent: 0,
    completed: 0,
    pending: 0,
    clicked: 0
  };
};

const sendCampaignInvitations = async (campaignId: string, clinicId: string, emails: string[]) => {
  // In a real app, send actual emails
  console.log('Sending invitations for campaign', campaignId, 'to emails:', emails);
  return { success: true, sent: emails.length, failed: 0 };
};

const CampaignManagement: React.FC<CampaignManagementProps> = ({ clinicId = 'default' }) => {
  // State variables
  const [campaigns, setCampaigns] = useState<SurveyCampaign[]>([]);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState<string | null>(null);
  const [inviteEmails, setInviteEmails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Mock UI context functions
  const showSuccessToast = (message: string) => {
    console.log('Success:', message);
  };

  const showErrorToast = (message: string) => {
    console.error('Error:', message);
  };

  const confirm = async (options: { 
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
  }) => {
    return window.confirm(`${options.title}\n${options.message}`);
  };
  
  // Load campaigns on component mount
  useEffect(() => {
    const loadCampaigns = async () => {
      setIsLoading(true);
      try {
        // Load campaigns from storage
        const campaignsData = getCampaigns(clinicId);
        setCampaigns(campaignsData);
      } catch (error) {
        console.error('Error loading campaigns:', error);
        showErrorToast('Failed to load campaigns');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCampaigns();
  }, [clinicId]);
  
  // Create a new campaign
  const handleCreateCampaign = async (formData: {
    name: string;
    description: string;
    surveyType: string;
    emailSubject: string;
    emailBody: string;
  }) => {
    setIsSubmitting(true);
    
    try {
      // Create the campaign
      const campaign = createSurveyCampaign(clinicId, {
        name: formData.name.trim(),
        description: formData.description.trim() || '',
        surveyType: 'retention', // Always set to retention
        emailSubject: formData.emailSubject.trim(),
        emailBody: formData.emailBody.trim()
      });
      
      // Update state with the new campaign
      setCampaigns(prevCampaigns => [...prevCampaigns, campaign]);
      
      // Close the form
      setShowNewCampaign(false);
      
      showSuccessToast('Campaign created successfully');
    } catch (error) {
      console.error('Error creating campaign:', error);
      showErrorToast('Failed to create campaign');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Delete a campaign
  const handleDeleteCampaign = async (campaignId: string) => {
    const confirmDelete = await confirm({
      title: 'Delete Campaign',
      message: 'Are you sure you want to delete this campaign? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    
    if (!confirmDelete) return;
    
    try {
      // Delete the campaign
      const success = deleteCampaign(campaignId, clinicId);
      
      if (success) {
        // Update state by removing the deleted campaign
        setCampaigns(prevCampaigns => prevCampaigns.filter(c => c.id !== campaignId));
        showSuccessToast('Campaign deleted successfully');
      } else {
        showErrorToast('Campaign not found');
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
      showErrorToast('Failed to delete campaign');
    }
  };
  
  // Send invitations for a campaign
  const handleSendInvitations = async (campaignId: string) => {
    const emails = inviteEmails
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);
    
    if (emails.length === 0) {
      showErrorToast('Please enter at least one email address');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await sendCampaignInvitations(campaignId, clinicId, emails);
      
      if (result.success) {
        showSuccessToast(`Sent ${result.sent} invitations successfully!`);
        
        // Reset the invite form
        setShowInviteForm(null);
        setInviteEmails('');
        
        // Refresh campaigns list to reflect status changes
        setCampaigns(getCampaigns(clinicId));
      } else {
        showErrorToast(`Failed to send invitations. Please try again.`);
      }
    } catch (error) {
      console.error('Error sending invitations:', error);
      showErrorToast('An error occurred while sending invitations.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Survey Campaigns</h2>
        <button
          onClick={() => setShowNewCampaign(!showNewCampaign)}
          className={`px-4 py-2 ${showNewCampaign ? 'bg-gray-500' : 'bg-blue-600'} text-white rounded-lg ${showNewCampaign ? 'hover:bg-gray-600' : 'hover:bg-blue-700'} flex items-center`}
        >
          {showNewCampaign ? 'Cancel' : 'New Campaign'}
        </button>
      </div>
      
      {/* New Campaign Form */}
      {showNewCampaign && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <h3 className="text-md font-medium mb-4">Create New Retention Assessment Campaign</h3>
          <CampaignForm 
            onSubmit={handleCreateCampaign}
            onCancel={() => setShowNewCampaign(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em]"></div>
          <p className="mt-2 text-gray-600">Loading campaigns...</p>
        </div>
      )}
      
      {/* Empty State */}
      {!isLoading && campaigns.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="mb-4">
            <Mail className="h-12 w-12 text-gray-400 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No campaigns yet</h3>
          <p className="text-gray-500 mb-4">Create your first retention assessment campaign to get started</p>
          <button
            onClick={() => setShowNewCampaign(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Campaign
          </button>
        </div>
      )}
      
      {/* Campaign List */}
      {!isLoading && campaigns.length > 0 && (
        <div className="space-y-4">
          {campaigns.map((campaign) => {
            const stats = getCampaignStats(campaign.id);
            const responseRate = stats.sent > 0 
              ? Math.round((stats.completed / stats.sent) * 100) 
              : 0;
            
            return (
              <div key={campaign.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-lg">{campaign.name}</h3>
                    {campaign.description && (
                      <p className="text-sm text-gray-600 mt-1">{campaign.description}</p>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowInviteForm(campaign.id === showInviteForm ? null : campaign.id)}
                      className="px-3 py-1 text-sm border border-blue-500 text-blue-500 rounded hover:bg-blue-50 flex items-center"
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      Send
                    </button>
                    <button
                      className="px-3 py-1 text-sm border border-green-500 text-green-500 rounded hover:bg-green-50 flex items-center"
                    >
                      <PieChart className="h-3 w-3 mr-1" />
                      Results
                    </button>
                    <button
                      onClick={() => handleDeleteCampaign(campaign.id)}
                      className="p-1 text-red-500 rounded hover:bg-red-50"
                      title="Delete campaign"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4 mb-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="px-2 py-1 rounded bg-blue-100 text-blue-800 mr-2 text-xs">
                      RETENTION
                    </div>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <div className={`px-2 py-1 rounded text-xs mr-2 ${
                      campaign.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                      campaign.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {campaign.status.toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-1" />
                    <span>{stats.sent} sent</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <span>{stats.completed} responses</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <span>Response rate: {responseRate}%</span>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  Created: {campaign.createdAt.toLocaleDateString()}
                </div>
                
                {/* Invite Form */}
                {showInviteForm === campaign.id && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Send Invitations</h4>
                    <textarea
                      value={inviteEmails}
                      onChange={(e) => setInviteEmails(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      rows={3}
                      placeholder="Enter email addresses, separated by commas (e.g., john@example.com, sarah@example.com)"
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={() => handleSendInvitations(campaign.id)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Sending...' : 'Send Invitations'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CampaignManagement;