// Scoring for v2.1, following the analysis rules in the v2.1 brief:
// - reverse items are recoded (7 - code) before any score, chart or % favorable
// - area score = mean of a respondent's recoded items, averaged across respondents;
//   skipped items are ignored, never zero
// - % favorable = share of answers at 5-6 after recoding; 4 is its own slice
// - distributions for every area and item; no overall score; no colour bands
// - supplementary items and intent to leave are reported separately
// - group comparisons only when every group shown has 5+ respondents
import type { AreaId, Instrument, Item } from './instrument';
import { itemMap, scaleCodes } from './instrument';

export const MIN_N = 5;

export interface StoredResponse {
  demographics: Record<string, number | string | undefined>;
  answers: Record<string, number | undefined>;
}

export interface Distribution {
  n: number;
  counts: number[];
  mean: number | null;
  favorable: number;
  slightlyAgree: number;
  disagree: number;
}

export interface AreaResult extends Distribution {
  id: AreaId;
  name: string;
  respondents: number;
  items: (Distribution & { id: string; text: string; short: string; reverse: boolean; scale: string })[];
}

export interface Breakdown {
  key: string;
  label: string;
  shown: boolean;
  groups: { id: string; label: string; n: number; areas?: Record<string, number | null> }[];
  hiddenReason?: string;
}

export interface Results {
  version: string;
  n: number;
  suppressed: boolean;
  areas?: AreaResult[];
  supplementary?: (Distribution & { id: string; text: string; short: string })[];
  intentToLeave?: {
    items: (Distribution & { id: string; text: string; short: string; scale: string })[];
    clinic: { answered: number; looking: number; undecided: number; staying: number };
    profession: { answered: number; considered: number };
  };
  lowestArea?: Record<string, number>;
  breakdowns?: Breakdown[];
  /** v2.2 pilot pages. Reported on their own, never added to the areas. */
  pilot?: PilotResults;
}

export interface PilotItem extends Distribution { id: string; text: string; short: string; agree: number }

export interface PilotResults {
  integration: { items: PilotItem[]; score: { n: number; mean: number | null } };
  aggression: {
    rudeness: { n: number; counts: number[]; anyShare: number; sixPlusShare: number };
    /** Threats and physical acts are reported only as a band, never as counts. */
    threatsBand: 'None' | '1–2 people' | '3 or more people';
    threatsShare: number | null;
    knowHowToReport: PilotItem;
    checkIn: { shown: number; suppressed: boolean; n: number; counts: number[]; withinADay: number; toldNoOne: number };
  };
}

/** Group definitions live in config, not code. Support staff = D1 codes 3 and 4. */
export const GROUPINGS: { key: string; label: string; field: string; groups: { id: string; label: string; codes: number[] }[] }[] = [
  { key: 'role', label: 'Role', field: 'D1', groups: [
    { id: 'support', label: 'Support staff', codes: [3, 4] },
    { id: 'rest', label: 'Everyone else', codes: [1, 2, 5, 6, 7, 8] },
  ] },
  { key: 'tenure', label: 'Years at clinic', field: 'D3', groups: [
    { id: 'u1', label: 'Under 1 year', codes: [1, 2] },
    { id: '1to5', label: '1 to under 5 years', codes: [3, 4] },
    { id: '5p', label: '5 years or more', codes: [5] },
  ] },
  { key: 'career', label: 'Career stage', field: 'D2', groups: [
    { id: 'early', label: 'Early career', codes: [1] },
    { id: 'mid', label: 'Mid-career', codes: [2] },
    { id: 'est', label: 'Established', codes: [3] },
  ] },
];

const mean = (xs: number[]): number | null => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);

export function recode(item: Item, code: number | undefined | null): number | null {
  if (code == null) return null;
  return item.reverse ? 7 - code : code;
}

function distribution(values: number[], codes: number[]): Distribution {
  const length = codes.length;
  const counts = Array(length).fill(0);
  values.forEach((v) => { const i = codes.indexOf(v); if (i >= 0) counts[i] += 1; });
  const n = values.length;
  const six = length === 6;
  return {
    n,
    counts,
    mean: mean(values),
    favorable: n && six ? (counts[4] + counts[5]) / n : 0,
    slightlyAgree: n && six ? counts[3] / n : 0,
    disagree: n && six ? (counts[0] + counts[1] + counts[2]) / n : 0,
  };
}

export function itemDistribution(inst: Instrument, item: Item, rs: StoredResponse[]): Distribution {
  const vals = rs.map((r) => recode(item, r.answers[item.id])).filter((v): v is number => v != null);
  return distribution(vals, scaleCodes(inst, item));
}

