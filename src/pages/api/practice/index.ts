// The Practice data overview: records, metrics, due items and signals.
import { api, requireClinic, requireUser } from '@/lib/server/http';
import { rpc, supabaseAdmin } from '@/lib/server/supabaseAdmin';
import { practiceOverview } from '@/lib/server/practiceService';

export default api({
  async GET(req, res) {
    const user = await requireUser(req);
    const { clinicId } = await requireClinic(user.id);
    res.json(await practiceOverview(supabaseAdmin(), rpc, clinicId));
  },
});
