// src/components/dashboard/CampaignForm.tsx
import React, { useState } from 'react';

// Define survey types
type SurveyType = 'culture' | 'retention' | 'satisfaction';

// Default email templates for different survey types
const defaultEmailTemplates: Record<SurveyType, string> = {
  culture: `
Dear Team Member,

You are invited to participate in our practice culture assessment. Your feedback is important to us and will help identify areas where we can improve our workplace culture.

The survey is anonymous and should take about 10-15 minutes to complete. Please click the link below to access the survey:

{{surveyLink}}

Thank you for your participation!

Best regards,
Practice Management Team
`.trim(),

  retention: `
Dear Team Member,

We value your contributions to our practice and want to ensure we're creating an environment where you can thrive long-term. 

Please take a few minutes to complete our staff retention survey. Your anonymous feedback will help us understand what's working well and what we need to improve to better support our team.

Access the survey here:
{{surveyLink}}

Thank you for your honest input.

Best regards,
Practice Management Team
`.trim(),

  satisfaction: `
Dear Client,

Thank you for choosing our veterinary practice for your pet's care. We're committed to providing the best possible experience and would appreciate your feedback.

Please take a moment to complete our satisfaction survey:
{{surveyLink}}

Your responses will help us continue to improve our services.

Thank you,
The Veterinary Team
`.trim()
};

// Default email subjects for different survey types
const defaultEmailSubjects: Record<SurveyType, string> = {
  culture: 'Invitation to Participate in Practice Culture Survey',
  retention: 'Your Input Matters: Staff Retention Survey',
  satisfaction: 'Share Your Feedback: Pet Care Experience Survey'
};

// Get descriptions for survey types
const getSurveyTypeDescription = (type: SurveyType): string => {
  const descriptions: Record<SurveyType, string> = {
    culture: 'Assess your practice culture and identify strengths and areas for improvement',
    retention: 'Identify factors affecting staff retention and satisfaction',
    satisfaction: 'Gather feedback from clients about their experience'
  };
  
  return descriptions[type] || '';
};

interface CampaignFormProps {
  onSubmit: (campaignData: {
    name: string;
    description: string;
    surveyType: SurveyType;
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
  // Form state
  const [campaignData, setCampaignData] = useState({
    name: '',
    description: '',
    surveyType: 'culture' as SurveyType,
    emailSubject: defaultEmailSubjects.culture,
    emailBody: defaultEmailTemplates.culture
  });
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCampaignData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle survey type change
  const handleSurveyTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const surveyType = e.target.value as SurveyType;
    
    // Update survey type, subject, and email body template
    setCampaignData(prev => ({
      ...prev,
      surveyType,
      emailSubject: defaultEmailSubjects[surveyType],
      emailBody: defaultEmailTemplates[surveyType]
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
          onChange={handleSurveyTypeChange}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="culture">Culture Assessment</option>
          <option value="retention">Retention Survey</option>
          <option value="satisfaction">Client Satisfaction Survey</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          {getSurveyTypeDescription(campaignData.surveyType)}
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