// Onboarding checklist (OC1–OC14): day 0, 30 and 90 steps for each new hire.
import { useState } from 'react';
import { fmtDate } from '@/lib/format';
import { CHECKPOINT_DAYS, ROLES, ROLE_LABEL, RoleCode, STEP_STATUS } from '@/lib/practice/registry';
import { checkpoint, completion, criticalMissed } from '@/lib/practice/metrics';
import type { SectionProps } from './types';
import { Actions, Section } from './shared';

export default function OnboardingSection({ d, canEdit, save }: SectionProps) {
  const O = d.metrics.onboarding;
  const hires = [...d.hires].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const [open, setOpen] = useState<string | null>(hires.find((h) => !h.leftOn)?.id ?? null);
  const [f, setF] = useState({ name: '', role: 'R3' as RoleCode, startDate: d.today });
  const [leaving, setLeaving] = useState<{ id: string; date: string } | null>(null);

  return (
    <>
      <Section title={<>Onboarding checklist <span className="font-mono text-xs text-brand">OC1–OC14</span></>}
        sub="Fourteen steps at day 0, 30 and 90. Each step is 2 done on time, 1 late or partly, 0 not done; “does not apply” is left out of completion. Three steps are critical: a buddy before day 1, two wellbeing check-ins in 30 days, and no solo shifts before sign-off.">
        {O.high.of + O.low.of > 0 && (
          <p className="text-sm">Hires with 80% or more completion: <b>{O.high.stayed} of {O.high.of}</b> still here at day 90 · below 80%: <b>{O.low.stayed} of {O.low.of}</b> <span className="text-slate-500">· counts, not proof: the numbers are small.</span></p>
        )}
        {canEdit && (
          <form className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4" onSubmit={async (e) => { e.preventDefault(); if (await save('/api/practice/hires', 'POST', f, `Checklist started. Name ${f.name.split(' ')[0]}’s buddy before day 1.`)) setF({ ...f, name: '' }); }}>
            <label className="field"><span>New hire</span><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Name" /></label>
            <label className="field"><span>Role</span><select className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as RoleCode })}>{ROLES.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}</select></label>
            <label className="field"><span>Start date</span><input className="input" type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} /></label>
            <button className="btn btn-primary" disabled={!f.name.trim()}>Start a checklist</button>
          </form>
        )}
      </Section>

      {hires.map((h) => {
        const c = completion(h.steps), crit = criticalMissed(h), cps = CHECKPOINT_DAYS.map((day) => checkpoint(h, day, d.today)), isOpen = open === h.id;
        return (
          <section key={h.id} className="card flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-1.5">
                <h2 className="font-semibold">{h.name} <span className="font-normal text-slate-500">· {ROLE_LABEL[h.role]} · started {fmtDate(h.startDate)}{h.leftOn ? ` · left ${fmtDate(h.leftOn)}` : ''}</span></h2>
                <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
                  {c != null && <span className={`rounded-full px-2 py-0.5 ${c >= 80 ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>{Math.round(c)}% complete</span>}
                  {crit.map((s) => <span key={s} className="rounded-full bg-orange-50 px-2 py-0.5 text-orange-800">Critical step missed: {s}</span>)}
                  {cps.filter((x) => x.overdue).map((x) => <span key={x.day} className="rounded-full bg-orange-50 px-2 py-0.5 text-orange-800">Day {x.day} overdue</span>)}
                </div>
              </div>
              <div className="flex gap-2">
                {canEdit && !h.leftOn && (leaving?.id === h.id
                  ? <span className="flex items-center gap-2"><label className="sr-only" htmlFor={`left-${h.id}`}>Date they left</label><input id={`left-${h.id}`} className="input w-40" type="date" max={d.today} value={leaving.date} onChange={(e) => setLeaving({ id: h.id, date: e.target.value })} />
                      <button className="btn" disabled={!leaving.date} onClick={async () => { if (await save(`/api/practice/hires?id=${h.id}`, 'PATCH', { leftOn: leaving.date }, 'Saved. Add an exit record too, so turnover counts it.')) setLeaving(null); }}>Save</button>
                      <button className="btn btn-ghost px-1" onClick={() => setLeaving(null)}>Cancel</button></span>
                  : <button className="btn btn-ghost px-1" onClick={() => setLeaving({ id: h.id, date: d.today })}>Mark as left</button>)}
                <button className="btn" onClick={() => setOpen(isOpen ? null : h.id)} aria-expanded={isOpen}>{isOpen ? 'Close' : 'Open checklist'}</button>
              </div>
            </div>
            {isOpen && (
              <div className="grid gap-5 lg:grid-cols-3">
                {cps.map((cp) => (
                  <div key={cp.day} className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-slate-600">Day {cp.day} · {fmtDate(cp.due)}{cp.overdue ? ' · overdue' : ''}</span>
                    {cp.steps.map((s) => {
                      const v = h.steps[s.id];
                      return (
                        <div key={s.id} className={`flex flex-col gap-2 rounded-lg border p-3 text-sm ${s.critical && v === 0 ? 'border-orange-200 bg-orange-50' : 'border-slate-100'}`}>
                          <span><span className="font-mono text-xs text-brand">{s.id}</span>{s.critical && <b> Critical.</b>} {s.text}</span>
                          <select className="input" aria-label={`${s.id} status`} disabled={!canEdit} value={v == null ? '' : String(v)}
                            onChange={(e) => save(`/api/practice/hires?id=${h.id}`, 'PATCH', { steps: { [s.id]: e.target.value === '' ? null : Number(e.target.value) } })}>
                            <option value="">{h.leftOn && v == null ? 'Not reached' : 'Not yet recorded'}</option>
                            {Object.entries(STEP_STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
      <Actions tool="onboarding" />
    </>
  );
}
