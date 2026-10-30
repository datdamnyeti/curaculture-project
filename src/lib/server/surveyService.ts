// The survey link loop, independent of the HTTP layer so it can be tested
// against a real Postgres. All persistence goes through the SQL functions in
// supabase/migrations, which enforce the order "write the response, then mark
// the invitation complete" inside one transaction.
import { getInstrument, CURRENT_VERSION, FIELDABLE } from '../instrument';
import { buildResults, Results, StoredResponse } from '../scoring';
import { cleanDraft, cleanSubmission } from '../validate';
import { hashToken, isWellFormed, newInvitationId, tokenFor } from './tokens';
import type { Rpc } from './supabaseAdmin';

export type Channel = 'email' | 'text';

export interface Recipient {
  employeeId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

export class NotFound extends Error {}
export class Conflict extends Error {}

export function channelFor(r: Pick<Recipient, 'email' | 'phone'>): Channel | null {
  if (r.email && r.email.trim()) return 'email';
  if (r.phone && r.phone.trim()) return 'text';
  return null;
}

// ------------------------------------------------------------- staff side

interface InvitationRow {
  status: 'not_started' | 'in_progress' | 'complete';
  draft: unknown;
  campaign_id: string;
  campaign_name: string;
  campaign_status: string;
  closes_on: string;
  instrument_version: string;
  kind: string;
  clinic_name: string;
  survey_intro: 'researcher' | 'selfserve';
  open_ended_mode: 'screened' | 'hidden';
  is_open: boolean;
}

export type SurveyState =
  | { state: 'not_found' }
  | { state: 'complete'; clinicName: string }
  | { state: 'closed'; clinicName: string }
  | {
      state: 'ready';
      clinicName: string;
      campaignName: string;
      closesOn: string;
      version: string;
      intro: 'researcher' | 'selfserve';
      draft: unknown;
    };

async function findInvitation(rpc: Rpc, token: unknown): Promise<InvitationRow | null> {
  if (!isWellFormed(token)) return null;
  const rows = await rpc<InvitationRow[]>('cc_get_invitation', { p_token_hash: hashToken(token) });
  return rows && rows.length ? rows[0] : null;
}

export async function loadSurvey(rpc: Rpc, token: unknown): Promise<SurveyState> {
  const inv = await findInvitation(rpc, token);
  if (!inv) return { state: 'not_found' };
  if (inv.status === 'complete') return { state: 'complete', clinicName: inv.clinic_name };
  if (!inv.is_open) return { state: 'closed', clinicName: inv.clinic_name };
  return {
    state: 'ready',
    clinicName: inv.clinic_name,
    campaignName: inv.campaign_name,
    closesOn: inv.closes_on,
    version: inv.instrument_version,
    intro: inv.survey_intro,
    draft: inv.draft,
  };
}

function mapDbError(e: unknown): never {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes('link_not_found')) throw new NotFound('link_not_found');
  if (msg.includes('already_complete')) throw new Conflict('already_complete');
  if (msg.includes('survey_closed')) throw new Conflict('survey_closed');
  throw e;
}

export async function saveDraft(rpc: Rpc, token: unknown, raw: unknown): Promise<void> {
  const inv = await findInvitation(rpc, token);
  if (!inv) throw new NotFound('link_not_found');
  const draft = cleanDraft(getInstrument(inv.instrument_version), raw);
  try {
    await rpc('cc_save_draft', { p_token_hash: hashToken(token as string), p_draft: draft });
  } catch (e) { mapDbError(e); }
}

export async function submitSurvey(rpc: Rpc, token: unknown, raw: unknown): Promise<void> {
  const inv = await findInvitation(rpc, token);
  if (!inv) throw new NotFound('link_not_found');
  const s = cleanSubmission(getInstrument(inv.instrument_version), raw);
  const open = Object.fromEntries(Object.entries(s.openEnded).map(([k, text]) => [k, { text, status: 'pending' }]));
  try {
    await rpc('cc_submit_response', {
      p_token_hash: hashToken(token as string),
      p_demographics: s.demographics,
      p_answers: s.answers,
      p_open_ended: open,
    });
  } catch (e) { mapDbError(e); }
}

// ------------------------------------------------------------- owner side

export interface PreparedInvitation {
  invitationId: string;
  employeeId: string;
  channel: Channel;
  token: string;
  recipient: Recipient;
}

export async function createCampaign(
  rpc: Rpc,
  args: { clinicId: string; name: string; closesOn: string; createdBy: string | null; recipients: Recipient[]; secret?: string; version?: string },
): Promise<{ campaignId: string; invitations: PreparedInvitation[]; unreachable: Recipient[] }> {
  const version = args.version ?? CURRENT_VERSION;
  if (!FIELDABLE.some((f) => f.version === version)) throw new Error(`Instrument ${version} can’t be sent`);
  const reachable: PreparedInvitation[] = [];
  const unreachable: Recipient[] = [];
  for (const r of args.recipients) {
    const channel = channelFor(r);
    if (!channel) { unreachable.push(r); continue; }
    const invitationId = newInvitationId();
    reachable.push({ invitationId, employeeId: r.employeeId, channel, token: tokenFor(invitationId, args.secret), recipient: r });
  }
  const campaignId = await rpc<string>('cc_create_campaign', {
    p_clinic: args.clinicId,
    p_name: args.name,
    p_version: version,
    p_kind: 'full',
    p_closes_on: args.closesOn,
    p_created_by: args.createdBy,
    p_invitation_ids: reachable.map((x) => x.invitationId),
    p_employee_ids: reachable.map((x) => x.employeeId),
    p_token_hashes: reachable.map((x) => hashToken(x.token)),
    p_channels: reachable.map((x) => x.channel),
  });
  return { campaignId, invitations: reachable, unreachable };
}

export interface Counts {
  total: number;
  complete: number;
  inProgress: number;
  notStarted: number;
  byChannel: Record<Channel, number>;
}

export async function campaignCounts(rpc: Rpc, campaignId: string): Promise<Counts> {
  const rows = await rpc<{ status: string; channel: Channel; n: number }[]>('cc_campaign_counts', { p_campaign: campaignId });
  const c: Counts = { total: 0, complete: 0, inProgress: 0, notStarted: 0, byChannel: { email: 0, text: 0 } };
  for (const r of rows || []) {
    c.total += r.n;
    c.byChannel[r.channel] += r.n;
    if (r.status === 'complete') c.complete += r.n;
    else if (r.status === 'in_progress') c.inProgress += r.n;
    else c.notStarted += r.n;
  }
  return c;
}

export async function campaignResults(rpc: Rpc, campaignId: string, version: string): Promise<Results> {
  const n = await rpc<number>('cc_response_count', { p_campaign: campaignId });
  const inst = getInstrument(version);
  if (n < 5) return { version, n, suppressed: true };
  const rows = await rpc<StoredResponse[]>('cc_campaign_responses', { p_campaign: campaignId, p_min: 5 });
  return buildResults(inst, rows || []);
}
