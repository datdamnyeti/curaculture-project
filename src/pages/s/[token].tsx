// Staff survey. Opened from a personal link; no account. Fixed page order,
// every question optional, progress saved against the link.
import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getInstrument, itemMap } from '@/lib/instrument';
import type { Instrument, Item } from '@/lib/instrument';
import type { SurveyState } from '@/lib/server/surveyService';

interface Answers {
  demographics: Record<string, number | string>;
  answers: Record<string, number>;
  openEnded: Record<string, string>;
}

const empty: Answers = { demographics: {}, answers: {}, openEnded: {} };

export default function SurveyPage() {
  const { query, isReady } = useRouter();
  const token = typeof query.token === 'string' ? query.token : '';
  const [state, setState] = useState<SurveyState | { state: 'loading' } | { state: 'error'; message: string }>({ state: 'loading' });
  const [page, setPage] = useState(0);
  const [a, setA] = useState<Answers>(empty);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | 'saved' | 'submitted'>(null);
  const [err, setErr] = useState('');
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isReady) return;
    fetch(`/api/survey/${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((s: SurveyState) => {
        setState(s);
        if (s.state === 'ready' && s.draft && typeof s.draft === 'object') {
          const d = s.draft as Partial<Answers> & { page?: number };
          setA({ demographics: d.demographics || {}, answers: d.answers || {}, openEnded: d.openEnded || {} });
          setPage(d.page || 0);
        }
      })
      .catch(() => setState({ state: 'error', message: 'We couldn’t load the survey. Check your connection and reload the page.' }));
  }, [isReady, token]);

  const inst = useMemo(() => (state.state === 'ready' ? getInstrument(state.version) : null), [state]);
  useEffect(() => { top.current?.scrollIntoView({ block: 'start' }); }, [page, done]);

  async function send(method: 'PUT' | 'POST', nextPage = page) {
    const res = await fetch(`/api/survey/${encodeURIComponent(token)}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(method === 'PUT' ? { ...a, page: nextPage } : a),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (body.error === 'already_complete') throw new Error('This link has already been used to submit the survey.');
      if (body.error === 'survey_closed') throw new Error('This survey has closed.');
      throw new Error('We couldn’t save your answers. Check your connection and try again.');
    }
  }

  async function go(delta: number) {
    const next = page + delta;
    setErr('');
    if (delta > 0 && page > 0) { try { await send('PUT', next); } catch (e) { setErr((e as Error).message); return; } }
    setPage(next);
  }

  async function finishLater() {
    setBusy(true); setErr('');
    try { await send('PUT'); setDone('saved'); } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  }

  async function submit() {
    setBusy(true); setErr('');
    try { await send('POST'); setDone('submitted'); } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  }

  return (
    <div ref={top} className="min-h-screen bg-slate-50">
      <Head><title>Staff survey</title><meta name="robots" content="noindex" /></Head>
      <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6 sm:py-10">
        {state.state === 'loading' && <Message title="Loading your survey…" />}
        {state.state === 'error' && <Message title="Something went wrong" body={state.message} />}
        {state.state === 'not_found' && <Message title="This link doesn’t work" body="Check that you opened the whole link from your email or text. If it still doesn’t work, ask your practice manager to resend it." />}
        {state.state === 'complete' && <Message title="You’ve already taken this survey" body={`Thank you. Your answers for ${state.clinicName} were recorded, and this link can’t be used again.`} />}
        {state.state === 'closed' && <Message title="This survey has closed" body={`The ${state.clinicName} survey is no longer collecting answers.`} />}
        {done === 'saved' && <Message title="Saved" body="Open the same link whenever you’re ready. You’ll pick up where you left off." />}
        {done === 'submitted' && state.state === 'ready' && <Message title="Thank you" body="Your answers were saved without your name, email or this link. The link is now used up, and you can close this page." />}

        {state.state === 'ready' && inst && !done && (
          <Survey inst={inst} intro={state.intro} clinic={state.clinicName} page={page} a={a} setA={setA}
            onNext={() => go(1)} onBack={() => go(-1)} onLater={finishLater} onSubmit={submit} busy={busy} err={err} />
        )}
      </main>
    </div>
  );
}

function Message({ title, body }: { title: string; body?: string }) {
  return (
    <div className="card flex flex-col gap-3 text-center sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {body && <p className="text-slate-600">{body}</p>}
      <p className="text-xs text-slate-500"><Link className="underline" href="/privacy">How your answers are protected</Link></p>
    </div>
  );
}

interface SurveyProps {
  inst: Instrument; intro: 'researcher' | 'selfserve'; clinic: string; page: number; a: Answers;
  setA: React.Dispatch<React.SetStateAction<Answers>>; onNext: () => void; onBack: () => void; onLater: () => void; onSubmit: () => void; busy: boolean; err: string;
}

