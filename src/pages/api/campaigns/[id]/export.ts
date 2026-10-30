// Item-level CSV: raw codes keyed by item id, plus instrument version and
// campaign id, so results pool with the Qualtrics clinics. Five-response rule applies.
import { api, ADMIN_ROLES, HttpError, requireCampaign, requireClinic, requireUser } from '@/lib/server/http';
import { rpc } from '@/lib/server/supabaseAdmin';
import { getInstrument } from '@/lib/instrument';
import { exportCsv, StoredResponse } from '@/lib/scoring';

export default api({
  async GET(req, res) {
    const user = await requireUser(req);
    const { clinicId, role } = await requireClinic(user.id, [...ADMIN_ROLES, 'researcher']);
    const c = await requireCampaign(clinicId, req.query.id);
    const rows = (await rpc<StoredResponse[]>('cc_campaign_responses', { p_campaign: c.id, p_min: 5 })) || [];
    if (rows.length < 5) throw new HttpError(409, 'Export is available once a survey has 5 or more responses.');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="curaculture-${c.id}.csv"`);
    // Threat counts (CA2) and the incident follow-up (CA4) stay out of owner exports.
    res.send(exportCsv(getInstrument(c.instrument_version), c.id, rows, { researcher: role === 'researcher' }));
  },
});
