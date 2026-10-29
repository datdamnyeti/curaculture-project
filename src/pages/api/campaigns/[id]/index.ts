// One survey: completion counts (never names), results under the v2.1 rules,
// approved quotes; and actions: remind, close.
import { api, ADMIN_ROLES, HttpError, requireCampaign, requireClinic, requireUser } from '@/lib/server/http';
import { rpc, supabaseAdmin } from '@/lib/server/supabaseAdmin';
import { campaignCounts, campaignResults } from '@/lib/server/surveyService';
import { deliver } from '@/lib/server/deliver';
import { tokenFor } from '@/lib/server/tokens';

export default api({
  async GET(req, res) {
    const user = await requireUser(req);
    const { clinicId } = await requireClinic(user.id);
    const c = await requireCampaign(clinicId, req.query.id);
    const [counts, results, clinic] = await Promise.all([
      campaignCounts(rpc, c.id),
      campaignResults(rpc, c.id, c.instrument_version),
      supabaseAdmin().from('clinics').select('team_size, open_ended_mode').eq('id', clinicId).single(),
      ]);
    const { count: headcount } = await supabaseAdmin().from('employees').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId).eq('active', true);
    let quotes: { item_id: string; body: string }[] = [];
    if (!results.suppressed && clinic.data?.open_ended_mode === 'screened') {
      quotes = (await rpc<{ item_id: string; body: string }[]>('cc_approved_quotes', { p_campaign: c.id })) || [];
    }
    res.json({ campaign: c, counts, results, quotes, headcount: headcount ?? null, openEndedMode: clinic.data?.open_ended_mode });
  },

  async POST(req, res) {
    const user = await requireUser(req);
    const { clinicId } = await requireClinic(user.id, ADMIN_ROLES);
    const c = await requireCampaign(clinicId, req.query.id);
    const action = req.body?.action;

    if (action === 'close') {
      const db = supabaseAdmin();
      const { error } = await db.from('campaigns').update({ status: 'closed' }).eq('id', c.id);
      if (error) throw error;
      // Saved drafts are deleted when a survey closes.
      await db.from('invitations').update({ draft: null }).eq('campaign_id', c.id).neq('status', 'complete');
      res.json({ ok: true });
      return;
    }

    if (action === 'remind') {
      if (c.status !== 'active') throw new HttpError(409, 'This survey is closed.');
      const { data: open, error } = await supabaseAdmin().from('invitations')
        .select('id, employee_id, channel, reminders_sent, employees(name, email, phone)')
        .eq('campaign_id', c.id).neq('status', 'complete');
      if (error) throw error;
      const { data: clinic } = await supabaseAdmin().from('clinics').select('name, survey_intro').eq('id', clinicId).single();
      type Row = { id: string; employee_id: string; channel: 'email' | 'text'; reminders_sent: number; employees: { name: string; email: string | null; phone: string | null } | null };
      const rows = ((open || []) as unknown as Row[]).filter((r) => r.employees);
      const report = await deliver(rows.map((r) => ({
        invitationId: r.id, employeeId: r.employee_id, channel: r.channel, token: tokenFor(r.id),
        recipient: { employeeId: r.employee_id, name: r.employees!.name, email: r.employees!.email, phone: r.employees!.phone },
      })), { clinicName: clinic!.name, intro: clinic!.survey_intro, closesOn: c.closes_on, reminder: true });
      await Promise.all(rows.map((r) => supabaseAdmin().from('invitations').update({ reminders_sent: r.reminders_sent + 1 }).eq('id', r.id)));
      // Counts only: the owner never learns who hasn't finished.
      res.json(report);
      return;
    }

    throw new HttpError(400, 'Unknown action.');
  },
});
