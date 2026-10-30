// Delivery of survey links by email (Resend) and text message (Twilio).
// Without provider keys, messages are logged instead of sent so the loop can
// be run locally; the API reports them as simulated.

export interface SendResult {
  ok: boolean;
  simulated: boolean;
  error?: string;
}

export async function sendEmail(to: string, subject: string, text: string): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    console.info(`[email simulated] to=${to} subject=${subject}\n${text}`);
    return { ok: true, simulated: true };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, text }),
    });
    if (!res.ok) return { ok: false, simulated: false, error: `Email provider returned ${res.status}` };
    return { ok: true, simulated: false };
  } catch (e) {
    return { ok: false, simulated: false, error: e instanceof Error ? e.message : 'Email failed' };
  }
}

export async function sendText(to: string, body: string): Promise<SendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) {
    console.info(`[text simulated] to=${to}\n${body}`);
    return { ok: true, simulated: true };
  }
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
    });
    if (!res.ok) return { ok: false, simulated: false, error: `Text provider returned ${res.status}` };
    return { ok: true, simulated: false };
  } catch (e) {
    return { ok: false, simulated: false, error: e instanceof Error ? e.message : 'Text failed' };
  }
}

export function inviteEmail(opts: { firstName: string; clinicName: string; url: string; closesOn: string; intro: 'researcher' | 'selfserve'; reminder?: boolean }) {
  const promise = opts.intro === 'researcher'
    ? 'The survey is run by an independent researcher, not by clinic management.'
    : 'It runs through CuraCulture, an independent platform; your clinic never sees individual answers.';
  const subject = `${opts.reminder ? 'Reminder: ' : ''}${opts.clinicName}: how does work feel here? (10–12 min, confidential)`;
  const text = [
    `Hi ${opts.firstName},`,
    '',
    `${opts.clinicName} is asking everyone how work feels here. It takes about 10–12 minutes, every question is optional, and you can stop and come back with the same link.`,
    '',
    opts.url,
    '',
    `${promise} Results are reported only for groups of five or more. The survey closes ${opts.closesOn}.`,
    '',
    'This link is yours alone. Please don’t forward it.',
  ].join('\n');
  return { subject, text };
}

export function inviteText(opts: { clinicName: string; url: string; reminder?: boolean }) {
  return `${opts.reminder ? 'Reminder from ' : ''}${opts.clinicName}: how does work feel here? 10–12 min, confidential; results only for groups of 5+. Your one-time link: ${opts.url} Reply STOP to opt out.`;
}
