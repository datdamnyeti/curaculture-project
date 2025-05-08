// src/data/retentionSurveyStructure.ts
import { QuestionType } from '../components/survey/SurveyQuestion';

// Export the survey structure as a named export
export const RetentionSurveyStructure = {
  id: 'retention-assessment',
  title: 'Veterinary Practice Assessment',
  description: 'This assessment helps identify key factors affecting workplace quality and staff retention in your veterinary practice.',
  sections: [
    {
      id: 'demographics',
      title: 'About You',
      description: 'Basic information to help us categorize responses',
      questions: [
        {
          id: 'role',
          text: 'What is your role in the practice?',
          type: 'dropdown' as QuestionType,
          required: true,
          options: [
            { id: 'vet', label: 'Veterinarian', value: 'Veterinarian' },
            { id: 'tech', label: 'Technician', value: 'Technician' },
            { id: 'assistant', label: 'Assistant', value: 'Assistant' },
            { id: 'recept', label: 'Receptionist', value: 'Receptionist' },
            { id: 'manager', label: 'Practice Manager', value: 'Practice Manager' },
            { id: 'admin', label: 'Administrator', value: 'Administrator' },
            { id: 'owner', label: 'Owner', value: 'Owner' },
            { id: 'other', label: 'Other', value: 'Other' }
          ]
        },
        {
          id: 'experience_years',
          text: 'How many years have you worked in veterinary practice?',
          type: 'numeric' as QuestionType,
          required: true,
          minValue: 0,
          maxValue: 50
        },
        {
          id: 'tenure',
          text: 'How long have you been with your current practice?',
          type: 'dropdown' as QuestionType,
          required: true,
          options: [
            { id: 'less1', label: 'Less than 1 year', value: 'Less than 1 year' },
            { id: '1to3', label: '1-3 years', value: '1-3 years' },
            { id: '3to5', label: '3-5 years', value: '3-5 years' },
            { id: '5to10', label: '5-10 years', value: '5-10 years' },
            { id: 'more10', label: 'More than 10 years', value: 'More than 10 years' }
          ]
        }
      ]
    },
    {
      id: 'fair_compensation',
      title: '1. Fair Compensation',
      description: 'Questions about compensation and financial wellbeing',
      questions: [
        {
          id: 'compensation_1',
          text: 'My compensation reflects my qualifications, experience, and workload.',
          type: 'likert' as QuestionType,
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'compensation_2',
          text: 'My compensation allows me to have financial stability without requiring additional income sources.',
          type: 'likert' as QuestionType,
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'compensation_3',
          text: 'My compensation growth over time has matched increased responsibilities and contributions.',
          type: 'likert' as QuestionType,
          required: true,
          minValue: 1,
          maxValue: 7
        }
      ]
    },
    {
      id: 'team_relationships',
      title: '2. Team Relationships and Camaraderie',
      description: 'Questions about relationships with colleagues and sense of belonging',
      questions: [
        {
          id: 'relationships_1',
          text: 'All team members are treated with respect regardless of their position in the clinic.',
          type: 'likert' as QuestionType,
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'relationships_2',
          text: 'I have meaningful connections with those I work with that create a sense of belonging.',
          type: 'likert' as QuestionType,
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'relationships_3',
          text: 'I can count on those I work with during challenging situations, both professionally and personally.',
          type: 'likert' as QuestionType,
          required: true,
          minValue: 1,
          maxValue: 7
        }
      ]
    },
    {
      id: 'work_life_balance',
      title: '3. Work-Life Balance and Flexibility',
      description: 'Questions about balancing work with personal life',
      questions: [
        {
          id: 'worklife_1',
          text: 'I am able to effectively meet my personal and professional obligations.',
          type: 'likert' as QuestionType,
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'worklife_2',
          text: 'The clinic I work for actively addresses burnout and excessive workload.',
          type: 'likert' as QuestionType,
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'worklife_3',
          text: 'Decision-making considers how changes will impact staff and the quality of our work environment.',
          type: 'likert' as QuestionType,
          required: true,
          minValue: 1,
          maxValue: 7
        }
      ]
    },
    {
      id: 'practice_environment',
      title: '4. Practice Capabilities (Modern Medicine)',
      description: 'Questions about the physical workspace, equipment, and medical standards',
      questions: [
        {
          id: 'environment_1',
          text: 'We have the equipment and technology needed to provide quality care.',
          type: 'likert' as QuestionType,
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'environment_2',
          text: 'Our facility layout and spacing support efficient workflow and effective patient care.',
          type: 'likert' as QuestionType,
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'environment_3',
          text: 'Clinical decisions and standards of care are guided by up-to-date medical evidence rather than just tradition or convenience.',
          type: 'likert' as QuestionType,
          required: true,
          minValue: 1,
          maxValue: 7
        }
      ]
    },
    {
      id: 'leadership_quality',
      title: '5. Leadership Quality',
      description: 'Questions about practice leadership and management',
      questions: [
        {
          id: 'leadership_1',
          text: 'Practice leadership prioritizes the wellbeing and professional growth of team members.',
          type: 'likert' as QuestionType,
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'leadership_2',
          text: 'Rationales for decisions are explained.',
          type: 'likert' as QuestionType,
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'leadership_3',
          text: 'Leadership promotes a culture where everyone\'s input is valued, regardless of their role.',
          type: 'likert' as QuestionType,
          required: true,
          minValue: 1,
          maxValue: 7
        }
      ]
    },
    {
      id: 'moral_ethical_alignment',
      title: '6. Moral and Ethical Alignment',
      description: 'Questions about alignment between personal and organizational values',
      questions: [
        {
          id: 'ethics_1',
          text: 'The clinic\'s expectations for my job align with my personal values and ethics.',
          type: 'likert' as QuestionType,
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'ethics_2',
          text: 'The practice\'s policies and protocols align with my beliefs about quality patient care.',
          type: 'likert' as QuestionType,
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'ethics_3',
          text: 'I am supported when facing ethically challenging situations with clients or cases.',
          type: 'likert' as QuestionType,
          required: true,
          minValue: 1,
          maxValue: 7
        }
      ]
    },
    {
      id: 'psychological_safety',
      title: '7. Psychological Safety',
      description: 'Questions about feeling safe to speak up and take risks',
      questions: [
        {
          id: 'psych_safety_1',
          text: 'I feel comfortable speaking up about concerns, asking questions, or admitting mistakes without fear of negative consequences.',
          type: 'likert' as QuestionType,
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'psych_safety_2',
          text: 'Different perspectives are welcomed and respected, even when they challenge the status quo.',
          type: 'likert' as QuestionType,
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'psych_safety_3',
          text: 'When errors occur, we focus on learning and improvement rather than blame.',
          type: 'likert' as QuestionType,
          required: true,
          minValue: 1,
          maxValue: 7
        }
      ]
    },
    {
      id: 'career_development',
      title: '8. Career Development Pathways',
      description: 'Questions about learning opportunities and professional development',
      questions: [
        {
          id: 'career_1',
          text: 'I have access to continuing education and training opportunities that enhance my skills.',
          type: 'likert' as QuestionType,
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'career_2',
          text: 'I receive constructive feedback and guidance that helps me develop professionally.',
          type: 'likert' as QuestionType,
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'career_3',
          text: 'More experienced team members actively mentor and support those with less experience.',
          type: 'likert' as QuestionType,
          required: true,
          minValue: 1,
          maxValue: 7
        }
      ]
    },
    {
      id: 'purpose_meaning',
      title: '9. Sense of Purpose and Meaning',
      description: 'Questions about the meaning and impact of your work',
      questions: [
        {
          id: 'purpose_1',
          text: 'I feel satisfied that my work directly improves animal welfare.',
          type: 'likert' as QuestionType,
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'purpose_2',
          text: 'My specific responsibilities in this clinic make a meaningful difference in the quality of care we provide.',
          type: 'likert' as QuestionType,
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'purpose_3',
          text: 'The shared values among our team members create a sense of common purpose.',
          type: 'likert' as QuestionType,
          required: true,
          minValue: 1,
          maxValue: 7
        }
      ]
    },
    {
      id: 'organizational_justice',
      title: '10. Organizational Justice',
      description: 'Questions about fair treatment and transparency',
      questions: [
        {
          id: 'justice_1',
          text: 'Policies and procedures are applied fairly and consistently across the team.',
          type: 'likert' as QuestionType,
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'justice_2',
          text: 'Resources, opportunities, and recognition are distributed based on fair and transparent criteria.',
          type: 'likert' as QuestionType,
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'justice_3',
          text: 'Staff members are treated with dignity, respect, and appropriate personal consideration.',
          type: 'likert' as QuestionType,
          required: true,
          minValue: 1,
          maxValue: 7
        }
      ]
    }
  ]
};

// Also export as default for flexibility
export default RetentionSurveyStructure;