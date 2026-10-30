import { describe, expect, it } from 'vitest';
import { freshDb } from './db';
import {
  auditScore, checkpoint, completion, criticalMissed, dueItems, exitMetrics, lastEndedQuarter, onboardingMetrics,
  quarterEnd, reconcile, stayTriggers, tenureBand, vitalsMetrics, ExitRecord, NewHire, PolicyAudit, Vitals,
} from '../src/lib/practice/metrics';
import { cleanAudit, cleanExit, cleanHirePatch, cleanStay, cleanVitals } from '../src/lib/practice/validate';
import { signals } from '../src/lib/practice/signals';
import { ValidationError } from '../src/lib/validate';
import { buildResults, StoredResponse } from '../src/lib/scoring';
import { V22 } from '../src/lib/instrument/v22';

const TODAY = '2026-10-30';
const q = (quarter: string, hc: number[], hires: Partial<Record<string, number>>, open: Vitals['openPositions'], shifts: number | null): Vitals => {
  const roles = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'] as const;
  const headcount = Object.fromEntries(roles.map((r, i) => [r, hc[i]]));
  const fte = Object.fromEntries(roles.map((r, i) => [r, hc[i] * 0.9]));
  return { quarter, headcount, fte, hires, exitsConfirmed: true, openPositions: open, afterHoursShifts: shifts, overtimeHours: null };
};
const exit = (id: string, lastDay: string, role: ExitRecord['role'], started: string | null, initiatedBy: number | null, main: string | null, others: string[] = []): ExitRecord =>
  ({ id, lastDay, role, startedMonth: started, initiatedBy, mainReason: main, otherReasons: others, destination: 1, reasonSource: 1, wouldRehire: 1, codedAt: initiatedBy ? '2026-01-01' : null });

// Pine Hollow, as in the demo: one quarter is missing a hire, so it doesn't add up.
const VITALS = [
  q('2025-Q3', [5, 4, 5, 4, 1, 3], {}, [], 78),
  q('2025-Q4', [5, 3, 6, 4, 1, 3], { R3: 1 }, [{ role: 'R2', since: '2025-12-08' }], 82),
  q('2026-Q1', [5, 4, 5, 3, 1, 3], { R2: 1 }, [{ role: 'R2', since: '2026-03-02' }], 88),
  q('2026-Q2', [4, 4, 5, 3, 1, 3], { R3: 1 }, [{ role: 'R1', since: '2026-05-04' }, { role: 'R2', since: '2026-03-02' }], 104),
  q('2026-Q3', [4, 4, 6, 4, 1, 2], { R3: 1 }, [{ role: 'R1', since: '2026-05-04' }, { role: 'R2', since: '2026-03-02' }], 96),
];
const EXITS = [
  exit('x1', '2025-12-15', 'R2', '2021-03-01', 1, '20', ['01']),
  exit('x2', '2026-01-16', 'R3', '2025-11-01', 1, '08', ['04']),
  exit('x3', '2026-03-20', 'R4', '2024-06-01', 1, '09', ['02']),
  exit('x4', '2026-05-15', 'R1', '2023-08-01', 1, '03', ['06']),
  exit('x5', '2026-06-19', 'R3', '2026-04-01', 1, '02', ['06']),
  exit('x6', '2026-08-20', 'R6', '2025-02-01', 2, '23'),
];
const all = (o: Record<string, number>) => ({ OC1: 2, OC2: 2, OC3: 2, OC4: 2, OC5: 2, OC6: 2, OC7: 2, OC8: 2, OC9: 2, OC10: 2, OC11: 2, OC12: 2, OC13: 2, OC14: 2, ...o });
const HIRES: NewHire[] = [
  { id: 'h1', name: 'Brooke', role: 'R3', startDate: '2025-11-03', leftOn: '2026-01-16', steps: { OC1: 0, OC2: 0, OC3: 1, OC4: 2, OC5: 0, OC6: 1, OC7: 0, OC8: 0, OC9: 1, OC10: 0, OC11: 0 } },
  { id: 'h2', name: 'Riley', role: 'R2', startDate: '2026-01-12', leftOn: null, steps: all({ OC3: 1, OC8: 1 }) },
  { id: 'h3', name: 'Jade', role: 'R3', startDate: '2026-04-06', leftOn: '2026-06-19', steps: { OC1: 2, OC2: 1, OC3: 0, OC7: 1, OC9: 0 } },
  { id: 'h4', name: 'Casey', role: 'R3', startDate: '2026-07-13', leftOn: null, steps: all({ OC14: 8 }) },
  { id: 'h5', name: 'Lily', role: 'R4', startDate: '2026-09-21', leftOn: null, steps: { OC1: 2, OC2: 2, OC3: 1, OC4: 2, OC5: 2, OC6: 2 } },
];
const AUDIT: PolicyAudit = { id: 'a1', auditedOn: '2026-03-24', reason: 'incident', answers: { CP1: 2, CP2: 1, CP3: 1, CP4: 0, CP5: 2, CP6: 1, CP7: 0, CP8: 1, CP9: 1, CP10: 2, CP11: 2, CP12: 1, CP13: 1, CP14: 2, CP15: 2 } };

