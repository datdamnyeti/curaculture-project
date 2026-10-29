// Sends survey links and reports counts by channel. Failures are reported by
// count; the owner never sees which person a link went to or failed for.
import { inviteEmail, inviteText, sendEmail, sendText } from './notify';
import type { PreparedInvitation } from './surveyService';
import { surveyUrl } from './tokens';

export interface DeliveryReport {
  sent: { email: number; text: number };
  failed: number;
  simulated: boolean;
}

export async function deliver(
  invitations: PreparedInvitation[],
  opts: { clinicName: string; intro: 'researcher' | 'selfserve'; closesOn: string; reminder?: boolean },
): Promise<DeliveryReport> {
  const report: DeliveryReport = { sent: { email: 0, text: 0 }, failed: 0, simulated: false };
  const closes = new Date(`${opts.closesOn}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  for (const inv of invitations) {
    const url = surveyUrl(inv.token);
    const r = inv.channel === 'email'
      ? await (async () => { const m = inviteEmail({ firstName: inv.recipient.name.split(' ')[0], clinicName: opts.clinicName, url, closesOn: closes, intro: opts.intro, reminder: opts.reminder }); return sendEmail(inv.recipient.email!, m.subject, m.text); })()
      : await sendText(inv.recipient.phone!, inviteText({ clinicName: opts.clinicName, url, reminder: opts.reminder }));
    if (r.ok) report.sent[inv.channel] += 1; else report.failed += 1;
    if (r.simulated) report.simulated = true;
  }
  return report;
}
