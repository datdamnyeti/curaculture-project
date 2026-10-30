// v2.2 pilot owner tools: codes and wording from the October 2026 pilot
// specification. Status: pilot, not yet validated. Change wording by adding a
// new version, not by editing fields a clinic has already used.
import type { AreaId } from '../instrument';

export const ROLES = [
  { code: 'R1', label: 'Veterinarian', clinical: true },
  { code: 'R2', label: 'Credentialed technician', clinical: true },
  { code: 'R3', label: 'Veterinary assistant', clinical: true },
  { code: 'R4', label: 'Client service / front desk', clinical: false },
  { code: 'R5', label: 'Practice manager or admin', clinical: false },
  { code: 'R6', label: 'Kennel, groomer or other', clinical: false },
] as const;
export type RoleCode = (typeof ROLES)[number]['code'];
export const ROLE_CODES = ROLES.map((r) => r.code) as RoleCode[];
export const ROLE_LABEL = Object.fromEntries(ROLES.map((r) => [r.code, r.label])) as Record<RoleCode, string>;
export const CLINICAL_ROLES: RoleCode[] = ['R1', 'R2', 'R3'];

/** XR5/XR6. Codes 01–10 map to the v2.1 areas; 20–24 are not about culture; 99 is other. */
export const EXIT_REASONS: { code: string; label: string; area: AreaId | null }[] = [
  { code: '01', label: 'Pay or benefits', area: 'CR' },
  { code: '02', label: 'Not feeling appreciated or recognised', area: 'CR' },
  { code: '03', label: 'Hours, schedule or on-call load', area: 'WR' },
  { code: '04', label: 'Stress or exhaustion from the work', area: 'WR' },
  { code: '05', label: 'Conflict with coworkers or team problems', area: 'TC' },
  { code: '06', label: 'Concerns about a manager, leader or fair treatment', area: 'FL' },
  { code: '07', label: 'Equipment, facility, systems or ability to practise good medicine', area: 'TE' },
  { code: '08', label: 'Not enough training, mentoring or room to grow', area: 'GD' },
  { code: '09', label: 'Ethical conflict about patient care, or client behaviour', area: 'ES' },
  { code: '10', label: 'Work no longer felt meaningful or matched their values', area: 'PM' },
  { code: '20', label: 'Moved away', area: null },
  { code: '21', label: 'Family or caregiving needs', area: null },
  { code: '22', label: 'Career change or returned to school', area: null },
  { code: '23', label: 'Performance or conduct (clinic-initiated)', area: null },
  { code: '24', label: 'Position cut or business reasons', area: null },
  { code: '99', label: 'Other or not known', area: null },
];
export const EXIT_REASON = Object.fromEntries(EXIT_REASONS.map((r) => [r.code, r]));
export const INITIATED_BY: Record<number, string> = { 1: 'Employee chose to leave', 2: 'Clinic ended employment', 3: 'Mutual or end of fixed term', 4: 'Retirement' };
export const DESTINATION: Record<number, string> = { 1: 'Another clinic or hospital', 2: 'Non-clinical veterinary job (industry, corporate, government)', 3: 'Left veterinary work', 4: 'School or training', 5: 'Not working', 9: 'Unknown' };
export const REASON_SOURCE: Record<number, string> = { 1: 'Exit interview or conversation', 2: 'Resignation letter or email', 3: 'My own view', 9: 'Not known' };
export const REHIRE: Record<number, string> = { 1: 'Yes', 2: 'Maybe', 3: 'No' };

