// Instrument v2.2-pilot: v2.1 unchanged, plus two staff pages from the
// October 2026 pilot specification. Status: pilot, not yet validated. Field at
// the three Qualtrics clinics first, as a feasibility pilot.
//
// The new pages sit after every v2.1 scored, supplementary and intent-to-leave
// item, immediately before the written questions. v2.1 wording, codes and
// order are untouched, including the Compensation note ("For these final
// questions…"), which is kept word for word although two pages now follow it.
import type { Instrument, Item } from './types';
import { V21 } from './v21';

const pilotItems: Item[] = [
  { id: 'OI1', kind: 'integration', scale: 'agree6', text: 'When someone new joins our clinic, it is clear who is responsible for training them.', short: 'Clear who trains new people' },
  { id: 'OI2', kind: 'integration', scale: 'agree6', text: 'New team members get enough hands-on help to do tasks safely before they work on their own.', short: 'Hands-on help before working alone' },
  { id: 'OI3', kind: 'integration', scale: 'agree6', text: 'Our team makes new people feel welcome and part of the group.', short: 'New people made welcome' },
  { id: 'OI4', kind: 'integration', scale: 'agree6', text: 'Staff who train new people are given time in the schedule to do it.', short: 'Time in the schedule to train' },
  { id: 'CA1', kind: 'aggression', scale: 'freq5', text: 'In the past 3 months, how often has a client been rude to you, insulted you, or yelled at you?', short: 'Client rudeness or yelling' },
  { id: 'CA2', kind: 'aggression', scale: 'freq5', text: 'In the past 3 months, how often has a client threatened to hurt you, or done something physical to you, such as pushing, grabbing or throwing something?', short: 'Client threats or physical acts' },
  { id: 'CA3', kind: 'aggression', scale: 'agree6', text: 'I know how to report a problem with a client at this clinic.', short: 'Know how to report a client problem' },
  {
    id: 'CA4', kind: 'aggression', scale: 'followup4', showIfAnyAbove0: ['CA1', 'CA2'],
    text: 'Think about the most recent time this happened to you in the past 3 months. Afterwards, did someone in charge check in with you?', short: 'Someone in charge checked in',
  },
];

const pages = V21.pages.slice();
pages.splice(pages.findIndex((p) => p.id === 'open'), 0,
  { id: 'oi', type: 'items', title: 'New team members', items: ['OI1', 'OI2', 'OI3', 'OI4'], pilot: true },
  { id: 'ca', type: 'items', title: 'Clients', items: ['CA1', 'CA2', 'CA3', 'CA4'], pilot: true },
);

export const V22: Instrument = {
  ...V21,
  version: 'v2.2-pilot',
  minutes: '12–14',
  scales: {
    ...V21.scales,
    freq5: { id: 'freq5', codes: [0, 1, 2, 3, 4], labels: ['Never', 'Once', '2–5 times', '6–12 times (about every week or two)', 'More than 12 times (more than once a week)'] },
    followup4: { id: 'followup4', labels: ['Yes, within a day', 'Yes, but later', 'No', 'I did not tell anyone in charge'] },
  },
  items: [...V21.items, ...pilotItems],
  pages,
  intro: {
    researcher: V21.intro.researcher.replace('approximately 10–12 minutes', 'approximately 12–14 minutes'),
    selfserve: V21.intro.selfserve.replace('approximately 10–12 minutes', 'approximately 12–14 minutes'),
  },
};
