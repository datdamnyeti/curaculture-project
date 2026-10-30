// Practice data overview: headline counts, what is due, signals across tools,
// and stay interviews.
import { useState } from 'react';
import { fmtDate, pct } from '@/lib/format';
import { STAY_QUESTIONS, STAY_TRIGGERS } from '@/lib/practice/registry';
import type { SectionProps } from './types';
import { Flag, Section, Stat } from './shared';

const AREAS = [['TC', 'Team & Communication'], ['WR', 'Workload & Recovery'], ['FL', 'Fairness & Leadership'], ['TE', 'Tools & Environment'], ['PM', 'Purpose & Meaning'], ['GD', 'Growth & Development'], ['ES', 'Ethical Support'], ['CR', 'Compensation & Rewards']] as const;
const SIGNAL = {
  corroborated: <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">Corroborated</span>,
  diverges: <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-800">Diverges</span>,
  not_enough: <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">Not enough data</span>,
};

export default function Overview({ d, canEdit, go, save }: SectionProps) {
  const m = d.metrics, V = m.vitals;
  const empty = !d.vitals.length && !d.exits.length && !d.hires.length && !d.audits.length;
  const onTrack = m.onboarding.active.filter((h) => !Object.entries(h.steps).some(([k, v]) => ['OC1', 'OC7', 'OC9'].includes(k) && v === 0)).length;

  if (empty) {
    return (
      <Section title="No practice records yet" sub="Start with this quarter’s vitals: headcount, hires, open positions and after-hours shifts. It takes about 10 minutes. Exit records, onboarding checklists and the client-safety audit each take a few minutes more.">
        {canEdit && <div className="flex flex-wrap gap-2"><button className="btn btn-primary" onClick={() => go('vitals')}>Enter vitals</button><button className="btn" onClick={() => go('onboarding')}>Start an onboarding checklist</button><button className="btn" onClick={() => go('safety')}>Run the client-safety audit</button></div>}
      </Section>
    );
  }

  return (
    <>
      <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {V && <Stat label="Turnover · 12 months" value={<>{V.turnover.count} <span className="text-base font-medium text-slate-500">people · {pct(V.turnover.rate)}</span></>} sub={`${V.turnover.voluntary} chose to leave · average headcount ${V.avgHeadcount.toFixed(1)}`} />}
        {V && <Stat label="Left before day 90" value={<>{V.earlyExit.left} <span className="text-base font-medium text-slate-500">of {V.earlyExit.of} hires</span></>} sub={V.earlyExit.of ? `Hires who reached day 90 in the last 12 months` : 'No hire has reached day 90 in the records yet'} />}
        {V && <Stat label="Open positions" value={<>{V.open.count}{V.open.longestDays != null && <span className="text-base font-medium text-slate-500"> · longest {V.open.longestDays} days</span>}</>} sub={`Vacancy ${pct(V.open.vacancy)}`} />}
        {V?.afterHours.now != null && <Stat label="After-hours load" value={<>{V.afterHours.now.toFixed(1)} <span className="text-base font-medium text-slate-500">shifts</span></>} sub={`Per clinical FTE per month, ${V.last.quarter}`} />}
        {m.onboarding.active.length > 0 && <Stat label="New hires on track" value={<>{onTrack} <span className="text-base font-medium text-slate-500">of {m.onboarding.active.length}</span></>} sub="No critical onboarding step missed" />}
        {m.audit?.readiness != null && <Stat label="Client-safety readiness" value={`${Math.round(m.audit.readiness)}%`} sub={`${m.audit.gaps.length} gaps · audited ${fmtDate(m.audit.auditedOn)}`} />}
      </div>

      {d.due.length > 0 && (
        <Section title="Due from these tools" sub="Also listed on your surveys page.">
          <div className="flex flex-col">
            {d.due.map((x) => (
              <div key={x.key} className="flex flex-wrap items-center gap-3 border-t border-slate-100 py-3 first:border-t-0 first:pt-0">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${x.overdue ? 'bg-orange-50 text-orange-800' : 'bg-brand-soft text-brand'}`}>{x.badge ?? (x.overdue ? 'Overdue' : `Due ${fmtDate(x.due)}`)}</span>
                <span className="min-w-0 flex-1 text-sm"><b>{x.title}</b> <span className="text-slate-500">{x.detail}</span></span>
                <button className="btn" onClick={() => go(x.tool)}>Open</button>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Signals across tools" sub="Each pair puts an owner record next to what staff said. Corroborated means both point the same way; diverges means they split and are worth a conversation. Neither is a score.">
        {d.signals.length ? d.signals.map((s) => (
          <div key={s.key} className="flex flex-col gap-1.5 border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
            <div className="flex flex-wrap items-center justify-between gap-2"><b className="text-sm">{s.title}</b>{SIGNAL[s.kind]}</div>
            <div className="grid gap-1 text-sm sm:grid-cols-2"><span>{s.owner}</span><span>{s.staff}</span></div>
            <p className="text-sm text-slate-700">{s.meaning}</p>
            <p className="text-xs text-slate-500">Pilot rule, set before any data: {s.rule}</p>
          </div>
        )) : <p className="text-sm text-slate-600">Signals appear once there are owner records and a survey with 5 or more responses. The onboarding and client-safety signals also need a survey that includes the v2.2 pilot pages.</p>}
      </Section>

      <StayInterviews d={d} canEdit={canEdit} save={save} />
    </>
  );
}

function StayInterviews({ d, canEdit, save }: Pick<SectionProps, 'd' | 'canEdit' | 'save'>) {
  const [trigger, setTrigger] = useState('opening_90');
  const [themes, setThemes] = useState<Set<string>>(new Set());
  return (
    <Section title="Stay interviews" sub="A 30-minute one-to-one on what keeps someone here and what would make the job better. Log themes only: never names, quotes or who said what.">
      {d.stayTriggers.length > 0 && <Flag><span><b>A stay interview fits now.</b><br />{d.stayTriggers.map((t) => <span key={t} className="block">{t}</span>)}</span></Flag>}
      <details className="text-sm"><summary className="cursor-pointer font-medium text-brand">The six questions</summary>
        <ol className="mt-2 flex list-decimal flex-col gap-1.5 pl-5">{STAY_QUESTIONS.map(([q, f]) => <li key={q}><b>{q}</b> <span className="text-slate-500">Follow-up: {f}</span></li>)}</ol></details>
      {d.stay.length > 0 && (
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-slate-500"><th className="py-2 font-medium">Date</th><th className="py-2 font-medium">Trigger</th><th className="py-2 font-medium">Themes</th></tr></thead>
          <tbody>{[...d.stay].reverse().map((s) => <tr key={s.id} className="border-t border-slate-100"><td className="py-2">{fmtDate(s.heldOn)}</td><td className="py-2">{STAY_TRIGGERS[s.trigger]}</td><td className="py-2 font-mono text-xs text-brand">{s.themes.join(' · ')}</td></tr>)}</tbody>
        </table></div>
      )}
      {canEdit && (
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4">
          <label className="field max-w-xs"><span>Trigger</span><select className="input" value={trigger} onChange={(e) => setTrigger(e.target.value)}>{Object.entries(STAY_TRIGGERS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <fieldset className="flex flex-col gap-2"><legend className="mb-1 text-sm font-medium text-slate-600">Themes raised</legend>
            <div className="flex flex-wrap gap-2">{AREAS.map(([id, name]) => (
              <label key={id} className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-sm ${themes.has(id) ? 'border-brand bg-brand-soft' : 'border-line'}`}>
                <input type="checkbox" className="sr-only" checked={themes.has(id)} onChange={() => { const s = new Set(themes); if (s.has(id)) s.delete(id); else s.add(id); setThemes(s); }} />{name}</label>
            ))}</div></fieldset>
          <button className="btn self-start" disabled={!themes.size} onClick={async () => { if (await save('/api/practice/stay', 'POST', { trigger, themes: [...themes] }, 'Themes logged. Nothing about who said what is kept.')) setThemes(new Set()); }}>Log themes</button>
        </div>
      )}
    </Section>
  );
}
