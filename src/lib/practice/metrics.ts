// Calculations for the v2.2 owner tools. Pure functions: every one takes
// "today" so results are testable. Owner records describe the clinic, so the
// 5-response rule does not apply, but counts always lead and rates come second.
import type { AreaId } from '../instrument';
import { fmtDate } from '../format';
import {
  CHECKPOINT_DAYS, CLINICAL_ROLES, EXIT_REASON, ONBOARDING_STEPS, POLICY_ELEMENTS, POLICY_ITEMS, ROLES, RoleCode,
} from './registry';

export type ByRole = Partial<Record<RoleCode, number>>;
export interface Vitals {
  quarter: string;
  headcount: ByRole; fte: ByRole; hires: ByRole;
  exitsConfirmed: boolean;
  openPositions: { role: RoleCode; since: string }[];
  afterHoursShifts: number | null; overtimeHours: number | null;
  updatedAt?: string;
}
export interface ExitRecord {
  id: string; lastDay: string; role: RoleCode;
  startedMonth: string | null; initiatedBy: number | null; mainReason: string | null; otherReasons: string[];
  destination: number | null; reasonSource: number | null; wouldRehire: number | null; codedAt: string | null;
}
export interface NewHire { id: string; name: string; role: RoleCode; startDate: string; leftOn: string | null; steps: Record<string, number> }
export interface PolicyAudit { id: string; auditedOn: string; reason: 'yearly' | 'incident'; answers: Record<string, number> }
export interface StayTheme { id: string; heldOn: string; trigger: string; themes: AreaId[] }

// ---------------------------------------------------------------- dates
export const addDays = (d: string, n: number) => {
  const x = new Date(`${d}T12:00:00Z`); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10);
};
export const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 864e5);
const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
const median = (xs: number[]) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const total = (o: ByRole) => Object.values(o).reduce<number>((s, x) => s + (Number(x) || 0), 0);

export const quarterStart = (q: string) => { const [y, k] = q.split('-Q').map(Number); return `${y}-${String((k - 1) * 3 + 1).padStart(2, '0')}-01`; };
export const quarterEnd = (q: string) => { const [y, k] = q.split('-Q').map(Number); return addDays(k === 4 ? `${y + 1}-01-01` : `${y}-${String(k * 3 + 1).padStart(2, '0')}-01`, -1); };
export const nextQuarter = (q: string) => { let [y, k] = q.split('-Q').map(Number); k += 1; if (k > 4) { k = 1; y += 1; } return `${y}-Q${k}`; };
/** The most recent quarter that has ended. */
export const lastEndedQuarter = (today: string) => { const y = +today.slice(0, 4), m = +today.slice(5, 7), k = Math.floor((m - 1) / 3); return k === 0 ? `${y - 1}-Q4` : `${y}-Q${k}`; };

// ---------------------------------------------------------------- vitals (VT1–VT6)
const sortV = (v: Vitals[]) => [...v].sort((a, b) => a.quarter.localeCompare(b.quarter));
export const exitsInQuarter = (exits: ExitRecord[], q: string) => exits.filter((x) => x.lastDay >= quarterStart(q) && x.lastDay <= quarterEnd(q));
export const isVoluntary = (x: ExitRecord) => x.initiatedBy === 1 || x.initiatedBy === 4;
export const isCoded = (x: ExitRecord) => x.initiatedBy != null && x.mainReason != null;

/** Headcount should equal last quarter's, plus hires, minus exits. */
export function reconcile(vitals: Vitals[], exits: ExitRecord[]) {
  const V = sortV(vitals);
  return V.map((v, i) => {
    if (i === 0) return { quarter: v.quarter, checked: false as const };
    const expected = total(V[i - 1].headcount) + total(v.hires) - exitsInQuarter(exits, v.quarter).length;
    const entered = total(v.headcount);
    return { quarter: v.quarter, checked: true as const, ok: expected === entered, expected, entered };
  });
}

