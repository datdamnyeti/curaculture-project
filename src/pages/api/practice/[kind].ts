// Writes for the owner tools. Admins only; every row is scoped to the caller's clinic.
//   POST   /api/practice/vitals   upsert one quarter
//   POST   /api/practice/exits    add a separation (reasons optional)
//   PATCH  /api/practice/exits?id code or correct it
//   DELETE /api/practice/exits?id remove a mistaken record
//   POST   /api/practice/hires    start a checklist
//   PATCH  /api/practice/hires?id step statuses and/or the date they left
//   DELETE /api/practice/hires?id
//   POST   /api/practice/audits   save a policy audit
//   POST   /api/practice/stay     log stay-interview themes
//   DELETE /api/practice/stay?id
import type { NextApiRequest } from 'next';
import { api, ADMIN_ROLES, HttpError, requireClinic, requireUser } from '@/lib/server/http';
import { supabaseAdmin } from '@/lib/server/supabaseAdmin';
import { cleanAudit, cleanExit, cleanHirePatch, cleanNewHire, cleanStay, cleanVitals } from '@/lib/practice/validate';

const TABLE: Record<string, string> = { vitals: 'practice_vitals', exits: 'exit_records', hires: 'new_hires', audits: 'policy_audits', stay: 'stay_interview_themes' };
const today = () => new Date().toISOString().slice(0, 10);

async function ctx(req: NextApiRequest) {
  const kind = String(req.query.kind || '');
  if (!TABLE[kind]) throw new HttpError(404, 'Unknown record type.');
  const user = await requireUser(req);
  const { clinicId } = await requireClinic(user.id, ADMIN_ROLES);
  return { kind, table: TABLE[kind], clinicId, userId: user.id, db: supabaseAdmin() };
}
const idOf = (req: NextApiRequest) => { const id = req.query.id; if (typeof id !== 'string' || !id) throw new HttpError(400, 'Missing record id.'); return id; };

export default api({
  async POST(req, res) {
    const { kind, table, clinicId, userId, db } = await ctx(req);
    let row: Record<string, unknown>;
    if (kind === 'vitals') {
      const v = cleanVitals(req.body);
      const { data, error } = await db.from(table).upsert({ ...v, clinic_id: clinicId, entered_by: userId, updated_at: new Date().toISOString() }, { onConflict: 'clinic_id,quarter' }).select().single();
      if (error) throw error;
      res.status(201).json({ record: data }); return;
    }
    if (kind === 'exits') row = cleanExit(req.body, today());
    else if (kind === 'hires') row = cleanNewHire(req.body);
    else if (kind === 'audits') row = cleanAudit(req.body, today());
    else row = cleanStay(req.body, today());
    const { data, error } = await db.from(table).insert({ ...row, clinic_id: clinicId }).select().single();
    if (error) throw error;
    res.status(201).json({ record: data });
  },

  async PATCH(req, res) {
    const { kind, table, clinicId, db } = await ctx(req);
    const id = idOf(req);
    let patch: Record<string, unknown>;
    if (kind === 'exits') patch = cleanExit(req.body, today());
    else if (kind === 'hires') {
      const p = cleanHirePatch(req.body);
      patch = {};
      if (p.steps) {
        const { data: cur, error } = await db.from(table).select('steps').eq('id', id).eq('clinic_id', clinicId).maybeSingle();
        if (error) throw error;
        if (!cur) throw new HttpError(404, 'Record not found.');
        const steps = { ...(cur.steps as Record<string, number>) };
        for (const [k, v] of Object.entries(p.steps)) { if (v == null) delete steps[k]; else steps[k] = v; }
        patch.steps = steps;
      }
      if ('left_on' in p) patch.left_on = p.left_on;
    } else throw new HttpError(405, 'These records can’t be edited. Add a new one instead.');
    const { data, error } = await db.from(table).update(patch).eq('id', id).eq('clinic_id', clinicId).select().maybeSingle();
    if (error) throw error;
    if (!data) throw new HttpError(404, 'Record not found.');
    res.json({ record: data });
  },

  async DELETE(req, res) {
    const { kind, table, clinicId, db } = await ctx(req);
    if (!['exits', 'hires', 'stay'].includes(kind)) throw new HttpError(405, 'These records can’t be deleted.');
    const { error } = await db.from(table).delete().eq('id', idOf(req)).eq('clinic_id', clinicId);
    if (error) throw error;
    res.status(204).end();
  },
});