describe('practice vitals', () => {
  const m = vitalsMetrics(VITALS, EXITS, HIRES, TODAY)!;

  it('counts trailing-12-month turnover over the mean of five quarter-end headcounts', () => {
    expect(m.window).toEqual({ from: '2025-10-01', to: '2026-09-30' });
    expect(m.headcounts).toEqual([22, 22, 21, 20, 21]);
    expect(m.turnover).toMatchObject({ count: 6, voluntary: 5, involuntary: 1, uncoded: 0 });
    expect(m.turnover.rate).toBeCloseTo(6 / 21.2);
  });

  it('flags a quarter whose headcount does not equal last quarter plus hires minus exits', () => {
    const r = reconcile(VITALS, EXITS);
    expect(r.map((x) => x.checked && x.ok)).toEqual([false, true, true, true, false]);
    expect(r[4]).toMatchObject({ checked: true, ok: false, expected: 20, entered: 21 });
  });

  it('counts early exits among hires who reached day 90 in the last 12 months', () => {
    expect(m.earlyExit).toEqual({ left: 2, of: 4 });
    expect(m.firstYearExit).toEqual({ left: 0, of: 0 });
  });

  it('reports open positions, vacancy and after-hours load per clinical FTE', () => {
    expect(m.open).toMatchObject({ count: 2, longestDays: 242, medianDays: 210.5 });
    expect(m.open.vacancy).toBeCloseTo(2 / 23);
    expect(m.afterHours.now).toBeCloseTo(96 / (14 * 0.9) / 3);
    expect(vitalsMetrics([], [], [], TODAY)).toBeNull();
  });

  it('works out quarter dates', () => {
    expect(quarterEnd('2026-Q1')).toBe('2026-03-31');
    expect(quarterEnd('2026-Q4')).toBe('2026-12-31');
    expect(lastEndedQuarter('2026-10-30')).toBe('2026-Q3');
    expect(lastEndedQuarter('2027-02-01')).toBe('2026-Q4');
  });
});

describe('exit records', () => {
  it('shares reasons by area across voluntary exits, counting main and other reasons once each', () => {
    const e = exitMetrics(EXITS, { from: '2025-10-01', to: '2026-09-30' });
    expect(e).toMatchObject({ voluntary: 5, countsOnly: false, top: 'CR', cultureAddressable: 4 });
    expect(e.named.CR).toBe(3);
    expect(e.main.CR).toBe(1);
  });

  it('shows counts only under five voluntary exits, and lists records still to code', () => {
    const e = exitMetrics([...EXITS.slice(0, 3), exit('x9', '2026-10-24', 'R4', null, null, null)], { from: '2025-10-01', to: '2026-10-31' });
    expect(e.countsOnly).toBe(true);
    expect(e.toCode.map((x) => x.id)).toEqual(['x9']);
  });

  it('bands tenure at exit', () => {
    expect(tenureBand(EXITS[1])).toBe('Under 90 days');
    expect(tenureBand(EXITS[0])).toBe('3+ years');
    expect(tenureBand(exit('y', '2026-01-01', 'R1', null, 1, '01'))).toBe('Not known');
  });
});

describe('onboarding checklist', () => {
  it('scores completion over recorded steps, leaving out "does not apply"', () => {
    expect(completion(HIRES[3].steps)).toBe(100);
    expect(completion({ OC1: 2, OC2: 1, OC3: 0, OC4: 8 })).toBeCloseTo(50);
    expect(completion({})).toBeNull();
  });

  it('marks a missed critical step and an overdue checkpoint', () => {
    expect(criticalMissed(HIRES[0])).toEqual(['OC1', 'OC7']);
    const cp = checkpoint(HIRES[4], 30, TODAY);
    expect(cp).toMatchObject({ due: '2026-10-21', missing: 5, overdue: true, criticalOpen: true });
    expect(checkpoint(HIRES[4], 0, TODAY).missing).toBe(0);
  });

  it('compares day-90 retention for hires above and below 80% completion', () => {
    const o = onboardingMetrics(HIRES, TODAY);
    expect(o.high).toEqual({ of: 2, stayed: 2 });
    expect(o.low).toEqual({ of: 2, stayed: 0 });
  });
});

