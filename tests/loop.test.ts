// The full survey link loop against a real Postgres (PGlite), running the
// same SQL functions production calls through supabase.rpc.
import { beforeEach, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { freshDb, pgRpc } from './db';
import {
  campaignCounts, campaignResults, Conflict, createCampaign, loadSurvey, NotFound, saveDraft, submitSurvey,
} from '../src/lib/server/surveyService';
import { hashToken, tokenFor } from '../src/lib/server/tokens';
import type { Rpc } from '../src/lib/server/supabaseAdmin';

const SECRET = 'test-secret-test-secret-test-secret-1234';
const future = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);

let db: PGlite;
let rpc: Rpc;
let clinicId: string;
let staff: { employeeId: string; name: string; email: string | null; phone: string | null }[];

beforeEach(async () => {
  db = await freshDb();
  rpc = pgRpc(db);
  clinicId = (await db.query<{ id: string }>(`insert into clinics (name) values ('Pine Hollow') returning id`)).rows[0].id;
  staff = [];
  for (let i = 0; i < 8; i++) {
    const email = i < 6 ? `p${i}@clinic.example` : null;
    const phone = i === 6 ? '(406) 555-0100' : null;          // person 7 has no contact at all
    const r = await db.query<{ id: string }>(
      `insert into employees (clinic_id, name, email, phone, role_code) values ($1, $2, $3, $4, 3) returning id`,
      [clinicId, `Person ${i}`, email, phone],
    );
    staff.push({ employeeId: r.rows[0].id, name: `Person ${i}`, email, phone });
  }
});

async function launch() {
  return createCampaign(rpc, { clinicId, name: 'Baseline', closesOn: future, createdBy: null, recipients: staff, secret: SECRET });
}

describe('creating a survey', () => {
  it('invites reachable people by email or text and reports anyone with neither', async () => {
    const c = await launch();
    expect(c.invitations).toHaveLength(7);
    expect(c.invitations.filter((i) => i.channel === 'text')).toHaveLength(1);
    expect(c.unreachable.map((u) => u.name)).toEqual(['Person 7']);
    const counts = await campaignCounts(rpc, c.campaignId);
    expect(counts).toMatchObject({ total: 7, notStarted: 7, complete: 0, byChannel: { email: 6, text: 1 } });
  });

  it('stores only token hashes, never the tokens', async () => {
    const c = await launch();
    const rows = (await db.query<{ token_hash: string }>('select token_hash from invitations')).rows.map((r) => r.token_hash);
    for (const inv of c.invitations) {
      expect(rows).toContain(hashToken(inv.token));
      expect(rows).not.toContain(inv.token);
      expect(inv.token).toBe(tokenFor(inv.invitationId, SECRET)); // rebuildable for reminders
    }
  });

  it('refuses fewer than five recipients', async () => {
    await expect(createCampaign(rpc, { clinicId, name: 'Tiny', closesOn: future, createdBy: null, recipients: staff.slice(0, 4), secret: SECRET }))
      .rejects.toThrow(/too_few_recipients/);
  });

  it('refuses employees from another clinic', async () => {
    const other = (await db.query<{ id: string }>(`insert into clinics (name) values ('Other') returning id`)).rows[0].id;
    await expect(createCampaign(rpc, { clinicId: other, name: 'X', closesOn: future, createdBy: null, recipients: staff, secret: SECRET }))
      .rejects.toThrow(/employee_not_in_clinic/);
  });
});

describe('taking the survey', () => {
  it('rejects malformed and unknown links without touching other data', async () => {
    expect(await loadSurvey(rpc, 'nope')).toEqual({ state: 'not_found' });
    expect(await loadSurvey(rpc, 'A'.repeat(43))).toEqual({ state: 'not_found' });
  });

  it('saves a draft against the link and resumes it', async () => {
    const { invitations } = await launch();
    const t = invitations[0].token;
    expect((await loadSurvey(rpc, t)).state).toBe('ready');
    await saveDraft(rpc, t, { page: 4, answers: { TC2: 5 }, demographics: { D1: 3 } });
    const s = await loadSurvey(rpc, t);
    expect(s.state === 'ready' && s.draft).toMatchObject({ page: 4, answers: { TC2: 5 }, demographics: { D1: 3 } });
    expect((await campaignCounts(rpc, (await launchedCampaign()).id)).inProgress).toBe(1);
  });

  it('writes the response with no link to the invitation, then marks the link used', async () => {
    const { invitations } = await launch();
    const t = invitations[0].token;
    await saveDraft(rpc, t, { page: 2, answers: { TC2: 5 } });
    await submitSurvey(rpc, t, { answers: { TC2: 6, TC1: 2 }, demographics: { D1: 4 }, openEnded: { OE1: 'More techs' } });

    const resp = (await db.query<Record<string, unknown>>('select * from responses')).rows;
    expect(resp).toHaveLength(1);
    expect(Object.keys(resp[0]).sort()).toEqual(['answers', 'campaign_id', 'clinic_id', 'demographics', 'id', 'instrument_version', 'open_ended']);
    expect(JSON.stringify(resp[0])).not.toContain(hashToken(t));
    expect(resp[0].open_ended).toEqual({ OE1: { text: 'More techs', status: 'pending' } });

    const inv = (await db.query<{ status: string; draft: unknown }>('select status, draft from invitations where token_hash = $1', [hashToken(t)])).rows[0];
    expect(inv).toEqual({ status: 'complete', draft: null });
    expect(await loadSurvey(rpc, t)).toEqual({ state: 'complete', clinicName: 'Pine Hollow' });
  });

  it('accepts a link only once', async () => {
    const { invitations } = await launch();
    const t = invitations[0].token;
    await submitSurvey(rpc, t, { answers: { TC2: 6 } });
    await expect(submitSurvey(rpc, t, { answers: { TC2: 1 } })).rejects.toBeInstanceOf(Conflict);
    await expect(saveDraft(rpc, t, { answers: { TC2: 1 } })).rejects.toBeInstanceOf(Conflict);
    expect((await db.query('select 1 from responses')).rows).toHaveLength(1);
  });

  it('rejects invalid answers before anything is written', async () => {
    const { invitations } = await launch();
    await expect(submitSurvey(rpc, invitations[0].token, { answers: { TC2: 9 } })).rejects.toThrow(/Invalid answer/);
    expect((await db.query('select 1 from responses')).rows).toHaveLength(0);
  });

  it('closes links when the survey is closed', async () => {
    const { invitations, campaignId } = await launch();
    await db.query(`update campaigns set status = 'closed' where id = $1`, [campaignId]);
    expect(await loadSurvey(rpc, invitations[0].token)).toEqual({ state: 'closed', clinicName: 'Pine Hollow' });
    await expect(submitSurvey(rpc, invitations[0].token, {})).rejects.toBeInstanceOf(Conflict);
  });

  it('treats an unknown link as not found on submit', async () => {
    await expect(submitSurvey(rpc, 'B'.repeat(43), {})).rejects.toBeInstanceOf(NotFound);
  });
});