function Survey({ inst, intro, clinic, page, a, setA, onNext, onBack, onLater, onSubmit, busy, err }: SurveyProps) {
  const pg = inst.pages[page];
  const items = itemMap(inst);
  const questionPages = inst.pages.filter((p) => p.type !== 'intro' && p.type !== 'close');
  const qi = questionPages.indexOf(pg);
  const last = pg.type === 'open';

  const setAnswer = (id: string, v: number) => setA((s) => ({ ...s, answers: toggle(s.answers, id, v) }));
  const setDemo = (id: string, v: number) => setA((s) => ({ ...s, demographics: toggle(s.demographics, id, v) as Answers['demographics'] }));

  if (pg.type === 'intro') {
    return (
      <div className="card flex flex-col gap-5 sm:p-8">
        <span className="eyebrow">{clinic}</span>
        <h1 className="text-2xl font-semibold tracking-tight">{inst.name}</h1>
        <p className="leading-relaxed">{inst.intro[intro]}</p>
        <p className="note">Every question is optional. You can stop at any point and come back with the same link. <Link className="font-medium text-brand underline" href="/privacy">How your answers are protected</Link></p>
        <button className="btn btn-primary self-start px-6 py-3 text-base" onClick={onNext}>Start</button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2" aria-live="polite">
        <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-brand transition-all" style={{ width: `${(qi / questionPages.length) * 100}%` }} /></div>
        <span className="text-sm text-slate-500">{pg.title ? `${pg.title} · ` : ''}Page {qi + 1} of {questionPages.length}</span>
      </div>
      <div className="card flex flex-col sm:p-7">
        {pg.note && <p className="note mb-4">{pg.note}</p>}
        {pg.type === 'demographics' && inst.demographics.map((d) => (
          <fieldset key={d.id} className="flex flex-col gap-3 border-t border-slate-200 py-5 first:border-t-0 first:pt-0">
            <legend className="mb-3 font-medium">{d.text}</legend>
            <div className="flex flex-col gap-2">
              {d.options.map((o, i) => (
                <button key={o} type="button" aria-pressed={a.demographics[d.id] === i + 1} onClick={() => setDemo(d.id, i + 1)}
                  className={`rounded-lg border px-4 py-3 text-left text-sm ${a.demographics[d.id] === i + 1 ? 'border-brand bg-brand-soft font-semibold' : 'border-slate-300 bg-slate-50'}`}>{o}</button>
              ))}
            </div>
            {d.otherCode && a.demographics[d.id] === d.otherCode && (
              <input className="input" aria-label="Please specify your role" placeholder="Please specify" maxLength={200}
                value={(a.demographics.D1_other as string) || ''} onChange={(e) => setA((s) => ({ ...s, demographics: { ...s.demographics, D1_other: e.target.value } }))} />
            )}
          </fieldset>
        ))}
        {pg.type === 'items' && pg.items!.map((id) => <Question key={id} item={items[id]} inst={inst} value={a.answers[id]} onPick={(v) => setAnswer(id, v)} />)}
        {pg.type === 'open' && (
          <>
            <p className="mb-4 text-sm text-slate-600">These are optional. Leave out names and details that could identify you or a coworker.</p>
            {pg.items!.map((id) => (
              <label key={id} className="flex flex-col gap-2 border-t border-slate-200 py-5 first-of-type:border-t-0">
                <span className="font-medium">{items[id].text}</span>
                <textarea className="input min-h-28" maxLength={2000} value={a.openEnded[id] || ''}
                  onChange={(e) => setA((s) => ({ ...s, openEnded: { ...s.openEnded, [id]: e.target.value } }))} />
              </label>
            ))}
          </>
        )}
        {err && <p role="alert" className="mt-2 rounded-lg bg-orange-50 px-4 py-3 text-sm text-orange-900">{err}</p>}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button className="btn" onClick={onBack} disabled={busy}>Back</button>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-ghost" onClick={onLater} disabled={busy}>Save and finish later</button>
            {last
              ? <button className="btn btn-primary" onClick={onSubmit} disabled={busy}>{busy ? 'Submitting…' : 'Submit'}</button>
              : <button className="btn btn-primary" onClick={onNext} disabled={busy}>Next</button>}
          </div>
        </div>
      </div>
    </>
  );
}

function Question({ item, inst, value, onPick }: { item: Item; inst: Instrument; value?: number; onPick: (v: number) => void }) {
  const labels = inst.scales[item.scale!].labels;
  const grid = labels.length === 6 ? 'grid-cols-3 sm:grid-cols-6' : 'grid-cols-1 sm:grid-cols-5';
  return (
    <fieldset className="flex flex-col gap-3 border-t border-slate-200 py-5 first-of-type:border-t-0 first-of-type:pt-0">
      <legend className="mb-3 font-medium">{item.text}</legend>
      <div className={`grid gap-2 ${grid}`}>
        {labels.map((l, i) => (
          <button key={l} type="button" aria-pressed={value === i + 1} onClick={() => onPick(i + 1)}
            className={`min-h-12 rounded-lg border px-2 py-2 text-xs leading-tight sm:text-[0.8rem] ${value === i + 1 ? 'border-brand bg-brand font-semibold text-white' : 'border-slate-300 bg-slate-50'}`}>{l}</button>
        ))}
      </div>
    </fieldset>
  );
}

/** Tapping the selected answer again clears it: every question is optional. */
function toggle<T extends Record<string, unknown>>(obj: T, key: string, v: number): T {
  const next = { ...obj } as Record<string, unknown>;
  if (next[key] === v) delete next[key]; else next[key] = v;
  return next as T;
}