export function personAreaScore(inst: Instrument, area: AreaId, r: StoredResponse): number | null {
  const vals = inst.items
    .filter((i) => i.kind === 'scored' && i.area === area)
    .map((i) => recode(i, r.answers[i.id]))
    .filter((v): v is number => v != null);
  return mean(vals);
}

export function areaResult(inst: Instrument, areaId: AreaId, rs: StoredResponse[]): AreaResult {
  const area = inst.areas.find((a) => a.id === areaId)!;
  const its = inst.items.filter((i) => i.kind === 'scored' && i.area === areaId);
  const all: number[] = [];
  its.forEach((i) => rs.forEach((r) => { const v = recode(i, r.answers[i.id]); if (v != null) all.push(v); }));
  const personScores = rs.map((r) => personAreaScore(inst, areaId, r)).filter((v): v is number => v != null);
  const d = distribution(all, [1, 2, 3, 4, 5, 6]);
  return {
    ...d,
    mean: mean(personScores),
    id: areaId,
    name: area.name,
    respondents: personScores.length,
    items: its.map((i) => ({ ...itemDistribution(inst, i, rs), id: i.id, text: i.text, short: i.short, reverse: !!i.reverse, scale: i.scale! })),
  };
}

/**
 * A difference holds up when it is at least 0.25 points and stays at least
 * 0.25, in the same direction, once the single most influential respondent is
 * set aside. Used for group gaps and for before/after changes.
 */
export function robustDiff(a: number[], b: number[]): { d: number | null; holds: boolean } {
  if (!a.length || !b.length) return { d: null, holds: false };
  const d = mean(b)! - mean(a)!;
  const sign = Math.sign(d);
  let worst = Math.abs(d);
  const check = (dd: number) => { worst = Math.sign(dd) !== sign ? 0 : Math.min(worst, Math.abs(dd)); };
  if (a.length > 1) a.forEach((_, i) => check(mean(b)! - mean(a.filter((__, j) => j !== i))!));
  if (b.length > 1) b.forEach((_, i) => check(mean(b.filter((__, j) => j !== i))! - mean(a)!));
  return { d, holds: Math.abs(d) >= 0.25 && worst >= 0.25 };
}

export function breakdown(inst: Instrument, rs: StoredResponse[], key: string): Breakdown {
  const g = GROUPINGS.find((x) => x.key === key)!;
  const groups = g.groups.map((grp) => ({ grp, rs: rs.filter((r) => grp.codes.includes(Number(r.demographics[g.field]))) }));
  const small = groups.filter((x) => x.rs.length < MIN_N);
  if (small.length) {
    return {
      key, label: g.label, shown: false,
      groups: groups.map((x) => ({ id: x.grp.id, label: x.grp.label, n: x.rs.length })),
      hiddenReason: `${g.label} breakdown hidden: ${small.map((x) => `${x.grp.label} has ${x.rs.length}`).join('; ')}. Every group shown needs ${MIN_N} or more.`,
    };
  }
  return {
    key, label: g.label, shown: true,
    groups: groups.map((x) => ({
      id: x.grp.id, label: x.grp.label, n: x.rs.length,
      areas: Object.fromEntries(inst.areas.map((a) => [a.id, mean(x.rs.map((r) => personAreaScore(inst, a.id, r)).filter((v): v is number => v != null))])),
    })),
  };
}

export function buildResults(inst: Instrument, rs: StoredResponse[]): Results {
  const n = rs.length;
  if (n < MIN_N) return { version: inst.version, n, suppressed: true };
  const items = itemMap(inst);

  const lowestArea: Record<string, number> = Object.fromEntries(inst.areas.map((a) => [a.id, 0]));
  rs.forEach((r) => {
    const scores = inst.areas.map((a) => [a.id, personAreaScore(inst, a.id, r)] as const).filter((x) => x[1] != null) as [string, number][];
    if (!scores.length) return;
    const m = Math.min(...scores.map((x) => x[1]));
    scores.filter((x) => Math.abs(x[1] - m) < 1e-9).forEach((x) => { lowestArea[x[0]] += 1; });
  });

  let looking = 0, undecided = 0, staying = 0, answered = 0, considered = 0, profN = 0;
  rs.forEach((r) => {
    const il1 = r.answers.IL1, il2 = r.answers.IL2, il3 = r.answers.IL3;
    if (il3 != null) { profN += 1; if (il3 >= 4) considered += 1; }
    if (il1 == null && il2 == null) return;
    answered += 1;
    if ((il1 != null && il1 >= 4) || (il2 != null && il2 <= 2)) looking += 1;
    else if (il1 === 3 || il2 === 3) undecided += 1;
    else staying += 1;
  });

  return {
    version: inst.version,
    n,
    suppressed: false,
    areas: inst.areas.map((a) => areaResult(inst, a.id, rs)),
    supplementary: inst.items.filter((i) => i.kind === 'supplementary').map((i) => ({ ...itemDistribution(inst, i, rs), id: i.id, text: i.text, short: i.short })),
    intentToLeave: {
      items: ['IL1', 'IL2', 'IL3'].map((id) => ({ ...itemDistribution(inst, items[id], rs), id, text: items[id].text, short: items[id].short, scale: items[id].scale! })),
      clinic: { answered, looking, undecided, staying },
      profession: { answered: profN, considered },
    },
    lowestArea,
    breakdowns: GROUPINGS.map((g) => breakdown(inst, rs, g.key)),
    pilot: items.OI1 && items.CA1 ? pilotResults(inst, rs) : undefined,
  };
}