describe('client-conduct audit', () => {
  it('rescales the training question and lists every "No" as a gap', () => {
    const a = auditScore(AUDIT);
    const sum = 2 + 1 + 1 + 0 + 2 + 1 + 0 + 2 / 3 + 1 + 2 + 2 + 1 + 1 + 2 + 2;
    expect(a.readiness).toBeCloseTo((sum / 30) * 100);
    expect(a.gaps.map((g) => g.id)).toEqual(['CP4', 'CP7']);
    expect(a.elements.find((e) => e.element === 'Training')).toMatchObject({ items: ['CP8', 'CP9'], max: 4 });
    expect(a.nextYearly).toBe('2027-03-24');
  });
});

describe('due items and stay-interview triggers', () => {
  it('lists overdue onboarding, uncoded exits and the reconciliation flag, overdue first', () => {
    const due = dueItems({ vitals: VITALS, exits: [...EXITS, exit('x9', '2026-10-24', 'R4', null, null, null)], hires: HIRES, audits: [AUDIT] }, TODAY);
    expect(due[0]).toMatchObject({ tool: 'onboarding', overdue: true });
    expect(due.map((x) => x.key)).toEqual(expect.arrayContaining(['recon-2026-Q3', 'exit-x9', 'oc-h5-30']));
    expect(due.some((x) => x.tool === 'safety')).toBe(false);
  });

  it('suggests stay interviews for long openings, repeated exits in a role and hires at day 60–90', () => {
    const t = stayTriggers({ vitals: VITALS, exits: EXITS, hires: HIRES }, TODAY);
    expect(t.some((x) => x.startsWith('Credentialed technician opening has been open 242 days'))).toBe(true);
    expect(t.some((x) => x.startsWith('2 veterinary assistant exits'))).toBe(true);
  });
});

describe('owner-tool validation', () => {
  it('requires the exit count to be confirmed and caps numbers', () => {
    expect(() => cleanVitals({ quarter: '2026-Q3' })).toThrow(/Confirm the exit count/);
    expect(() => cleanVitals({ quarter: '2026-Q5', exitsConfirmed: true })).toThrow(ValidationError);
    const v = cleanVitals({ quarter: '2026-Q3', exitsConfirmed: true, headcount: { R1: '4', R9: 3 }, fte: { R1: 3.66 }, openPositions: [{ role: 'R2', since: '2026-03-02' }], notTracked: true });
    expect(v).toMatchObject({ headcount: { R1: 4 }, fte: { R1: 3.7 }, after_hours_shifts: null, overtime_hours: null });
  });

  it('accepts an exit with just a date and role, and rejects future dates and unknown reasons', () => {
    expect(cleanExit({ lastDay: '2026-10-24', role: 'R4' }, TODAY)).toMatchObject({ main_reason: null, coded_at: null });
    expect(() => cleanExit({ lastDay: '2026-11-24', role: 'R4' }, TODAY)).toThrow(/future/);
    expect(() => cleanExit({ lastDay: '2026-10-24', role: 'R4', mainReason: '55' }, TODAY)).toThrow(ValidationError);
    const c = cleanExit({ lastDay: '2026-10-24', role: 'R4', initiatedBy: 1, mainReason: '02', otherReasons: ['02', '09'] }, TODAY);
    expect(c.other_reasons).toEqual(['09']);
    expect(c.coded_at).not.toBeNull();
  });

  it('checks step codes, audit answers and stay themes', () => {
    expect(cleanHirePatch({ steps: { OC1: 2, OC2: '' } })).toEqual({ steps: { OC1: 2, OC2: null } });
    expect(() => cleanHirePatch({ steps: { OC1: 3 } })).toThrow(ValidationError);
    expect(() => cleanAudit({ answers: { CP1: 2 } }, TODAY)).toThrow(ValidationError);
    expect(cleanAudit({ answers: AUDIT.answers }, TODAY).answers.CP8).toBe(1);
    expect(() => cleanAudit({ answers: { ...AUDIT.answers, CP1: 3 } }, TODAY)).toThrow(ValidationError);
    expect(cleanStay({ trigger: 'new_hire', themes: ['TC', 'TC', 'XX'] }, TODAY)).toMatchObject({ themes: ['TC'] });
    expect(() => cleanStay({ trigger: 'new_hire', themes: [] }, TODAY)).toThrow(/at least one theme/);
  });
});

