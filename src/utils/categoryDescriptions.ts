// src/utils/categoryDescriptions.ts

export interface CategoryDescription {
  id: string;
  title: string;
  description: string;
}

export const getCategoryDescriptions = (): CategoryDescription[] => {
  return [
    {
      id: 'fair_compensation',
      title: 'Fair Compensation',
      description: 'Assessment of fair pay, financial stability, and how compensation aligns with qualifications, experience, and responsibilities. This category measures whether staff feel appropriately compensated for their contributions.'
    },
    {
      id: 'team_relationships',
      title: 'Team Relationships and Camaraderie',
      description: 'Evaluation of workplace relationships, respect among team members, and sense of connection within the practice. This measures whether staff feel they are part of a supportive community where meaningful bonds exist.'
    },
    {
      id: 'work_life_balance',
      title: 'Work-Life Balance',
      description: 'Measures work-life balance, flexibility, and the practice\'s attention to preventing burnout. This category assesses whether the practice enables staff to meet both professional and personal obligations.'
    },
    {
      id: 'practice_environment',
      title: 'Practice Environment',
      description: 'Assessment of physical environment, equipment, and technology needed for quality care. This measures whether the practice provides the necessary tools and space for efficient workflow and effective patient care.'
    },
    {
      id: 'leadership_quality',
      title: 'Leadership Quality',
      description: 'Evaluation of management\'s prioritization of staff wellbeing, communication of rationales, and inclusivity in decision-making. This assesses whether leadership fosters a supportive and transparent environment.'
    },
    {
      id: 'moral_ethical_alignment',
      title: 'Values Alignment',
      description: 'Measures alignment between personal ethics and organizational expectations. This category assesses whether staff feel they can perform their jobs according to their values and are supported in ethically challenging situations.'
    },
    {
      id: 'psychological_safety',
      title: 'Psychological Safety',
      description: 'Assessment of whether staff feel comfortable speaking up, sharing different perspectives, and making mistakes without fear. This category measures the practice\'s approach to learning from failures rather than assigning blame.'
    },
    {
      id: 'career_development',
      title: 'Career Development',
      description: 'Evaluation of professional development opportunities, feedback mechanisms, and mentorship. This measures whether the practice supports continuing education and career advancement.'
    },
    {
      id: 'purpose_meaning',
      title: 'Sense of Purpose',
      description: 'Measures staff satisfaction with their impact on animal welfare and the meaning they derive from their work. This category assesses whether individuals feel their contributions make a meaningful difference.'
    },
    {
      id: 'organizational_justice',
      title: 'Organizational Justice',
      description: 'Assessment of equitable treatment, transparent resource distribution, and consistent application of policies. This measures whether staff feel they are treated with dignity and respect regardless of their position.'
    },
    
    // Deprecated/alternate IDs - added for backward compatibility
    {
      id: 'compensation',
      title: 'Fair Compensation',
      description: 'Assessment of fair pay, financial stability, and how compensation aligns with qualifications, experience, and responsibilities.'
    },
    {
      id: 'belonging',
      title: 'Team Relationships',
      description: 'Evaluation of workplace relationships, respect among team members, and sense of connection within the practice.'
    },
    {
      id: 'worklife',
      title: 'Work-Life Balance',
      description: 'Measures work-life balance, flexibility, and the practice\'s attention to preventing burnout.'
    },
    {
      id: 'workplace',
      title: 'Practice Environment',
      description: 'Assessment of physical environment, equipment, and technology needed for quality care.'
    },
    {
      id: 'leadership',
      title: 'Leadership Quality',
      description: 'Evaluation of management\'s prioritization of staff wellbeing, communication of rationales, and inclusivity in decision-making.'
    },
    {
      id: 'values',
      title: 'Values Alignment',
      description: 'Measures alignment between personal ethics and organizational expectations.'
    },
    {
      id: 'psych_safety',
      title: 'Psychological Safety',
      description: 'Assessment of whether staff feel comfortable speaking up, sharing different perspectives, and making mistakes without fear.'
    },
    {
      id: 'growth',
      title: 'Career Development',
      description: 'Evaluation of professional development opportunities, feedback mechanisms, and mentorship.'
    },
    {
      id: 'purpose',
      title: 'Sense of Purpose',
      description: 'Measures staff satisfaction with their impact on animal welfare and the meaning they derive from their work.'
    },
    {
      id: 'fairness',
      title: 'Organizational Justice',
      description: 'Assessment of equitable treatment, transparent resource distribution, and consistent application of policies.'
    }
  ];
};

// Utility function to get a single category by ID
export const getCategoryById = (id: string): CategoryDescription | undefined => {
  return getCategoryDescriptions().find(cat => cat.id === id);
};

// Utility function to get a human-readable name for a category
export const getCategoryName = (id: string): string => {
  const category = getCategoryById(id);
  return category ? category.title : id;
};