/**
 * The v2.2 pilot pages, under the spec's reporting rules:
 * - OI: % agree at codes 4–6 and the mean per item; a provisional team
 *   integration score (mean of OI1–OI4 for people who answered 3 or more).
 * - CA1: share reporting any rudeness, and 6 or more times (codes 3–4).
 * - CA2: a band only.
 * - CA3: % agree at 4–6.
 * - CA4: shown only to people who reported an incident; suppressed when fewer
 *   than 5 were shown it. "Did not tell anyone in charge" is its own share.
 */
export function pilotResults(inst: Instrument, rs: StoredResponse[]): PilotResults {
  const items = itemMap(inst);
  const pilotItem = (id: string): PilotItem => {
    const d = itemDistribution(inst, items[id], rs);
    return { ...d, id, text: items[id].text, short: items[id].short, agree: d.n ? (d.counts[3] + d.counts[4] + d.counts[5]) / d.n : 0 };
  };
  const oiIds = ['OI1', 'OI2', 'OI3', 'OI4'];
  const scores = rs.map((r) => oiIds.map((k) => r.answers[k]).filter((v): v is number => v != null))
    .filter((v) => v.length >= 3).map((v) => mean(v)!);

  const ca1 = itemDistribution(inst, items.CA1, rs);
  const ca2 = itemDistribution(inst, items.CA2, rs);
  const threatened = ca2.n - ca2.counts[0];
  const shown = rs.filter((r) => (r.answers.CA1 ?? 0) > 0 || (r.answers.CA2 ?? 0) > 0).length;
  const ca4 = itemDistribution(inst, items.CA4, rs);
  const suppressed = shown < MIN_N;

  return {
    integration: { items: oiIds.map(pilotItem), score: { n: scores.length, mean: mean(scores) } },
    aggression: {
      rudeness: {
        n: ca1.n, counts: ca1.counts,
        anyShare: ca1.n ? (ca1.n - ca1.counts[0]) / ca1.n : 0,
        sixPlusShare: ca1.n ? (ca1.counts[3] + ca1.counts[4]) / ca1.n : 0,
      },
      threatsBand: threatened === 0 ? 'None' : threatened <= 2 ? '1–2 people' : '3 or more people',
      threatsShare: threatened >= 3 && ca2.n ? threatened / ca2.n : null,
      knowHowToReport: pilotItem('CA3'),
      checkIn: suppressed
        ? { shown, suppressed, n: 0, counts: [], withinADay: 0, toldNoOne: 0 }
        : { shown, suppressed, n: ca4.n, counts: ca4.counts, withinADay: ca4.n ? ca4.counts[0] / ca4.n : 0, toldNoOne: ca4.n ? ca4.counts[3] / ca4.n : 0 },
    },
  };
}

/** Items reported only as bands or under their own suppression rule. Row-level
 *  codes go to researchers, never to clinic owners. */
export const RESEARCHER_ONLY_ITEMS = ['CA2', 'CA4'];

/** Item-level export keyed by item ID with raw codes, so data pools with the Qualtrics clinics. */
export function exportCsv(inst: Instrument, campaignId: string, rs: StoredResponse[], opts: { researcher?: boolean } = {}): string {
  const ids = inst.items.filter((i) => i.kind !== 'open' && (opts.researcher || !RESEARCHER_ONLY_ITEMS.includes(i.id))).map((i) => i.id);
  const demo = inst.demographics.map((d) => d.id);
  const head = ['campaign_id', 'instrument_version', ...demo, ...ids].join(',');
  const rows = rs.map((r) => [campaignId, inst.version, ...demo.map((d) => r.demographics[d] ?? ''), ...ids.map((id) => r.answers[id] ?? '')].join(','));
  return [head, ...rows].join('\n');
}
