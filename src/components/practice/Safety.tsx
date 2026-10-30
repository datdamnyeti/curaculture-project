// Client-conduct policy audit (CP1–CP15): yearly and after any serious incident.
import { useState } from 'react';
import { fmtDate, pct } from '@/lib/format';
import { CP8_OPTIONS, POLICY_ITEMS, POLICY_STATUS } from '@/lib/practice/registry';
import type { SectionProps } from './types';
import { Actions, Flag, Meter, Section } from './shared';

export default function SafetySection({ d, canEdit, save }: SectionProps) {
  const A = d.metrics.audit;
  const [auditing, setAuditing] = useState(false);
  if (auditing) return <AuditForm prev={A?.answers ?? null} onCancel={() => setAuditing(false)} onSave={async (b) => { if (await save('/api/practice/audits', 'POST', b, 'Audit saved.')) setAuditing(false); }} />;

  return (
    <>
      <Flag><span><b>CP4 (the client-dismissal process) needs legal review</b> before it is used outside the pilot. Dismissal rules vary by place and by contract.</span></Flag>
      {!A ? (
        <Section title="No audit yet" sub="Fifteen yes, informal or no questions about your client-conduct policy, reporting, training and after-care. Yearly, and after any serious incident.">
          {canEdit && <button className="btn btn-primary self-start" onClick={() => setAuditing(true)}>Start the audit</button>}
        </Section>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          <Section title={<>Readiness <span className="font-mono text-xs text-brand">CP1–CP15</span></>}
            sub={`${A.reason === 'incident' ? 'After a serious incident' : 'Yearly audit'} · ${fmtDate(A.auditedOn)} · next yearly audit ${fmtDate(A.nextYearly)}`}
            right={canEdit && <button className="btn" onClick={() => setAuditing(true)}>New audit</button>}>
            <p className="text-4xl font-semibold tracking-tight">{Math.round(A.readiness ?? 0)}%</p>
            <p className="text-xs text-slate-500">Points ÷ maximum. Yes = 2, informal or sometimes = 1, no = 0; the training question’s four options are rescaled to 0–2. A readiness checklist, not a validated scale.</p>
            {A.elements.map((e) => <Meter key={e.element} label={<>{e.element} <span className="text-xs text-slate-500">{e.items.join(', ')}</span></>} value={e.points} max={e.max} right={`${Math.round(e.points * 10) / 10} / ${e.max}`} />)}
            {d.staff && (
              <div className="flex flex-col gap-1 border-t border-slate-100 pt-3 text-sm"><b>What staff said ({d.staff.name})</b>
                <span>{pct(d.staff.knowHowToReport)} know how to report a client problem</span>
                <span>{d.staff.checkIn.suppressed ? 'Check-in after an incident: fewer than 5 were asked' : `${pct(d.staff.checkIn.withinADay)} of those with an incident were checked on within a day`}</span>
                <span>Threats or physical acts: {d.staff.threatsBand}</span></div>
            )}
          </Section>
          <Section title={`Gaps · ${A.gaps.length}`} sub="Every “No”. The actions below close most of them.">
            {A.gaps.length ? A.gaps.map((g) => (
              <p key={g.id} className="border-t border-slate-100 pt-2 text-sm first:border-t-0 first:pt-0"><span className="font-mono text-xs text-brand">{g.id}</span> {g.text}{g.legalReview && <span className="ml-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-800">Legal review</span>}</p>
            )) : <p className="text-sm text-slate-600">No gaps.</p>}
            <details className="text-sm"><summary className="cursor-pointer font-medium text-brand">Every answer</summary>
              <div className="mt-2 flex flex-col gap-1.5">{POLICY_ITEMS.map((p) => <span key={p.id}><span className="font-mono text-xs text-brand">{p.id}</span> {p.text} <b>{p.id === 'CP8' ? CP8_OPTIONS[A.answers[p.id]] : POLICY_STATUS[A.answers[p.id]]}</b></span>)}</div></details>
          </Section>
        </div>
      )}
      <Actions tool="safety" />
    </>
  );
}

function AuditForm({ prev, onCancel, onSave }: { prev: Record<string, number> | null; onCancel: () => void; onSave: (b: unknown) => void }) {
  const [answers, setAnswers] = useState<Record<string, number>>(prev ?? {});
  const [reason, setReason] = useState<'yearly' | 'incident'>('yearly');
  const missing = POLICY_ITEMS.filter((p) => answers[p.id] == null).length;
  return (
    <Section title="Client-conduct policy audit" sub={prev ? 'Answers start from your last audit. Change what is different.' : 'About 10 minutes.'} right={<button className="btn btn-ghost" onClick={onCancel}>Cancel</button>}>
      <label className="field max-w-xs"><span>Why now</span><select className="input" value={reason} onChange={(e) => setReason(e.target.value as 'yearly' | 'incident')}><option value="yearly">Yearly audit</option><option value="incident">After a serious incident</option></select></label>
      {POLICY_ITEMS.map((p) => {
        const opts = p.id === 'CP8' ? CP8_OPTIONS : POLICY_STATUS;
        return (
          <fieldset key={p.id} className="flex flex-col gap-2 border-t border-slate-100 pt-3">
            <legend className="mb-2 text-sm"><span className="font-mono text-xs text-brand">{p.id}</span> <span className="text-xs text-slate-500">{p.element}</span> {p.text}{p.legalReview && <span className="ml-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-800">Legal review</span>}</legend>
            <div className="flex flex-wrap gap-2">{Object.entries(opts).sort((a, b) => Number(b[0]) - Number(a[0])).map(([k, l]) => (
              <label key={k} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${answers[p.id] === Number(k) ? 'border-brand bg-brand-soft font-medium' : 'border-line'}`}>
                <input type="radio" className="sr-only" name={p.id} checked={answers[p.id] === Number(k)} onChange={() => setAnswers({ ...answers, [p.id]: Number(k) })} />{l}</label>
            ))}</div>
          </fieldset>
        );
      })}
      <div className="flex flex-wrap items-center gap-3"><button className="btn btn-primary" disabled={missing > 0} onClick={() => onSave({ reason, answers })}>Save audit</button>
        {missing > 0 && <span className="text-sm text-slate-500">{missing} {missing === 1 ? 'question' : 'questions'} left.</span>}</div>
    </Section>
  );
}
