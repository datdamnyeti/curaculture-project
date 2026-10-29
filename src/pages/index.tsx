// Public landing page.
import Head from 'next/head';
import Link from 'next/link';
import { Logo } from '@/components/layout/AppShell';

const steps = [
  ['Send', 'Add your team and send', 'Each person gets a single-use link by email or text. No accounts for staff.'],
  ['Answer', 'About 10 minutes on any phone', '41 questions across 8 areas, from workload and fairness to pay and ethical support. Every question optional; stop and resume anytime.'],
  ['See', 'Results you can act on', 'How answers spread in each area, intent to leave, and role comparisons once each group has five or more.'],
  ['Check', 'Survey again in 6–12 months', 'Every clinic answers the same questions in the same order, so change over time is real change.'],
];
const promises = [
  ['Staff never create accounts.', 'Each person gets a single-use link by email or text, and can stop and resume with it.'],
  ['Answers are stored apart from names.', 'The record of who finished and the record of what was said share no link.'],
  ['Groups of five or more.', 'No result is shown for fewer than five people. Under five responses, you see only the count.'],
  ['Owners see counts, not who is outstanding.', 'Reminders go out automatically.'],
];

export default function Home() {
  return (
    <>
      <Head><title>CuraCulture · Workplace culture for veterinary teams</title>
        <meta name="description" content="A confidential staff survey for veterinary clinics, with results you can act on." /></Head>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <span className="flex items-center gap-2 text-lg font-bold"><Logo />CuraCulture</span>
          <nav className="flex gap-2"><Link className="btn btn-ghost" href="/login">Sign in</Link><Link className="btn btn-primary" href="/login?mode=signup">Get started</Link></nav>
        </div>
      </header>
      <main>
        <section className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-14 sm:py-20">
          <p className="eyebrow">Workplace culture for veterinary teams</p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">See what’s driving turnover at your clinic, and what to change first.</h1>
          <p className="max-w-2xl text-lg text-slate-600">A confidential 10-minute staff survey built by a survey scientist and a veterinarian. Results show how answers spread in each area, never a single grade, and only for groups of five or more.</p>
          <div className="flex flex-wrap gap-3"><Link className="btn btn-primary px-5 py-3 text-base" href="/login?mode=signup">Set up your clinic</Link><Link className="btn px-5 py-3 text-base" href="/privacy">How staff answers are protected</Link></div>
        </section>
        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-5xl gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(([k, h, p], i) => <div key={k} className="flex flex-col gap-2 bg-white p-6"><span className="font-mono text-xs text-brand">{i + 1} · {k}</span><h2 className="text-lg font-semibold">{h}</h2><p className="text-sm text-slate-600">{p}</p></div>)}
          </div>
        </section>
        <section className="mx-auto grid max-w-5xl gap-8 px-4 py-14 md:grid-cols-2">
          <div className="flex flex-col gap-3"><p className="eyebrow">Confidentiality</p><h2 className="text-3xl font-bold">Honest answers need real anonymity</h2>
            <p className="text-slate-600">In a team of 15, “anonymous” has to be engineered. These rules are built into how data is stored.</p></div>
          <ul className="flex flex-col gap-4">{promises.map(([b, t]) => <li key={b} className="text-sm"><b>{b}</b> {t}</li>)}</ul>
        </section>
      </main>
      <footer className="mx-auto flex max-w-5xl flex-col gap-3 px-4 pb-10 text-sm text-slate-600">
        <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3"><b>Taking a survey?</b> Use the link in your email or text. You don’t need an account, and your clinic never sees your individual answers.</p>
        <p>CuraCulture</p>
      </footer>
    </>
  );
}