export const CHECKPOINT_DAYS = [0, 30, 90] as const;
export const ONBOARDING_STEPS: { id: string; day: 0 | 30 | 90; text: string; critical: boolean }[] = [
  { id: 'OC1', day: 0, critical: true, text: 'A buddy was named and told before the new hire’s first day.' },
  { id: 'OC2', day: 0, critical: false, text: 'The new hire got a written skills plan for their role, listing each skill, who trains it and a target sign-off date.' },
  { id: 'OC3', day: 0, critical: false, text: 'The first two weeks’ schedule includes set training or shadowing time.' },
  { id: 'OC4', day: 0, critical: false, text: 'The owner or manager met the new hire in person to cover clinic values, team norms and how decisions are made.' },
  { id: 'OC5', day: 0, critical: false, text: 'The new hire was shown the client-conduct policy, how to report an incident and how to get help fast.' },
  { id: 'OC6', day: 0, critical: false, text: 'The new hire was introduced in person to each team member on their shifts during week 1.' },
  { id: 'OC7', day: 30, critical: true, text: 'At least two one-to-one check-ins with a manager were held in the first 30 days, covering workload and wellbeing.' },
  { id: 'OC8', day: 30, critical: false, text: 'The skills plan was reviewed, and sign-offs due by day 30 were recorded.' },
  { id: 'OC9', day: 30, critical: true, text: 'The new hire has not worked alone after hours, on call, or in any task not yet signed off.' },
  { id: 'OC10', day: 30, critical: false, text: 'The new hire was asked what is unclear and what the clinic could do better, and the answers were noted.' },
  { id: 'OC11', day: 30, critical: false, text: 'The buddy and new hire have met at least once a week.' },
  { id: 'OC12', day: 90, critical: false, text: 'A 90-day review was held, with feedback given in both directions.' },
  { id: 'OC13', day: 90, critical: false, text: 'All skills due by day 90 are signed off, or a revised plan with new dates is in place.' },
  { id: 'OC14', day: 90, critical: false, text: 'The new hire’s caseload or task load was increased step by step, as agreed with them.' },
];
export const STEP_STATUS: Record<number, string> = { 2: 'Done on time', 1: 'Done late or only partly', 0: 'Not done', 8: 'Does not apply' };

export const POLICY_ITEMS: { id: string; element: string; text: string; legalReview?: boolean }[] = [
  { id: 'CP1', element: 'Commitment', text: 'We have a written client-conduct policy that says what client behaviour is not accepted.' },
  { id: 'CP2', element: 'Commitment', text: 'Clients can see this policy (for example, a sign at reception, the website, or new-client forms).' },
  { id: 'CP3', element: 'Prevention', text: 'Any staff member may end a call or appointment when a client becomes abusive, without asking permission first.' },
  { id: 'CP4', element: 'Prevention', text: 'We have a written process for dismissing a client, including who decides and how it is recorded.', legalReview: true },
  { id: 'CP5', element: 'Records', text: 'Staff have one named way to report a client incident (a person, a form or a channel).' },
  { id: 'CP6', element: 'Records', text: 'Every reported incident, including near misses, is logged with the date and type.' },
  { id: 'CP7', element: 'Commitment', text: 'Our policy says in writing that staff will not be blamed or punished for reporting in good faith.' },
  { id: 'CP8', element: 'Training', text: 'How many current staff completed de-escalation training in the past 12 months?' },
  { id: 'CP9', element: 'Training', text: 'New hires learn the policy and the reporting route before they work with clients.' },
  { id: 'CP10', element: 'Prevention', text: 'Any staff member can ask for a second person to join a client interaction, and someone comes.' },
  { id: 'CP11', element: 'Worksite analysis', text: 'Clients involved in a past incident are flagged in our practice software so staff are warned.' },
  { id: 'CP12', element: 'After-care', text: 'After a serious incident, the staff member involved can take a break before their next client.' },
  { id: 'CP13', element: 'After-care', text: 'Staff can ask not to be booked with a client who has abused them before, and we honour it.' },
  { id: 'CP14', element: 'After-care', text: 'A leader checks in with the staff member within one working day of a serious incident.' },
  { id: 'CP15', element: 'After-care', text: 'Staff are told how to reach confidential support, such as an employee assistance program or counselling.' },
];
export const POLICY_ELEMENTS = ['Commitment', 'Prevention', 'Worksite analysis', 'Training', 'Records', 'After-care'] as const;
export const POLICY_STATUS: Record<number, string> = { 2: 'Yes, in writing or always done', 1: 'Informal or sometimes', 0: 'No' };
export const CP8_OPTIONS: Record<number, string> = { 0: 'None', 1: 'Under half', 2: 'Half or more', 3: 'All' };

