// Validation for owner-tool records sent from the browser.
import { ValidationError } from '../validate';
import { EXIT_REASON, ONBOARDING_STEPS, POLICY_ITEMS, ROLE_CODES, RoleCode, STAY_TRIGGERS } from './registry';
import type { AreaId } from '../instrument';

const AREAS: AreaId[] = ['TC', 'WR', 'FL', 'TE', 'PM', 'GD', 'ES', 'CR'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const obj = (b: unknown) => (b && typeof b === 'object' ? b : {}) as Record<string, unknown>;
const date = (v: unknown, label: string, required = true): string | null => {
  if ((v == null || v === '') && !required) return null;
  if (typeof v !== 'string' || !DATE.test(v) || Number.isNaN(Date.parse(v))) throw new ValidationError(`Enter a valid date for ${label}.`);
  return v;
};
const role = (v: unknown): RoleCode => { if (!ROLE_CODES.includes(v as RoleCode)) throw new ValidationError('Choose a role.'); return v as RoleCode; };
const code = (v: unknown, allowed: number[], label: string, required = false): number | null => {
  if (v == null || v === '') { if (required) throw new ValidationError(`Answer “${label}”.`); return null; }
  const n = Number(v); if (!allowed.includes(n)) throw new ValidationError(`Check the answer for “${label}”.`); return n;
};
const count = (v: unknown, label: string, decimals = false) => {
  if (v == null || v === '') return 0;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > 10000 || (!decimals && !Number.isInteger(n))) throw new ValidationError(`Check the number for ${label}.`);
  return decimals ? Math.round(n * 10) / 10 : n;
};
const byRole = (v: unknown, label: string, decimals = false) => {
  const o = obj(v), out: Partial<Record<RoleCode, number>> = {};
  for (const r of ROLE_CODES) { const n = count(o[r], `${label} (${r})`, decimals); if (n) out[r] = n; }
  return out;
};

export function cleanVitals(b: unknown) {
  const x = obj(b);
  if (typeof x.quarter !== 'string' || !/^\d{4}-Q[1-4]$/.test(x.quarter)) throw new ValidationError('Choose a quarter.');
  if (x.exitsConfirmed !== true) throw new ValidationError('Confirm the exit count, or fix the exit records first.');
  const open = Array.isArray(x.openPositions) ? x.openPositions : [];
  if (open.length > 50) throw new ValidationError('List up to 50 open positions.');
  const notTracked = x.notTracked === true;
  return {
    quarter: x.quarter,
    headcount: byRole(x.headcount, 'headcount'), fte: byRole(x.fte, 'FTE', true), hires: byRole(x.hires, 'hires'),
    exits_confirmed: true,
    open_positions: open.map((o) => { const p = obj(o); return { role: role(p.role), since: date(p.since, 'recruiting since')! }; }),
    after_hours_shifts: notTracked ? null : count(x.afterHoursShifts, 'after-hours shifts'),
    overtime_hours: notTracked ? null : count(x.overtimeHours, 'overtime hours'),
  };
}

/** A new separation needs only the last day and role; reasons can be coded later. */
export function cleanExit(b: unknown, today: string) {
  const x = obj(b);
  const lastDay = date(x.lastDay, 'the last day worked')!;
  if (lastDay > today) throw new ValidationError('The last day worked can’t be in the future.');
  const started = date(x.startedMonth, 'the start month', false);
  if (started && started > lastDay) throw new ValidationError('The start date is after the last day worked.');
  const reasons = (v: unknown) => (typeof v === 'string' && EXIT_REASON[v] ? v : null);
  const main = x.mainReason == null || x.mainReason === '' ? null : reasons(x.mainReason);
  if (x.mainReason && !main) throw new ValidationError('Choose a main reason from the list.');
  const others = (Array.isArray(x.otherReasons) ? x.otherReasons : []).map(reasons).filter((c): c is string => !!c && c !== main);
  if (others.length > 2) throw new ValidationError('Pick up to two other reasons.');
  const initiated = code(x.initiatedBy, [1, 2, 3, 4], 'Who started the separation?');
  const coded = initiated != null && main != null;
  return {
    last_day: lastDay, role: role(x.role), started_month: started,
    initiated_by: initiated, main_reason: main, other_reasons: [...new Set(others)],
    destination: code(x.destination, [1, 2, 3, 4, 5, 9], 'Where did this person go?'),
    reason_source: code(x.reasonSource, [1, 2, 3, 9], 'How do you know the reason?'),
    would_rehire: code(x.wouldRehire, [1, 2, 3], 'Would you rehire this person?'),
    coded_at: coded ? new Date().toISOString() : null,
  };
}

export function cleanNewHire(b: unknown) {
  const x = obj(b);
  const name = typeof x.name === 'string' ? x.name.trim().slice(0, 120) : '';
  if (!name) throw new ValidationError('Enter the new hire’s name.');
  return { name, role: role(x.role), start_date: date(x.startDate, 'the start date')! };
}

/** Patch one hire: step statuses and/or the date they left. */
export function cleanHirePatch(b: unknown) {
  const x = obj(b), out: { steps?: Record<string, number | null>; left_on?: string | null } = {};
  if (x.steps) {
    const s = obj(x.steps), steps: Record<string, number | null> = {};
    for (const [k, v] of Object.entries(s)) {
      if (!ONBOARDING_STEPS.some((st) => st.id === k)) throw new ValidationError(`Unknown step ${k}.`);
      steps[k] = v == null || v === '' ? null : code(v, [0, 1, 2, 8], k);
    }
    out.steps = steps;
  }
  if ('leftOn' in x) out.left_on = date(x.leftOn, 'the date they left', false);
  return out;
}

export function cleanAudit(b: unknown, today: string) {
  const x = obj(b), a = obj(x.answers), answers: Record<string, number> = {};
  for (const p of POLICY_ITEMS) answers[p.id] = code(a[p.id], p.id === 'CP8' ? [0, 1, 2, 3] : [0, 1, 2], p.id, true)!;
  const reason = x.reason === 'incident' ? 'incident' : 'yearly';
  return { audited_on: today, reason, answers };
}

export function cleanStay(b: unknown, today: string) {
  const x = obj(b);
  const trigger = typeof x.trigger === 'string' && STAY_TRIGGERS[x.trigger] ? x.trigger : null;
  if (!trigger) throw new ValidationError('Choose what triggered the interview.');
  const themes = (Array.isArray(x.themes) ? x.themes : []).filter((t): t is AreaId => AREAS.includes(t as AreaId));
  if (!themes.length) throw new ValidationError('Tick at least one theme.');
  return { held_on: today, trigger, themes: [...new Set(themes)] };
}
