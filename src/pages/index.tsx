// Public landing page (design J): the pathway from understanding to change.
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Wordmark } from '@/components/brand/Logo';
import { TEAM_SIZES } from '@/lib/demoRequest';

const TOOLS = ['Culture assessment', '90-day pulse', 'New-hire integration', 'Exit insights', 'Practice vitals', 'Client safety'];

const STAGES = [
  { name: 'Measure', when: 'Done · Weeks 1–2', detail: '19 of 22 responded', state: 'done' },
  { name: 'Plan', when: 'Done · Weeks 3–4', detail: '2 priorities, 1 strength to protect', state: 'done' },
  { name: 'Change', when: 'In progress · Month 2', detail: '4 of 7 actions done', state: 'now' },
  { name: 'Sustain', when: 'Next · Pulse in 34 days', detail: 'Re-survey in month 9', state: 'next' },
] as const;

const TASKS = [
  { text: 'Share the results with the whole team', who: 'Owner', done: true },
  { text: 'Explain in writing how pay and raises are decided', who: 'Owner', done: true },
  { text: 'Monthly “what we said, what we did” at the staff meeting', who: 'Manager', tag: 'Moderate evidence' },
  { text: 'Leaders’ course: following through on commitments', who: 'Leads', tag: 'Training', accent: true },
];