export const STAY_TRIGGERS: Record<string, string> = {
  opening_90: 'Opening over 90 days', two_exits: 'Two exits in one role in 12 months', new_hire: 'New hire at day 60–90', other: 'Other',
};
export const STAY_QUESTIONS: [string, string][] = [
  ['What part of your work do you most enjoy right now?', '“Tell me about a recent day when that happened.”'],
  ['What have you learned here this year, and what would you like to learn next?', '“Who has helped you learn the most?”'],
  ['What makes you stay at this clinic?', '“If that changed, would you still stay?”'],
  ['When did you last think about leaving, and what set that off?', '“Is that still going on?”'],
  ['What part of the job wears you down the most?', '“How often does that happen in a typical week?”'],
  ['What one thing could I change that would make your job better?', '“On a scale of 1–10, how much would that matter to you?”'],
];

export type Evidence = 'Strong' | 'Moderate' | 'Emerging' | 'Expert guidance' | 'Practice wisdom';
export type Tool = 'vitals' | 'exits' | 'onboarding' | 'safety';
export const ACTIONS: { tool: Tool; text: string; evidence: Evidence; note: string }[] = [
  { tool: 'vitals', text: 'No solo after-hours or on-call shift for a new hire until skills sign-off', evidence: 'Moderate', note: 'New graduates placed in situations they could not handle were 5.26 times as likely to leave (Gates et al. 2020).' },
  { tool: 'vitals', text: 'Cap on-call nights per person and publish the rota four weeks ahead', evidence: 'Emerging', note: 'Jelinski et al. 2009.' },
  { tool: 'exits', text: 'Hold stay interviews: 30 minutes, one to one, on what keeps someone here', evidence: 'Expert guidance', note: 'SHRM-published method (Finnegan 2023); no peer-reviewed veterinary trial.' },
  { tool: 'exits', text: 'If two or more exits are under 90 days, adopt the full onboarding checklist for the next hire', evidence: 'Strong', note: 'General workplaces: across 83 field experiments, onboarding programs raised retention odds 1.46 times (Liu et al. 2024).' },
  { tool: 'exits', text: 'Weekly specific recognition from a leader for each team member', evidence: 'Emerging', note: 'Feeling appreciated rose to the second reason to leave among AAHA respondents planning to go (AAHA Trends, Jan 2024).' },
  { tool: 'onboarding', text: 'Choose and brief a buddy before the start date; protect weekly buddy time for 90 days', evidence: 'Strong', note: 'Social ties were among the program features with the largest retention effects (Liu et al. 2024).' },
  { tool: 'onboarding', text: 'Build one reusable skills plan per role, with a named trainer for each skill and sign-off dates', evidence: 'Moderate', note: 'Role clarity links onboarding to retention (Bauer et al. 2007).' },
  { tool: 'onboarding', text: 'A 15-minute manager check-in every two weeks for a new hire’s first 90 days', evidence: 'Moderate', note: 'Employers not checking on new graduates’ wellbeing was linked to leaving, odds ratio 5.08 (Gates et al. 2020).' },
  { tool: 'onboarding', text: 'Block 1–2 hours a week of trainer time on the rota during a new hire’s first 90 days', evidence: 'Expert guidance', note: 'AVA policy on graduate support.' },
  { tool: 'safety', text: 'Name one person and one short form for client incidents, state the no-reprisal rule, and reply within one working day', evidence: 'Expert guidance', note: 'OSHA 3148 workplace violence guidance for healthcare.' },
  { tool: 'safety', text: 'Train every staff member in de-escalation each year, with role-play', evidence: 'Expert guidance', note: 'OSHA 3148; 57% of veterinarians surveyed had no de-escalation training (Kogan & Rishniw 2026).' },
  { tool: 'safety', text: 'After a serious incident, a leader meets the staff member within one working day and offers a break or a hand-off', evidence: 'Emerging', note: 'Organisational support predicted satisfaction and intent to leave in UK veterinary staff (Irwin et al. 2025).' },
  { tool: 'safety', text: 'Give front-desk staff the right to end abusive calls, and a second-person call button', evidence: 'Expert guidance', note: 'BVA/BVNA guidance; OSHA 3148.' },
];