describe('signals', () => {
  const people = (n: number, f: (i: number) => Record<string, number>): StoredResponse[] => Array.from({ length: n }, (_, i) => ({ answers: f(i), demographics: {} }));
  // Compensation lowest, workload second lowest, half looking to leave, few know how to report.
  const staff = people(8, (i) => ({
    TC2: 5, TC3: 5, WR1: 3, WR3: 3, FL1: 4, FL2: 4, TE1: 5, PM1: 6, GD1: 4, ES1: 5, ES4: 3, CR1: 2, CR2: 2, CR3: 2,
    IL1: i < 4 ? 5 : 1, IL2: 4, OI1: 4, OI2: 3, OI3: 5, OI4: 2, CA1: 1, CA2: 0, CA3: i < 2 ? 5 : 2, CA4: i < 2 ? 1 : 3,
  }));
  const R = buildResults(V22, staff);
  const vm = vitalsMetrics(VITALS, EXITS, HIRES, TODAY);
  const s = signals({ vitals: vm, exits: exitMetrics(EXITS, vm!.window), onboarding: onboardingMetrics(HIRES, TODAY), audit: AUDIT, survey: R, pilot: R });
  const by = Object.fromEntries(s.map((x) => [x.key, x]));

  it('pairs each owner record with the matching staff result', () => {
    expect(Object.keys(by).sort()).toEqual(['afterhours-wr', 'checkin', 'exits-area', 'onboarding', 'reporting', 'turnover-intent']);
    expect(by['turnover-intent'].kind).toBe('corroborated');      // 28% turnover, 50% looking
    expect(by['exits-area'].kind).toBe('corroborated');           // top exit area CR is the lowest survey area
    expect(by.reporting.kind).toBe('diverges');                   // written route, 25% of staff know it
    expect(by.checkin.kind).toBe('diverges');                     // audit says within a day, 25% of staff agree
    expect(by.onboarding.kind).toBe('diverges');                  // 3.5 integration, completion under 80%
  });

  it('gives nothing without a survey that has 5+ responses', () => {
    const none = signals({ vitals: vm, exits: exitMetrics(EXITS, vm!.window), onboarding: onboardingMetrics(HIRES, TODAY), audit: AUDIT, survey: null, pilot: null });
    expect(none).toEqual([]);
  });
});

describe('owner-tool tables', () => {
  it('apply on Postgres with row level security and the spec’s code lists', async () => {
    const db = await freshDb();
    const clinic = (await db.query<{ id: string }>(`insert into clinics (name) values ('Pine Hollow') returning id`)).rows[0].id;
    await db.query(`insert into practice_vitals (clinic_id, quarter, headcount) values ($1, '2026-Q3', '{"R1":4}')`, [clinic]);
    await expect(db.query(`insert into practice_vitals (clinic_id, quarter) values ($1, '2026-Q3')`, [clinic])).rejects.toThrow();   // one row per quarter
    await expect(db.query(`insert into practice_vitals (clinic_id, quarter) values ($1, '2026-Q5')`, [clinic])).rejects.toThrow();
    await db.query(`insert into exit_records (clinic_id, last_day, role) values ($1, '2026-10-24', 'R4')`, [clinic]);
    await expect(db.query(`insert into exit_records (clinic_id, last_day, role, main_reason) values ($1, '2026-10-24', 'R4', '55')`, [clinic])).rejects.toThrow();
    await expect(db.query(`insert into exit_records (clinic_id, last_day, role, other_reasons) values ($1, '2026-10-24', 'R4', '{01,02,03}')`, [clinic])).rejects.toThrow();
    await expect(db.query(`insert into stay_interview_themes (clinic_id, held_on, trigger, themes) values ($1, '2026-10-01', 'other', '{XX}')`, [clinic])).rejects.toThrow();
    const rls = await db.query<{ relname: string; relrowsecurity: boolean }>(
      `select relname, relrowsecurity from pg_class where relname in ('practice_vitals','exit_records','new_hires','policy_audits','stay_interview_themes') order by relname`);
    expect(rls.rows.every((r) => r.relrowsecurity)).toBe(true);
    expect(rls.rows).toHaveLength(5);
  });
});
