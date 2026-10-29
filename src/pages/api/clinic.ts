// GET the signed-in user's clinic; POST to create one (the user becomes owner);
// PATCH clinic facts and survey settings (admins only).
import { api, ADMIN_ROLES, HttpError, requireClinic, requireUser } from '@/lib/server/http';
import { supabaseAdmin } from '@/lib/server/supabaseAdmin';

const text = (v: unknown, max = 120) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
const size = (v: unknown) => (v === '' || v == null ? null : Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : undefined);

export default api({
  async GET(req, res) {
    const user = await requireUser(req);
    const { data: m } = await supabaseAdmin().from('clinic_members').select('clinic_id, role').eq('user_id', user.id).order('created_at').limit(1);
    if (!m || !m.length) { res.json({ clinic: null }); return; }
    const { data: clinic, error } = await supabaseAdmin().from('clinics').select('*').eq('id', m[0].clinic_id).single();
    if (error) throw error;
    res.json({ clinic, role: m[0].role });
  },

  async POST(req, res) {
    const user = await requireUser(req);
    const { data: existing } = await supabaseAdmin().from('clinic_members').select('clinic_id').eq('user_id', user.id).limit(1);
    if (existing && existing.length) throw new HttpError(409, 'You already belong to a clinic.');
    const name = text(req.body?.name);
    const teamSize = size(req.body?.teamSize);
    if (!name) throw new HttpError(400, 'Add your clinic’s name.');
    if (teamSize === undefined) throw new HttpError(400, 'Team size must be a whole number.');
    const { data: clinic, error } = await supabaseAdmin().from('clinics').insert({
      name, team_size: teamSize, clinic_type: text(req.body?.clinicType), ownership: text(req.body?.ownership), hours: text(req.body?.hours),
    }).select().single();
    if (error) throw error;
    const { error: e2 } = await supabaseAdmin().from('clinic_members').insert({ clinic_id: clinic.id, user_id: user.id, role: 'owner' });
    if (e2) throw e2;
    res.status(201).json({ clinic, role: 'owner' });
  },

  async PATCH(req, res) {
    const user = await requireUser(req);
    const { clinicId } = await requireClinic(user.id, ADMIN_ROLES);
    const b = req.body || {};
    const patch: Record<string, unknown> = {};
    if ('name' in b) { const n = text(b.name); if (!n) throw new HttpError(400, 'Clinic name can’t be empty.'); patch.name = n; }
    if ('teamSize' in b) { const s = size(b.teamSize); if (s === undefined) throw new HttpError(400, 'Team size must be a whole number.'); patch.team_size = s; }
    for (const [k, col] of [['clinicType', 'clinic_type'], ['ownership', 'ownership'], ['hours', 'hours']] as const) if (k in b) patch[col] = text(b[k]);
    if ('surveyIntro' in b) {
      if (!['researcher', 'selfserve'].includes(b.surveyIntro)) throw new HttpError(400, 'Unknown survey setting.');
      patch.survey_intro = b.surveyIntro;
      // Self-serve promises "your clinic never sees individual answers", so owners can't see written answers.
      if (b.surveyIntro === 'selfserve') patch.open_ended_mode = 'hidden';
    }
    if ('openEndedMode' in b) {
      if (!['screened', 'hidden'].includes(b.openEndedMode)) throw new HttpError(400, 'Unknown survey setting.');
      if (b.openEndedMode === 'screened' && (patch.survey_intro ?? null) === 'selfserve') throw new HttpError(400, 'Self-serve clinics can’t show written answers to owners.');
      patch.open_ended_mode = b.openEndedMode;
    }
    const { data, error } = await supabaseAdmin().from('clinics').update(patch).eq('id', clinicId).select().single();
    if (error) throw error;
    if (data.survey_intro === 'selfserve' && data.open_ended_mode === 'screened') {
      await supabaseAdmin().from('clinics').update({ open_ended_mode: 'hidden' }).eq('id', clinicId);
      data.open_ended_mode = 'hidden';
    }
    res.json({ clinic: data });
  },
});
