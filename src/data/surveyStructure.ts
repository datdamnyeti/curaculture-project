// src/data/retentionSurveyStructure.ts

export const retentionSurveyStructure = {
  id: 'retention-assessment',
  title: 'Veterinary Practice Retention Assessment',
  description: 'This survey helps identify factors affecting staff retention and satisfaction in your practice.',
  sections: [
    {
      id: 'compensation',
      title: 'Compensation and Financial Stability',
      description: 'Questions about compensation and financial wellbeing',
      questions: [
        {
          id: 'compensation_1',
          text: 'My compensation reflects my qualifications, experience, and workload.',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'compensation_2',
          text: 'My compensation allows me to have financial stability without requiring additional income sources.',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'compensation_3',
          text: 'My compensation growth over time has matched increased responsibilities and contributions.',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        }
      ]
    },
    {
      id: 'belonging',
      title: 'Workplace Relationships and Belonging',
      description: 'Questions about relationships with colleagues and sense of belonging',
      questions: [
        {
          id: 'belonging_1',
          text: 'All team members are treated with respect regardless of their position in the clinic',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'belonging_2',
          text: 'I have meaningful connections with those I work with that create a sense of belonging.',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'belonging_3',
          text: 'I can count on those I work with during challenging situations, both professionally and personally.',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        }
      ]
    },
    {
      id: 'worklife',
      title: 'Work-Life Integration',
      description: 'Questions about balancing work with personal life',
      questions: [
        {
          id: 'worklife_1',
          text: 'I can take time off when needed without excessive guilt or difficulty.',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'worklife_2',
          text: 'I am able to effectively meet my personal and professional obligations.',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'worklife_3',
          text: 'The clinic I work for actively addresses burnout and excessive workload.',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        }
      ]
    },
    {
      id: 'workplace',
      title: 'Workplace Environment',
      description: 'Questions about the physical workspace and resources',
      questions: [
        {
          id: 'workplace_1',
          text: 'Decision-making considers how changes will impact staff and the quality of our work environment.',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'workplace_2',
          text: 'We have the equipment and technology needed to provide quality care.',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'workplace_3',
          text: 'Our facility layout and spacing support efficient workflow and effective patient care.',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'workplace_4',
          text: 'Clinical decisions and standards of care are guided by up-to-date medical evidence rather than just tradition or convenience.',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        }
      ]
    },
    {
      id: 'leadership',
      title: 'Leadership and Communication',
      description: 'Questions about practice leadership and communication',
      questions: [
        {
          id: 'leadership_1',
          text: 'Practice leadership prioritizes the wellbeing and professional growth of team members.',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'leadership_2',
          text: 'Rationales for decisions are explained',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'leadership_3',
          text: 'Leadership promotes a culture where everyone\'s input is valued, regardless of their role.',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        }
      ]
    },
    {
      id: 'values',
      title: 'Values Alignment and Ethics',
      description: 'Questions about alignment between personal and organizational values',
      questions: [
        {
          id: 'values_1',
          text: 'I can perform my job according to my ethical standards and values.',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'values_2',
          text: 'The clinic\'s expectations for my job align with my personal values and ethics.',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'values_3',
          text: 'The practice\'s policies and protocols align with my beliefs about quality patient care.',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'values_4',
          text: 'I am supported when facing ethically challenging situations with clients or cases.',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        }
      ]
    },
    {
      id: 'psych_safety',
      title: 'Psychological Safety',
      description: 'Questions about feeling safe to speak up and take risks',
      questions: [
        {
          id: 'psych_safety_1',
          text: 'I feel comfortable speaking up about concerns, asking questions, or admitting mistakes without fear of negative consequences.',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'psych_safety_2',
          text: 'Different perspectives are welcomed and respected, even when they challenge the status quo.',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'psych_safety_3',
          text: 'When errors occur, we focus on learning and improvement rather than blame.',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        }
      ]
    },
    {
      id: 'growth',
      title: 'Professional Growth and Development',
      description: 'Questions about learning opportunities and career advancement',
      questions: [
        {
          id: 'growth_1',
          text: 'I have access to continuing education and training opportunities that enhance my skills.',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'growth_2',
          text: 'There are clear pathways for advancement and growth within the practice.',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'growth_3',
          text: 'I receive constructive feedback and guidance that helps me develop professionally.',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'growth_4',
          text: 'More experienced team members actively mentor and support those with less experience.',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        }
      ]
    },
    {
      id: 'purpose',
      title: 'Sense of Purpose and Impact',
      description: 'Questions about the meaning and impact of your work',
      questions: [
        {
          id: 'purpose_1',
          text: 'I feel satisfied that my work directly improves animal welfare.',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'purpose_2',
          text: 'My specific responsibilities in this clinic make a meaningful difference in the quality of care we provide.',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'purpose_3',
          text: 'The shared values among our team members create a sense of common purpose.',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        }
      ]
    },
    {
      id: 'fairness',
      title: 'Fairness and Transparency',
      description: 'Questions about fair treatment and transparency',
      questions: [
        {
          id: 'fairness_1',
          text: 'I have meaningful input into my professional tasks.',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'fairness_2',
          text: 'Policies and procedures are applied fairly and consistently across the team.',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'fairness_3',
          text: 'Resources, opportunities, and recognition are distributed based on fair and transparent criteria.',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'fairness_4',
          text: 'Staff members are treated with dignity, respect, and appropriate personal consideration',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        },
        {
          id: 'fairness_5',
          text: 'I receive adequate, transparent, and timely information about clinic decisions and procedures at this veterinary practice.',
          type: 'likert',
          required: true,
          minValue: 1,
          maxValue: 7
        }
      ]
    }
  ]
};

export default retentionSurveyStructure;