describe('results', () => {
  it('shows only the count until five people respond, then full results', async () => {
    const { invitations, campaignId } = await launch();
    for (const inv of invitations.slice(0, 4)) await submitSurvey(rpc, inv.token, { answers: { CR1: 2, TC2: 5 }, demographics: { D1: 3 } });
    expect(await campaignResults(rpc, campaignId, 'v2.1')).toEqual({ version: 'v2.1', n: 4, suppressed: true });
    expect((await db.query('select * from cc_campaign_responses($1, 5)', [campaignId])).rows).toHaveLength(0);

    await submitSurvey(rpc, invitations[4].token, { answers: { CR1: 4, TC2: 6 }, demographics: { D1: 3 } });
    const r = await campaignResults(rpc, campaignId, 'v2.1');
    expect(r.suppressed).toBe(false);
    expect(r.n).toBe(5);
    expect(r.areas!.find((a) => a.id === 'CR')!.mean).toBeCloseTo(2.4);
    expect(r.breakdowns!.find((b) => b.key === 'role')!.shown).toBe(false); // nobody in "everyone else"
  });

  it('will not lower the minimum below five', async () => {
    const { campaignId } = await launch();
    await expect(db.query('select * from cc_campaign_responses($1, 3)', [campaignId])).rejects.toThrow(/minimum_is_five/);
  });
});

describe('schema guarantees', () => {
  it('has no foreign key or column linking responses to invitations or people', async () => {
    const cols = (await db.query<{ column_name: string }>(`select column_name from information_schema.columns where table_name = 'responses'`)).rows.map((r) => r.column_name);
    for (const banned of ['token', 'token_hash', 'invitation_id', 'employee_id', 'created_at', 'submitted_at']) expect(cols).not.toContain(banned);
    const fks = (await db.query<{ ref: string }>(`
      select ccu.table_name as ref from information_schema.table_constraints tc
      join information_schema.constraint_column_usage ccu on ccu.constraint_name = tc.constraint_name
      where tc.table_name = 'responses' and tc.constraint_type = 'FOREIGN KEY'`)).rows.map((r) => r.ref).sort();
    expect(fks).toEqual(['campaigns', 'clinics']);
  });

  it('keeps invitations and responses closed to signed-in users', async () => {
    const uid = (await db.query<{ id: string }>(`insert into auth.users (email) values ('owner@x.example') returning id`)).rows[0].id;
    await db.query(`insert into clinic_members (clinic_id, user_id, role) values ($1, $2, 'owner')`, [clinicId, uid]);
    const { invitations } = await launch();
    for (const inv of invitations.slice(0, 5)) await submitSurvey(rpc, inv.token, { answers: { TC2: 5 } });
    await db.exec(`grant usage on schema public, auth to authenticated; grant select on all tables in schema public to authenticated; grant execute on function auth.uid() to authenticated;`);
    await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${uid}', false);`);
    expect((await db.query('select * from responses')).rows).toHaveLength(0);
    expect((await db.query('select * from invitations')).rows).toHaveLength(0);
    expect((await db.query('select * from employees')).rows).toHaveLength(8);   // own clinic's roster is visible
    await expect(db.query(`select * from cc_campaign_responses(gen_random_uuid(), 5)`)).rejects.toThrow(/permission denied/);
    await db.exec('reset role');
  });
});

async function launchedCampaign() {
  return (await db.query<{ id: string }>('select id from campaigns limit 1')).rows[0];
}