export const afterHoursPerFte = (v: Vitals) => {
  const fte = CLINICAL_ROLES.reduce((s, r) => s + (Number(v.fte[r]) || 0), 0);
  return v.afterHoursShifts == null || !fte ? null : v.afterHoursShifts / fte / 3;
};

export function vitalsMetrics(vitals: Vitals[], exits: ExitRecord[], hires: NewHire[], today: string) {
  const V = sortV(vitals);
  if (!V.length) return null;
  const last = V[V.length - 1];
  const last4 = V.slice(-4), last5 = V.slice(-5);
  const window = { from: quarterStart(last4[0].quarter), to: quarterEnd(last.quarter) };
  const separations = exits.filter((x) => x.lastDay >= window.from && x.lastDay <= window.to);
  const avgHeadcount = mean(last5.map((v) => total(v.headcount)))!;
  const reached = (h: NewHire, d: number, lookback: number) => { const at = addDays(h.startDate, d); return at <= today && at >= addDays(today, -lookback); };
  const early = hires.filter((h) => reached(h, 90, 365));
  const firstYear = hires.filter((h) => reached(h, 365, 730));
  const days = last.openPositions.map((o) => daysBetween(o.since, today));
  const series = V.map((v) => ({ quarter: v.quarter, perFte: afterHoursPerFte(v) }));
  const prior = series.slice(-5, -1).map((x) => x.perFte).filter((x): x is number => x != null);
  return {
    last, window, avgHeadcount, headcounts: last5.map((v) => total(v.headcount)),
    turnover: {
      count: separations.length, rate: avgHeadcount ? separations.length / avgHeadcount : 0,
      voluntary: separations.filter(isVoluntary).length, involuntary: separations.filter((x) => x.initiatedBy === 2 || x.initiatedBy === 3).length,
      uncoded: separations.filter((x) => x.initiatedBy == null).length,
    },
    earlyExit: { left: early.filter((h) => h.leftOn && h.leftOn < addDays(h.startDate, 90)).length, of: early.length },
    firstYearExit: { left: firstYear.filter((h) => h.leftOn && h.leftOn < addDays(h.startDate, 365)).length, of: firstYear.length },
    open: {
      count: last.openPositions.length, medianDays: median(days), longestDays: days.length ? Math.max(...days) : null,
      vacancy: (total(last.headcount) + last.openPositions.length) ? last.openPositions.length / (total(last.headcount) + last.openPositions.length) : 0,
      byRole: ROLES.map((r) => { const k = last.openPositions.filter((o) => o.role === r.code).length, hc = Number(last.headcount[r.code]) || 0; return { role: r.code, open: k, rate: hc + k ? k / (hc + k) : 0 }; }).filter((x) => x.open),
    },
    afterHours: { series, now: series[series.length - 1].perFte, priorMean: mean(prior) },
    reconciliation: reconcile(V, exits),
  };
}

// ---------------------------------------------------------------- exits (XR1–XR9)
export function exitMetrics(exits: ExitRecord[], window: { from: string; to: string }) {
  const vol = exits.filter((x) => isCoded(x) && isVoluntary(x) && x.lastDay >= window.from && x.lastDay <= window.to);
  const main: Partial<Record<AreaId, number>> = {}, named: Partial<Record<AreaId, number>> = {};
  for (const x of vol) {
    const m = EXIT_REASON[x.mainReason!]?.area; if (m) main[m] = (main[m] || 0) + 1;
    new Set([x.mainReason!, ...x.otherReasons].map((c) => EXIT_REASON[c]?.area).filter(Boolean) as AreaId[])
      .forEach((a) => { named[a] = (named[a] || 0) + 1; });
  }
  const areas = Object.keys(named) as AreaId[];
  const top = areas.sort((a, b) => (named[b]! - named[a]!) || ((main[b] || 0) - (main[a] || 0)))[0] ?? null;
  return {
    voluntary: vol.length, countsOnly: vol.length < 5, main, named, top,
    cultureAddressable: vol.filter((x) => EXIT_REASON[x.mainReason!]?.area).length,
    toCode: exits.filter((x) => !isCoded(x)),
  };
}

