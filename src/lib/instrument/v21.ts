// Instrument v2.1 — the version fielded at Hardaway, BAFH and Lakeside.
// Wording, option wording and option codes are copied exactly from the v2.1
// brief. Do not paraphrase, fix grammar or reorder. Change the instrument by
// registering a new version, never by editing this one.
import type { Demographic, Instrument, Item } from './types';

const scored = (id: string, area: Item['area'], text: string, short: string, reverse = false): Item => ({
  id,
  kind: 'scored',
  area,
  scale: area === 'CR' ? 'satisfy6' : 'agree6',
  reverse,
  text,
  short,
});

const items: Item[] = [
  scored('TC1', 'TC', 'When I raise a concern at this clinic, it is often dismissed or ignored.', 'Concerns dismissed or ignored', true),
  scored('TC2', 'TC', 'I can ask questions, ask for help, or report a mistake without being judged or blamed.', 'Safe to ask or report a mistake'),
  scored('TC3', 'TC', 'When things get busy or difficult, I can count on my coworkers to step in and help.', 'Coworkers step in to help'),
  scored('TC4', 'TC', 'When something goes wrong at this clinic, the focus is on fixing the problem and learning from it rather than finding someone to blame.', 'Learning over blame'),
  scored('WR1', 'WR', 'The pace and volume of work at this clinic are manageable on a typical day.', 'Manageable pace and volume'),
  scored('WR2', 'WR', 'I regularly leave work feeling emotionally drained from the demands of the day.', 'Leave work emotionally drained', true),
  scored('WR3', 'WR', 'I have enough input into my schedule to plan my personal life around my work commitments.', 'Input into my schedule'),
  scored('WR4', 'WR', 'I have enough time between shifts and during the workday to rest and recharge.', 'Time to rest and recharge'),
  scored('FL1', 'FL', 'Policies and decisions at this clinic are applied consistently and fairly across the team.', 'Policies applied consistently'),
  scored('FL2', 'FL', 'When decisions are made that affect my work, I understand the reasons behind them.', 'Reasons behind decisions'),
  scored('FL3', 'FL', 'Leadership at this clinic follows through on commitments and holds everyone to the same standards.', 'Leadership follows through'),
  scored('TE1', 'TE', 'We have the equipment and facility space needed to do our jobs well.', 'Equipment and space'),
  scored('TE2', 'TE', 'Our workflows and protocols help us work efficiently rather than creating unnecessary steps or confusion.', 'Efficient workflows'),
  scored('TE3', 'TE', 'Our technology and administrative systems make my job easier rather than harder.', 'Technology and admin systems'),
  scored('PM1', 'PM', 'The way this clinic operates allows me to provide the level of care I believe animals deserve.', 'Care animals deserve'),
  scored('PM2', 'PM', 'My specific responsibilities at this clinic make a meaningful difference in the quality of care we provide.', 'My role makes a difference'),
  scored('PM3', 'PM', 'The shared values among our team create a sense of common purpose that I am proud to be part of.', 'Shared values and purpose'),
  scored('GD1', 'GD', 'I have access to training and continuing education opportunities that help me grow in my role.', 'Training and CE access'),
  scored('GD2', 'GD', 'I receive constructive feedback and guidance that helps me develop professionally.', 'Constructive feedback'),
  scored('GD3', 'GD', 'I feel stuck in my current role with little opportunity to grow.', 'Feel stuck in my role', true),
  scored('ES1', 'ES', 'The way this clinic operates is consistent with my personal and professional values.', 'Consistent with my values'),
  scored('ES2', 'ES', 'When a client’s financial limitations affect the care we can provide, I feel supported in navigating those situations.', 'Support with clients’ financial limits'),
  scored('ES3', 'ES', 'After difficult euthanasia or end-of-life cases, I have access to the emotional and professional support I need.', 'Support after euthanasia'),
  scored('ES4', 'ES', 'When clients are disrespectful or aggressive, leadership steps in and supports the staff involved.', 'Leadership backs staff with clients'),
  scored('CR1', 'CR', 'My compensation is appropriate for the workload and responsibilities I carry.', 'Pay fits workload'),
  scored('CR2', 'CR', 'My compensation from this clinic adequately meets my financial needs.', 'Pay meets financial needs'),
  scored('CR3', 'CR', 'I understand how pay and raise decisions are made, and they seem fair and consistent.', 'Pay decisions clear and fair'),
  { id: 'S1', kind: 'supplementary', scale: 'agree6', text: 'If I made a mistake at work, I would feel safe reporting it.', short: 'Safe to report a mistake' },
  { id: 'S2', kind: 'supplementary', scale: 'agree6', text: 'Everyone on our team is treated with respect, whatever their role.', short: 'Respect across roles' },
  { id: 'S3', kind: 'supplementary', scale: 'agree6', text: 'People on our team hold each other accountable for doing their share of the work.', short: 'Peers hold each other accountable' },
  { id: 'IL1', kind: 'outcome', scale: 'likely5', text: 'How likely are you to look for a new job within the next 6 months?', short: 'Likely to look for a new job' },
  { id: 'IL2', kind: 'outcome', scale: 'agree5', text: 'I plan to continue working at this clinic for at least the next 12 months.', short: 'Plan to stay 12 months' },
  { id: 'IL3', kind: 'outcome', scale: 'agree5', text: 'I have thought seriously about leaving the veterinary profession entirely.', short: 'Considered leaving the profession' },
  { id: 'OE3', kind: 'open', text: 'What is one thing about working at this clinic that you would not want to change?', short: 'Would not want to change' },
  { id: 'OE1', kind: 'open', text: 'What is the single most important thing this clinic could do to become a better place to work?', short: 'Most important improvement' },
  { id: 'OE2', kind: 'open', text: 'Is there anything important about your experience working here that this survey didn’t ask about?', short: 'Not asked about' },
];

