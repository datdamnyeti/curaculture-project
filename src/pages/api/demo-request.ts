// Public: the landing page's "Book a demo" form. Stores the request and
// emails the team (logged instead when email keys are not set).
import { api } from '@/lib/server/http';
import { supabaseAdmin } from '@/lib/server/supabaseAdmin';
import { sendEmail } from '@/lib/server/notify';
import { cleanDemoRequest } from '@/lib/demoRequest';

export default api({
  async POST(req, res) {
    const r = cleanDemoRequest(req.body);
    if (!r) { res.status(201).json({ ok: true }); return; }   // bot: look successful, store nothing
    const { error } = await supabaseAdmin().from('demo_requests')
      .insert({ name: r.name, email: r.email, clinic: r.clinic, team_size: r.teamSize });
    if (error) throw error;
    const to = process.env.DEMO_NOTIFY_EMAIL;
    if (to) {
      await sendEmail(to, `Demo request: ${r.clinic}`,
        `${r.name} <${r.email}>\nClinic: ${r.clinic}\nTeam size: ${r.teamSize ?? 'not given'}`);
    }
    res.status(201).json({ ok: true });
  },
});