export function tenureBand(x: ExitRecord): string {
  if (!x.startedMonth) return 'Not known';
  const d = daysBetween(x.startedMonth, x.lastDay);
  return d < 90 ? 'Under 90 days' : d < 365 ? '90 days to 1 year' : d < 1095 ? '1–3 years' : '3+ years';
}

// ---------------------------------------------------------------- onboarding (OC1–OC14)
/** Sum of codes ÷ (2 × applicable steps) × 100. "Does not apply" and unrecorded steps are left out. */
export function completion(steps: Record<string, number>): number | null {
  const v = ONBOARDING_STEPS.map((s) => steps[s.id]).filter((x) => x != null && x !== 8) as number[];
  return v.length ? (v.reduce((s, x) => s + x, 0) / (2 * v.length)) * 100 : null;
}
export const criticalMissed = (h: NewHire) => ONBOARDING_STEPS.filter((s) => s.critical && h.steps[s.id] === 0).map((s) => s.id);

export function checkpoint(h: NewHire, day: number, today: string) {
  const steps = ONBOARDING_STEPS.filter((s) => s.day === day);
  const due = addDays(h.startDate, day);
  const missing = steps.filter((s) => h.steps[s.id] == null);
  const open = !h.leftOn && missing.length > 0;
  return {
    day, due, steps, missing: missing.length,
    overdue: open && today > addDays(due, 7),
    dueSoon: open && due <= addDays(today, 14),
    criticalOpen: missing.some((s) => s.critical),
  };
}

export function onboardingMetrics(hires: NewHire[], today: string) {
  const at90 = hires.filter((h) => addDays(h.startDate, 90) <= today && completion(h.steps) != null);
  const stayed = (h: NewHire) => !h.leftOn || h.leftOn >= addDays(h.startDate, 90);
  const hi = at90.filter((h) => completion(h.steps)! >= 80), lo = at90.filter((h) => completion(h.steps)! < 80);
  const recent = hires.filter((h) => h.startDate >= addDays(today, -365) && completion(h.steps) != null);
  return {
    high: { of: hi.length, stayed: hi.filter(stayed).length },
    low: { of: lo.length, stayed: lo.filter(stayed).length },
    meanRecent: mean(recent.map((h) => completion(h.steps)!)), recentCount: recent.length,
    active: hires.filter((h) => !h.leftOn && addDays(h.startDate, 120) >= today),
  };
}

// ---------------------------------------------------------------- client-conduct audit (CP1–CP15)
/** CP8 has four options (0–3), rescaled to 0–2 so every item weighs the same. */
const points = (id: string, v: number) => (id === 'CP8' ? (v * 2) / 3 : v);
export function auditScore(a: PolicyAudit) {
  const answered = POLICY_ITEMS.filter((p) => a.answers[p.id] != null);
  const sum = answered.reduce((s, p) => s + points(p.id, a.answers[p.id]), 0);
  return {
    readiness: answered.length ? (sum / (2 * answered.length)) * 100 : null,
    elements: POLICY_ELEMENTS.map((el) => {
      const its = answered.filter((p) => p.element === el);
      const got = its.reduce((s, p) => s + points(p.id, a.answers[p.id]), 0);
      return { element: el, items: its.map((p) => p.id), points: got, max: 2 * its.length };
    }),
    gaps: POLICY_ITEMS.filter((p) => a.answers[p.id] === 0),
    nextYearly: addDays(a.auditedOn, 365),
  };
}

// ---------------------------------------------------------------- what is due
export interface DueItem { key: string; tool: 'vitals' | 'exits' | 'onboarding' | 'safety'; title: string; detail: string; due: string; overdue: boolean; badge?: string }