const demographics: Demographic[] = [
  {
    id: 'D1',
    text: 'What is your primary role at this clinic? If you work in more than one role, choose the one where you spend most of your time.',
    options: [
      'Veterinarian (DVM/VMD)',
      'Credentialed Veterinary Technician (CVT/RVT/LVT)',
      'Veterinary Technician (not credentialed)',
      'Veterinary Assistant',
      'Practice Manager',
      'Receptionist/Client Service',
      'Kennel/Animal Care Staff',
      'Other (please specify)',
    ],
    otherCode: 8,
  },
  { id: 'D2', text: 'How long have you worked in the veterinary field (in any role)?', options: ['Early career: 0-5 years', 'Mid-career: 6-15 years', 'Established: 16 or more years'] },
  { id: 'D3', text: 'How long have you worked at this clinic?', options: ['Less than 6 months', '6 months to under 1 year', '1 to under 3 years', '3 to under 5 years', '5 years or more'] },
  { id: 'D4', text: 'What is your employment status?', options: ['Full-time', 'Part-time', 'Relief/Per Diem'] },
  { id: 'D5', text: 'Gender', options: ['Male', 'Female', 'Non-binary/Other', 'Prefer not to say'] },
];

export const V21: Instrument = {
  version: 'v2.1',
  name: 'Veterinary Practice Assessment',
  minutes: '10–12',
  scales: {
    agree6: { id: 'agree6', labels: ['Strongly disagree', 'Disagree', 'Slightly disagree', 'Slightly agree', 'Agree', 'Strongly agree'] },
    satisfy6: { id: 'satisfy6', labels: ['Very dissatisfied', 'Dissatisfied', 'Slightly dissatisfied', 'Slightly satisfied', 'Satisfied', 'Very satisfied'] },
    agree5: { id: 'agree5', labels: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'] },
    likely5: { id: 'likely5', labels: ['Very unlikely', 'Unlikely', 'Neutral', 'Likely', 'Very likely'] },
  },
  areas: [
    { id: 'TC', name: 'Team & Communication Culture' },
    { id: 'WR', name: 'Workload & Recovery' },
    { id: 'FL', name: 'Fairness & Leadership' },
    { id: 'TE', name: 'Tools & Environment' },
    { id: 'PM', name: 'Purpose & Meaning' },
    { id: 'GD', name: 'Growth & Development' },
    { id: 'ES', name: 'Ethical Support' },
    { id: 'CR', name: 'Compensation & Rewards' },
  ],
  items,
  demographics,
  // Fixed order, no randomization, no conditional display. Pages A–D carry no area labels.
  pages: [
    { id: 'intro', type: 'intro', title: 'Introduction' },
    { id: 'demo', type: 'demographics', title: 'About you', items: ['D1', 'D2', 'D3', 'D4', 'D5'] },
    { id: 'il', type: 'items', title: 'Your plans', items: ['IL1', 'IL2', 'IL3'] },
    { id: 'A', type: 'items', title: '', items: ['TC2', 'WR1', 'FL2', 'TE1', 'WR3', 'FL1', 'S3'] },
    { id: 'B', type: 'items', title: '', items: ['PM1', 'GD1', 'TC3', 'PM2', 'TE2', 'GD3', 'S1'] },
    { id: 'C', type: 'items', title: '', items: ['ES1', 'TC4', 'ES2', 'WR2', 'ES3', 'ES4', 'WR4'] },
    { id: 'D', type: 'items', title: '', items: ['FL3', 'GD2', 'TC1', 'PM3', 'TE3', 'S2'] },
    {
      id: 'comp',
      type: 'items',
      title: 'Compensation',
      items: ['CR1', 'CR2', 'CR3'],
      note: 'For these final questions, the response scale changes. Please indicate your level of satisfaction with each of the following.',
    },
    { id: 'open', type: 'open', title: 'In your own words', items: ['OE3', 'OE1', 'OE2'] },
    { id: 'close', type: 'close', title: 'Thank you' },
  ],
  intro: {
    researcher:
      'Thank you for participating in this survey. Your responses will help identify what is working well at this clinic and where improvements can be made. This survey is run by an independent researcher, not by clinic management. It is confidential — your individual answers will not be shared with your manager or anyone at the clinic. Results are reported only for the whole clinic and for groups of five or more people. No group smaller than five is ever reported. The survey takes approximately 10–12 minutes to complete. Please answer based on your honest experience.',
    // Draft for the self-serve tier (open decision in the v2.1 brief). Only use it
    // when owners cannot see written answers (open_ended_mode = 'hidden').
    selfserve:
      'Thank you for participating in this survey. Your responses will help identify what is working well at this clinic and where improvements can be made. This survey runs through CuraCulture, an independent platform; your clinic never sees individual answers. Results are reported only for the whole clinic and for groups of five or more people. No group smaller than five is ever reported. The survey takes approximately 10–12 minutes to complete. Please answer based on your honest experience.',
  },
};
