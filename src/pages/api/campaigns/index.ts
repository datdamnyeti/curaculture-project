// List surveys with completion counts; create a survey and send its links.
import { api, ADMIN_ROLES, HttpError, requireClinic, requireUser } from '@/lib/server/http';
import { rpc, supabaseAdmin } from '@/lib/server/supabaseAdmin';
import { campaignCounts, createCampaign, Recipient } from '@/lib/server/surveyService';
import { deliver } from '@/lib/server/deliver';

export default api({
  async GET(req, res) {
    const user = await requireUser(req);
    const { clinicId } = await requireClinic(user.id);
    const { data, error } = await supabaseAdmin().from('campaigns').select('id, name, instrument_version, kind, status, opens_on, closes_on')
      .eq('clinic_id', clinicId).order('created_at', { ascending: false });
    if (error) throw error;
    const withCounts = await Promise.all((data || []).map(async (c) => ({ ...c, counts: await campaignCounts(rpc, c.id) })));
    res.json({ campaigns: withCounts });
  },

  async POST(req, res) {
    const user = await requireUser(req);
    const { clinicId } = await requireClinic(user.id, ADMIN_ROLES);
    const name = typeof req.body?.name === 'string' && req.body.name.trim() ? req.body.name.trim().slice(0, 120) : null;
    const closesOn = typeof req.body?.closesOn === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.body.closesOn) ? req.body.closesOn : null;
    const ids: unknown = req.body?.employeeIds;
    if (!name) throw new HttpError(400, 'Name the survey.');
    if (!closesOn || closesOn < new Date().toISOString().slice(0, 10)) throw new HttpError(400, 'Pick a closing date that hasn’t passed.');
    if (!Array.isArray(ids) || ids.some((x) => typeof x !== 'string')) throw new HttpError(400, 'Choose who gets the survey.');

    const { data: emps, error } = await supabaseAdmin().from('employees').select('id, name, email, phone')
      .eq('clinic_id', clinicId).eq('active', true).in('id', ids as string[]);
    if (error) throw error;
    const recipients: Recipient[] = (emps || []).map((e) => ({ employeeId: e.id, name: e.name, email: e.email, phone: e.phone }));
    const reachable = recipients.filter((r) => r.email || r.phone);
    if (reachable.length < 5) throw new HttpError(400, 'Choose at least 5 people with an email or mobile number, so results can be shown.');

    const created = await createCampaign(rpc, { clinicId, name, closesOn, createdBy: user.id, recipients });
    const { data: clinic } = await supabaseAdmin().from('clinics').select('name, survey_intro').eq('id', clinicId).single();
    const report = await deliver(created.invitations, { clinicName: clinic!.name, intro: clinic!.survey_intro, closesOn });
    res.status(201).json({ campaignId: created.campaignId, ...report, unreachable: created.unreachable.map((u) => u.name) });
  },
});