export function dueItems(d: { vitals: Vitals[]; exits: ExitRecord[]; hires: NewHire[]; audits: PolicyAudit[] }, today: string): DueItem[] {
  const out: DueItem[] = [];
  const soon = addDays(today, 14);
  const lq = lastEndedQuarter(today), vDue = addDays(quarterEnd(lq), 15);
  if (d.vitals.length && !d.vitals.some((v) => v.quarter === lq)) {
    out.push({ key: `vitals-${lq}`, tool: 'vitals', title: `Enter practice vitals for ${lq}`, detail: 'About 10 minutes.', due: vDue, overdue: today > vDue });
  }
  const rec = reconcile(d.vitals, d.exits).filter((r) => r.checked && !r.ok).pop();
  if (rec && rec.checked) out.push({ key: `recon-${rec.quarter}`, tool: 'vitals', title: `${rec.quarter} vitals don’t add up`, detail: `${rec.entered} on payroll, but last quarter plus hires minus exits is ${rec.expected}. A hire or an exit is probably missing.`, due: today, overdue: false, badge: 'Check' });
  for (const x of d.exits.filter((e) => !isCoded(e))) {
    const due = addDays(x.lastDay, 14);
    out.push({ key: `exit-${x.id}`, tool: 'exits', title: `Code the exit on ${fmtDate(x.lastDay)}`, detail: 'About 2 minutes, while the reasons are fresh.', due, overdue: today > due });
  }
  for (const h of d.hires.filter((x) => !x.leftOn)) {
    for (const day of CHECKPOINT_DAYS) {
      const cp = checkpoint(h, day, today);
      if (cp.dueSoon) out.push({ key: `oc-${h.id}-${day}`, tool: 'onboarding', title: `${h.name}: day ${day} onboarding checkpoint`, detail: `${cp.missing} of ${cp.steps.length} steps not recorded${cp.criticalOpen ? ', including a critical step' : ''}.`, due: cp.due, overdue: cp.overdue });
    }
  }
  const lastAudit = [...d.audits].sort((a, b) => a.auditedOn.localeCompare(b.auditedOn)).pop();
  if (lastAudit && addDays(lastAudit.auditedOn, 365) <= soon) {
    const due = addDays(lastAudit.auditedOn, 365);
    out.push({ key: 'audit-yearly', tool: 'safety', title: 'Yearly client-conduct policy audit', detail: 'Fifteen questions.', due, overdue: today > due });
  }
  return out.sort((a, b) => Number(b.overdue) - Number(a.overdue) || a.due.localeCompare(b.due));
}

/** When a stay interview fits, per the spec's triggers. */
export function stayTriggers(d: { vitals: Vitals[]; exits: ExitRecord[]; hires: NewHire[] }, today: string): string[] {
  const out: string[] = [];
  const last = sortV(d.vitals).pop();
  for (const o of last?.openPositions ?? []) {
    const days = daysBetween(o.since, today);
    if (days > 90) out.push(`${ROLES.find((r) => r.code === o.role)!.label} opening has been open ${days} days: talk with the people covering it.`);
  }
  const yearAgo = addDays(today, -365), byRole: Record<string, number> = {};
  d.exits.filter((x) => x.lastDay >= yearAgo).forEach((x) => { byRole[x.role] = (byRole[x.role] || 0) + 1; });
  for (const [r, k] of Object.entries(byRole)) if (k >= 2) out.push(`${k} ${ROLES.find((x) => x.code === r)!.label.toLowerCase()} exits in 12 months: talk with the people in that role who are still here.`);
  for (const h of d.hires.filter((x) => !x.leftOn)) {
    const day = daysBetween(h.startDate, today);
    if (day >= 45 && day <= 90) out.push(`${h.name} is at day ${day}: a stay interview fits at day 60–90.`);
  }
  return out;
}
