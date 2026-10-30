// Staff survey endpoint. No login: the link is the credential.
// GET loads the survey state and any saved draft; PUT saves a draft;
// POST submits. Responses never record the token.
import { api } from '@/lib/server/http';
import { rpc } from '@/lib/server/supabaseAdmin';
import { loadSurvey, saveDraft, submitSurvey } from '@/lib/server/surveyService';

export default api({
  async GET(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.json(await loadSurvey(rpc, req.query.token));
  },
  async PUT(req, res) {
    await saveDraft(rpc, req.query.token, req.body);
    res.json({ ok: true });
  },
  async POST(req, res) {
    await submitSurvey(rpc, req.query.token, req.body);
    res.json({ ok: true });
  },
});
