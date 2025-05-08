// src/components/dashboard/CampaignForm.tsx
import React, { useState } from 'react';

// Default email template for retention survey
const defaultEmailTemplate = `
Dear Team Member,

We value your contributions to our practice and want to ensure we're creating an environment where you can thrive long-term. 

Please take a few minutes to complete our staff retention survey. Your anonymous feedback will help us understand what's working well and what we need to improve to better support our team.

Access the survey here:
{{surveyLink}}

Thank you for your honest input.

Best regards,
Practice Management Team
`.trim();

// Default email subject for retention survey
const defaultEmailSubject = 'Your Input Matters: Staff Retention Survey';

// Get description for retention survey
const getRetentionSurveyDescription = (): string => {
  return 'Identify factors affecting staff retention and satisfaction';
};

interface CampaignFormProps {
  onSubmit: (campaignData: {
    name: string;
    description: string;
    surveyType: string;
    emailSubject: string;
    emailBody: string;
  }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const CampaignForm: React.FC<CampaignFormProps> = ({
  onSubmit,
  onCancel,
  isSubmitting
}) => {
  // Form state - Set retention as the default
  const [campaignData, setCampaignData] = useState({
    name: '',
    description: '',
    surveyType: 'retention',
    emailSubject: defaultEmailSubject,
    emailBody: defaultEmailTemplate
  });
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCampaignData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(campaignData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Campaign Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={campaignData.name}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-lg"
          placeholder="e.g., Spring 2025 Retention Survey"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          value={campaignData.description}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-lg"
          rows={2}
          placeholder="Optional description of this campaign"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Survey Type
        </label>
        <select
          name="surveyType"
          value={campaignData.surveyType}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-lg"
          disabled // Locked to retention for now
        >
          <option value="retention">Retention Survey</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          {getRetentionSurveyDescription()}
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Subject
        </label>
        <input
          type="text"
          name="emailSubject"
          value={campaignData.emailSubject}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-lg"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Body
        </label>
        <textarea
          name="emailBody"
          value={campaignData.emailBody}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
          rows={10}
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Use {'{{'} surveyLink {'}}' } as a placeholder for the survey link.
        </p>
      </div>
      
      <div className="flex justify-end space-x-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          disabled={isSubmitting || !campaignData.name.trim()}
        >
          {isSubmitting ? 'Creating...' : 'Create Campaign'}
        </button>
      </div>
    </form>
  );
};

export default CampaignForm;