export default function Home() {
  return (
    <>
      <Head>
        <title>CuraCulture · Find out what to fix first, and whether it worked</title>
        <meta name="description" content="Measurement tools built for veterinary teams, a pathway-to-change plan built for your clinic, and the training to carry it out." />
      </Head>
      <div className="bg-white">
        <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
            <Link href="/" aria-label="CuraCulture home"><Wordmark /></Link>
            <nav aria-label="Main" className="hidden items-center gap-1 text-sm font-medium text-slate-600 md:flex">
              {[['#pathway', 'Pathway'], ['#product', 'Product'], ['#product', 'Training'], ['#privacy', 'Privacy']].map(([h, l]) => (
                <a key={l} href={h} className="rounded-lg px-3 py-2 hover:bg-canvas hover:text-brand-ink">{l}</a>
              ))}
            </nav>
            <div className="flex items-center gap-2 text-sm">
              <Link href="/login" className="rounded-lg px-3 py-2 font-medium hover:bg-canvas">Sign in</Link>
              <a href="#demo" className="btn btn-ink">Book a demo</a>
            </div>
          </div>
        </header>

        <main>
          <section className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 pb-14 pt-16 text-center sm:pt-24">
            <a href="#product" className="inline-flex items-center gap-2 rounded-full border border-line py-1 pl-1.5 pr-3 text-[13px] font-medium">
              <span className="rounded-full bg-brand-soft px-2 py-0.5 font-semibold text-brand">New</span>Onboarding, exit and client-safety tools →
            </a>
            <h1 className="text-[2.6rem] leading-[1.02] tracking-display sm:text-6xl lg:text-7xl">Find out what to fix first, and whether it worked.</h1>
            <p className="max-w-2xl text-lg text-slate-600 sm:text-xl">Measurement tools built for veterinary teams, a pathway-to-change plan built for your clinic, and the training to carry it out.</p>
            <div className="flex flex-wrap justify-center gap-2.5">
              <a href="#demo" className="btn btn-primary px-5 py-3 text-base">Book a demo</a>
              <a href="#pathway" className="btn px-5 py-3 text-base">See how it works</a>
            </div>
          </section>

          <section id="pathway" aria-label="The pathway, as it looks in the app" className="mx-auto max-w-6xl scroll-mt-20 px-6 pb-24">
            <div className="rounded-2xl border border-line bg-canvas p-2.5">
              <div className="overflow-hidden rounded-[10px] border border-line bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3.5">
                  <b className="text-[15px]">Pathway to change · Pine Hollow Veterinary Clinic</b>
                  <span className="text-sm text-slate-500">Sample clinic · Year 1</span>
                </div>
                <ol className="grid grid-cols-2 border-b border-line lg:grid-cols-4">
                  {STAGES.map((s, i) => (
                    <li key={s.name} className={`flex flex-col gap-1 px-5 py-4 ${i % 2 ? 'border-l' : ''} ${i > 1 ? 'border-t lg:border-t-0' : ''} ${i === 2 ? 'lg:border-l' : ''} border-line ${s.state === 'now' ? 'bg-brand-soft' : ''}`}>
                      <span className={`flex items-center gap-2 text-[13px] ${s.state === 'now' ? 'font-medium text-brand' : 'text-slate-500'}`}><StageIcon state={s.state} />{s.when}</span>
                      <b className="text-[17px] tracking-tight">{s.name}</b>
                      <span className="text-sm text-slate-600">{s.detail}</span>
                    </li>
                  ))}
                </ol>
                <div className="flex flex-wrap">
                  <div className="flex min-w-0 flex-[2_1_440px] flex-col border-b border-line px-5 py-4 lg:border-b-0 lg:border-r">
                    <span className="mb-1.5 text-[13px] text-slate-500">Priority 1 · Fairness &amp; Leadership</span>
                    {TASKS.map((t) => (
                      <div key={t.text} className="flex items-center gap-3 border-t border-slate-100 py-2.5 text-[15px]">
                        <Check done={!!t.done} />
                        <span className={`flex-1 ${t.done ? 'text-slate-500 line-through' : ''}`}>{t.text}</span>
                        {t.tag && <span className={`hidden whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium sm:inline ${t.accent ? 'bg-brand-soft text-brand' : 'bg-slate-100'}`}>{t.tag}</span>}
                        <span className="text-[13px] text-slate-500">{t.who}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-[1_1_240px] flex-col gap-2 bg-canvas px-5 py-4">
                    <span className="text-[13px] text-slate-500">Coming up</span>
                    <b className="text-[15px] tracking-tight">90-day pulse</b>
                    <span className="text-sm text-slate-600">Two minutes for staff. Asks only about the items this plan set out to move.</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="product" className="mx-auto flex max-w-6xl scroll-mt-20 flex-col gap-9 px-6 pb-24">
            <h2 className="max-w-3xl text-3xl leading-tight tracking-display sm:text-[2.6rem]">Everything a clinic needs to go from understanding to change.</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <Tile title="Six measurement tools" body="Each answers part of one question: why people stay, and why they leave.">
                <div className="flex flex-wrap gap-1.5">{TOOLS.map((t) => <span key={t} className="rounded-full border border-line px-2.5 py-1 text-[13px]">{t}</span>)}</div>
              </Tile>
              <Tile title="A plan built with you" body="We turn your results into a custom pathway-to-change plan: one or two priorities, one strength to protect, owners and dates. Every action shows how strong its evidence is." />
              <Tile title="Training that follows the plan" body="Short courses for leaders and teams, matched to your priorities: leading fairly, bringing new people in well, handling difficult clients, workload and recovery." />
              <div id="privacy" className="flex scroll-mt-20 flex-col gap-3 rounded-2xl bg-brand-ink p-7 text-white">
                <b className="flex items-center gap-2 text-lg tracking-tight"><LockIcon />Anonymous by design</b>
                <p className="text-[15px] text-slate-300">Answers are never linked to names. Nothing shows for fewer than five people. Managers see how many finished, never who.</p>
                <Link href="/privacy" className="text-sm font-medium underline underline-offset-4">How staff answers are protected →</Link>
              </div>
            </div>
          </section>

          <section id="demo" className="scroll-mt-20 border-t border-line bg-canvas">
            <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2">
              <div className="flex flex-col gap-3">
                <h2 className="text-3xl leading-tight tracking-display sm:text-[2.6rem]">See the pathway for your clinic.</h2>
                <p className="text-slate-600">A 20-minute walkthrough with one of the founders: a survey scientist and a veterinarian.</p>
              </div>
              <DemoForm />
            </div>
          </section>
        </main>

        <footer className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-slate-500">
          <p className="rounded-lg border border-dashed border-line bg-white px-4 py-3 text-slate-700"><b>Taking a survey?</b> Use the link in your email or text. You don’t need an account, and your clinic never sees your individual answers.</p>
          <div className="flex flex-wrap justify-between gap-3"><span>© {new Date().getFullYear()} CuraCulture</span>
            <span className="flex gap-5"><Link href="/privacy">Staff privacy</Link><Link href="/login">Sign in</Link></span></div>
        </footer>
      </div>
    </>
  );
}

function DemoForm() {
  const [f, setF] = useState({ name: '', email: '', clinic: '', teamSize: 'Under 10', website: '' });
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [err, setErr] = useState('');
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setState('busy');
    try {
      const res = await fetch('/api/demo-request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error || 'We couldn’t send that. Try again in a minute.'); }
      setState('done');
    } catch (x) { setErr((x as Error).message); setState('idle'); }
  }

  if (state === 'done') {
    return <div className="card flex flex-col gap-2"><h3 className="text-lg">Thanks, {f.name.split(' ')[0]}.</h3><p className="text-slate-600">We’ll reply by email to find a time for a 20-minute walkthrough for {f.clinic}.</p></div>;
  }
  return (
    <form onSubmit={submit} className="card flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field"><span>Your name</span><input className="input" value={f.name} onChange={set('name')} autoComplete="name" required /></label>
        <label className="field"><span>Work email</span><input className="input" type="email" value={f.email} onChange={set('email')} autoComplete="email" required /></label>
        <label className="field"><span>Clinic or group</span><input className="input" value={f.clinic} onChange={set('clinic')} autoComplete="organization" required /></label>
        <label className="field"><span>Team size</span><select className="input" value={f.teamSize} onChange={set('teamSize')}>{TEAM_SIZES.map((s) => <option key={s}>{s}</option>)}</select></label>
      </div>
      {/* Left empty by people; bots fill it in. */}
      <label className="absolute -left-[9999px]" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} /></label>
      {err && <p role="alert" className="rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-900">{err}</p>}
      <div className="flex flex-wrap items-center gap-3"><button className="btn btn-primary px-5 py-3 text-base" disabled={state === 'busy'}>{state === 'busy' ? 'Sending…' : 'Book a demo'}</button><span className="text-sm text-slate-500">We reply by email.</span></div>
    </form>
  );
}

function Tile({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return <div className="flex flex-col gap-3 rounded-2xl border border-line p-7"><b className="text-lg tracking-tight">{title}</b><p className="text-[15px] text-slate-600">{body}</p>{children}</div>;
}

function StageIcon({ state }: { state: 'done' | 'now' | 'next' }) {
  if (state === 'done') return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="#1b6984" /><path d="M4.5 8.2l2.3 2.3 4.7-4.8" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (state === 'now') return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="none" stroke="#1b6984" strokeWidth="2.4" /><path d="M8 1.5a6.5 6.5 0 0 1 6.5 6.5" fill="none" stroke="#0b1418" strokeWidth="2.4" /></svg>;
  return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="none" stroke="#cbd2d6" strokeWidth="2" /></svg>;
}

function Check({ done }: { done: boolean }) {
  return done
    ? <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="flex-none"><rect x="1" y="1" width="16" height="16" rx="5" fill="#1b6984" /><path d="M5 9.2l2.6 2.6 5.4-5.5" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
    : <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="flex-none"><rect x="1.5" y="1.5" width="15" height="15" rx="4.5" fill="none" stroke="#cbd2d6" strokeWidth="1.5" /></svg>;
}

function LockIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>;
}
