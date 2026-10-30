// Loads a clinic's owner-tool records and works out metrics, due items and
// signals. Staff survey results come in only through campaignResults, which
// returns nothing below 5 responses.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Rpc } from './supabaseAdmin';
import { campaignResults } from './surveyService';
import type { Results } from '../scoring';
import {
  dueItems, exitMetrics, onboardingMetrics, stayTriggers, vitalsMetrics, auditScore,
  ExitRecord, NewHire, PolicyAudit, StayTheme, Vitals,
} from '../practice/metrics';
import { signals } from '../practice/signals';

type Row = Record<string, unknown>;
const toVitals = (r: Row): Vitals => ({
  quarter: r.quarter as string, headcount: r.headcount as Vitals['headcount'], fte: r.fte as Vitals['fte'], hires: r.hires as Vitals['hires'],
  exitsConfirmed: r.exits_confirmed as boolean, openPositions: r.open_positions as Vitals['openPositions'],
  afterHoursShifts: r.after_hours_shifts as number | null, overtimeHours: r.overtime_hours as number | null, updatedAt: r.updated_at as string,
});
const toExit = (r: Row): ExitRecord => ({
  id: r.id as string, lastDay: r.last_day as string, role: r.role as ExitRecord['role'], startedMonth: r.started_month as string | null,
  initiatedBy: r.initiated_by as number | null, mainReason: r.main_reason as string | null, otherReasons: (r.other_reasons as string[]) ?? [],
  destination: r.destination as number | null, reasonSource: r.reason_source as number | null, wouldRehire: r.would_rehire as number | null,
  codedAt: r.coded_at as string | null,
});
const toHire = (r: Row): NewHire => ({ id: r.id as string, name: r.name as string, role: r.role as NewHire['role'], startDate: r.start_date as string, leftOn: r.left_on as string | null, steps: (r.steps as Record<string, number>) ?? {} });
const toAudit = (r: Row): PolicyAudit => ({ id: r.id as string, auditedOn: r.audited_on as string, reason: r.reason as PolicyAudit['reason'], answers: r.answers as Record<string, number> });
const toStay = (r: Row): StayTheme => ({ id: r.id as string, heldOn: r.held_on as string, trigger: r.trigger as string, themes: r.themes as StayTheme['themes'] });

async function rows(db: SupabaseClient, table: string, clinicId: string, order: string) {
  const { data, error } = await db.from(table).select('*').eq('clinic_id', clinicId).order(order);
  if (error) throw error;
  return (data || []) as Row[];
}

/** Latest survey with results to show, and latest v2.2-pilot survey with results. */
async function latestResults(db: SupabaseClient, rpc: Rpc, clinicId: string): Promise<{ survey: Results | null; pilot: Results | null; surveyName: string | null; pilotName: string | null }> {
  const { data, error } = await db.from('campaigns').select('id, name, instrument_version').eq('clinic_id', clinicId).eq('kind', 'full').order('created_at', { ascending: false });
  if (error) throw error;
  let survey: Results | null = null, pilot: Results | null = null, surveyName: string | null = null, pilotName: string | null = null;
  for (const c of data || []) {
    if (survey && (pilot || c.instrument_version !== 'v2.2-pilot')) continue;
    const r = await campaignResults(rpc, c.id, c.instrument_version);
    if (r.suppressed) continue;
    if (!survey) { survey = r; surveyName = c.name; }
    if (!pilot && r.pilot) { pilot = r; pilotName = c.name; }
    if (survey && pilot) break;
  }
  return { survey, pilot, surveyName, pilotName };
}

export async function practiceOverview(db: SupabaseClient, rpc: Rpc, clinicId: string, today = new Date().toISOString().slice(0, 10)) {
  const [v, x, h, a, s] = await Promise.all([
    rows(db, 'practice_vitals', clinicId, 'quarter'), rows(db, 'exit_records', clinicId, 'last_day'),
    rows(db, 'new_hires', clinicId, 'start_date'), rows(db, 'policy_audits', clinicId, 'audited_on'),
    rows(db, 'stay_interview_themes', clinicId, 'held_on'),
  ]);
  const vitals = v.map(toVitals), exits = x.map(toExit), hires = h.map(toHire), audits = a.map(toAudit), stay = s.map(toStay);
  const vm = vitalsMetrics(vitals, exits, hires, today);
  const window = vm?.window ?? { from: new Date(Date.parse(today) - 365 * 864e5).toISOString().slice(0, 10), to: today };
  const em = exitMetrics(exits, window);
  const om = onboardingMetrics(hires, today);
  const lastAudit = audits[audits.length - 1] ?? null;
  const res = await latestResults(db, rpc, clinicId);
  return {
    today, vitals, exits, hires, audits, stay,
    metrics: { vitals: vm, exits: em, onboarding: om, audit: lastAudit ? { ...auditScore(lastAudit), auditedOn: lastAudit.auditedOn, reason: lastAudit.reason, answers: lastAudit.answers } : null },
    due: dueItems({ vitals, exits, hires, audits }, today),
    stayTriggers: stayTriggers({ vitals, exits, hires }, today),
    signals: signals({ vitals: vm, exits: em, onboarding: om, audit: lastAudit, survey: res.survey, pilot: res.pilot }),
    staff: res.pilot ? { name: res.pilotName, knowHowToReport: res.pilot.pilot!.aggression.knowHowToReport.agree, checkIn: res.pilot.pilot!.aggression.checkIn, threatsBand: res.pilot.pilot!.aggression.threatsBand } : null,
  };
}

export type PracticeOverview = Awaited<ReturnType<typeof practiceOverview>>;
