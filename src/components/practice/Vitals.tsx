// Practice vitals (VT1–VT6): one short form per quarter.
import { useState } from 'react';
import { fmtDate, pct } from '@/lib/format';
import { ROLES, ROLE_LABEL, RoleCode } from '@/lib/practice/registry';
import { afterHoursPerFte, daysBetween, exitsInQuarter, lastEndedQuarter, nextQuarter, quarterEnd, Vitals } from '@/lib/practice/metrics';
import type { SectionProps } from './types';
import { Actions, Flag, Meter, Section } from './shared';

const sum = (o: Partial<Record<RoleCode, number>>) => Object.values(o).reduce<number>((s, x) => s + (x || 0), 0);

export default function VitalsSection({ d, canEdit, save }: SectionProps) {
  const V = d.metrics.vitals;
  const sorted = [...d.vitals].sort((a, b) => a.quarter.localeCompare(b.quarter));
  const [editing, setEditing] = useState<string | null>(null);
  const firstQuarter = lastEndedQuarter(d.today);
  const bad = V?.reconciliation.filter((r) => r.checked && !r.ok) ?? [];

  return (
    <>
      {editing && <VitalsForm key={editing} quarter={editing} d={d} onCancel={() => setEditing(null)} onSave={async (body) => { if (await save('/api/practice/vitals', 'POST', body, `${editing} saved.`)) setEditing(null); }} />}
      {bad.map((r) => r.checked && <Flag key={r.quarter}><span><b>{r.quarter} doesn’t add up.</b> {r.entered} on payroll, but last quarter plus hires minus exits is {r.expected}. A hire or an exit is usually missing from the records.</span></Flag>)}

      <Section title={<>Quarterly vitals <span className="font-mono text-xs text-brand">VT1–VT6</span></>}
        sub="Due 15 days after each quarter ends. Exits are counted from your exit records and confirmed here, never typed twice."
        right={canEdit && !editing && <button className="btn btn-primary" onClick={() => setEditing(sorted.length ? nextQuarter(sorted[sorted.length - 1].quarter) : firstQuarter)}>Enter {sorted.length ? nextQuarter(sorted[sorted.length - 1].quarter) : firstQuarter}</button>}>
        {!sorted.length ? <p className="text-sm text-slate-600">No quarters entered yet.</p> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm">
            <thead><tr className="text-left text-xs text-slate-500">{['Quarter', 'Headcount', 'Hires', 'Exits', 'Open', 'After-hours shifts', 'Overtime hours', 'Shifts per clinical FTE a month', 'Check', ''].map((h) => <th key={h} className="py-2 pr-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>{sorted.map((v) => {
              const r = V?.reconciliation.find((x) => x.quarter === v.quarter), ah = afterHoursPerFte(v);
              return (
                <tr key={v.quarter} className="border-t border-slate-100">
                  <td className="py-2 pr-3 font-medium">{v.quarter}</td><td className="py-2 pr-3 font-mono">{sum(v.headcount)}</td><td className="py-2 pr-3 font-mono">{sum(v.hires)}</td>
                  <td className="py-2 pr-3 font-mono">{exitsInQuarter(d.exits, v.quarter).length}</td><td className="py-2 pr-3 font-mono">{v.openPositions.length}</td>
                  <td className="py-2 pr-3 font-mono">{v.afterHoursShifts ?? 'not tracked'}</td><td className="py-2 pr-3 font-mono">{v.overtimeHours ?? 'not tracked'}</td>
                  <td className="py-2 pr-3 font-mono">{ah == null ? '—' : ah.toFixed(1)}</td>
                  <td className="py-2 pr-3">{!r?.checked ? <span className="text-xs text-slate-500">first quarter</span> : r.ok ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">Adds up</span> : <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-800">Off by {r.entered - r.expected > 0 ? '+' : ''}{r.entered - r.expected}</span>}</td>
                  <td className="py-2">{canEdit && <button className="btn btn-ghost px-1" onClick={() => setEditing(v.quarter)}>Edit</button>}</td>
                </tr>
              );
            })}</tbody>
          </table></div>
        )}
      </Section>

      {V && (
        <div className="grid gap-5 md:grid-cols-2">
          <Section title="Turnover, last 12 months">
            <p className="text-3xl font-semibold tracking-tight">{V.turnover.count} people <span className="text-lg font-medium text-slate-500">of about {Math.round(V.avgHeadcount)} · {pct(V.turnover.rate)}</span></p>
            <Meter label="Chose to leave or retired" value={V.turnover.voluntary} max={V.turnover.count} right={V.turnover.voluntary} />
            <Meter label="Clinic-initiated or mutual" value={V.turnover.involuntary} max={V.turnover.count} right={V.turnover.involuntary} />
            {V.turnover.uncoded > 0 && <Meter label="Not coded yet" value={V.turnover.uncoded} max={V.turnover.count} right={V.turnover.uncoded} />}
            <p className="text-xs text-slate-500">Separations from {fmtDate(V.window.from)} to {fmtDate(V.window.to)} ÷ the mean of the last {V.headcounts.length} quarter-end headcounts ({V.headcounts.join(', ')}). Headcount, not FTE. AAHA reports average veterinary team turnover near 23% a year (association survey).</p>
            <div className="flex flex-col gap-1 border-t border-slate-100 pt-3 text-sm">
              <span><b>{V.earlyExit.left} of {V.earlyExit.of}</b> hires who reached day 90 in the last 12 months left before it.</span>
              <span>{V.firstYearExit.of ? <><b>{V.firstYearExit.left} of {V.firstYearExit.of}</b> hires who reached day 365 in 24 months left before it.</> : 'First-year exits: no hire in the records has reached day 365 yet.'}</span>
            </div>
          </Section>
          <Section title="Open positions and after-hours load">
            {V.last.openPositions.length ? (
              <>
                <table className="w-full text-sm"><tbody>{V.last.openPositions.map((o, i) => <tr key={i} className="border-t border-slate-100 first:border-t-0"><td className="py-1.5">{ROLE_LABEL[o.role]}</td><td className="py-1.5 text-slate-500">since {fmtDate(o.since)}</td><td className="py-1.5 text-right font-mono">{daysBetween(o.since, d.today)} days</td></tr>)}</tbody></table>
                <p className="text-sm">Median {Math.round(V.open.medianDays!)} days open · vacancy {pct(V.open.vacancy)}{V.open.byRole.length ? ` (${V.open.byRole.map((r) => `${ROLE_LABEL[r.role]} ${pct(r.rate)}`).join(', ')})` : ''}</p>
              </>
            ) : <p className="text-sm text-slate-600">No open positions at the end of {V.last.quarter}.</p>}
            <div className="flex flex-col gap-1 border-t border-slate-100 pt-3"><span className="text-sm text-slate-600">After-hours shifts per clinical FTE (vets, technicians, assistants) per month</span>
              {V.afterHours.series.map((x) => <Meter key={x.quarter} label={x.quarter} value={x.perFte ?? 0} max={Math.max(...V.afterHours.series.map((y) => y.perFte ?? 0), 0.01)} right={x.perFte == null ? '—' : x.perFte.toFixed(1)} />)}</div>
          </Section>
        </div>
      )}
      <Actions tool="vitals" />
    </>
  );
}

function VitalsForm({ quarter, d, onCancel, onSave }: { quarter: string; d: SectionProps['d']; onCancel: () => void; onSave: (b: unknown) => void }) {
  const sorted = [...d.vitals].sort((a, b) => a.quarter.localeCompare(b.quarter));
  const cur = sorted.find((v) => v.quarter === quarter), prev = sorted.filter((v) => v.quarter < quarter).pop();
  const start: Vitals = cur ?? { quarter, headcount: { ...prev?.headcount }, fte: { ...prev?.fte }, hires: {}, exitsConfirmed: true, openPositions: [...(prev?.openPositions ?? [])], afterHoursShifts: null, overtimeHours: null };
  const [f, setF] = useState(start);
  const [confirmed, setConfirmed] = useState(true);
  const [notTracked, setNotTracked] = useState(!!cur && cur.afterHoursShifts == null);
  const [newOpen, setNewOpen] = useState<{ role: RoleCode; since: string }>({ role: 'R2', since: '' });
  const exits = exitsInQuarter(d.exits, quarter).length;
  const setRole = (k: 'headcount' | 'fte' | 'hires', r: RoleCode, v: string) => setF({ ...f, [k]: { ...f[k], [r]: v === '' ? undefined : Number(v) } });

  return (
    <Section title={`Practice vitals · ${quarter}`} sub={`Quarter ends ${fmtDate(quarterEnd(quarter))}; due 15 days later.${quarterEnd(quarter) >= d.today ? ' This quarter hasn’t ended: figures are as of today.' : ''}`} right={<button className="btn btn-ghost" onClick={onCancel}>Cancel</button>}>
      <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm">
        <thead><tr className="text-left text-xs text-slate-500"><th className="py-2 font-medium">Role</th><th className="py-2 font-medium">On payroll at quarter end</th><th className="py-2 font-medium">FTE</th><th className="py-2 font-medium">Started this quarter</th></tr></thead>
        <tbody>{ROLES.map((r) => (
          <tr key={r.code} className="border-t border-slate-100">
            <td className="py-1.5 pr-3">{r.label}</td>
            {(['headcount', 'fte', 'hires'] as const).map((k) => (
              <td key={k} className="py-1.5 pr-3"><input className="input w-24" type="number" min={0} step={k === 'fte' ? 0.1 : 1} aria-label={`${r.label} ${k}`} value={f[k][r.code] ?? ''} onChange={(e) => setRole(k, r.code, e.target.value)} /></td>
            ))}
          </tr>
        ))}</tbody>
      </table></div>
      <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
        <span><b>{exits} {exits === 1 ? 'person' : 'people'} left during the quarter</b>, counted from your exit records. <span className="text-slate-500">Untick if that’s wrong, then fix the exit records first.</span></span></label>
      <div className="flex flex-col gap-2"><span className="text-sm font-medium text-slate-600">Open positions at quarter end</span>
        {f.openPositions.map((o, i) => (
          <div key={i} className="flex flex-wrap items-center gap-3 text-sm"><span>{ROLE_LABEL[o.role]} · recruiting since {fmtDate(o.since)}</span>
            <button className="btn btn-ghost px-1" onClick={() => setF({ ...f, openPositions: f.openPositions.filter((_, j) => j !== i) })}>Filled or closed</button></div>
        ))}
        <div className="flex flex-wrap items-end gap-2">
          <label className="field"><span>Role</span><select className="input" value={newOpen.role} onChange={(e) => setNewOpen({ ...newOpen, role: e.target.value as RoleCode })}>{ROLES.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}</select></label>
          <label className="field"><span>Recruiting since</span><input className="input" type="date" value={newOpen.since} onChange={(e) => setNewOpen({ ...newOpen, since: e.target.value })} /></label>
          <button className="btn" disabled={!newOpen.since} onClick={() => { setF({ ...f, openPositions: [...f.openPositions, newOpen] }); setNewOpen({ ...newOpen, since: '' }); }}>Add opening</button>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <label className="field"><span>After-hours or on-call shifts</span><input className="input w-40" type="number" min={0} disabled={notTracked} value={f.afterHoursShifts ?? ''} onChange={(e) => setF({ ...f, afterHoursShifts: e.target.value === '' ? null : Number(e.target.value) })} /></label>
        <label className="field"><span>Overtime hours paid</span><input className="input w-40" type="number" min={0} disabled={notTracked} value={f.overtimeHours ?? ''} onChange={(e) => setF({ ...f, overtimeHours: e.target.value === '' ? null : Number(e.target.value) })} /></label>
        <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" checked={notTracked} onChange={(e) => setNotTracked(e.target.checked)} />We don’t track these</label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn btn-primary" disabled={!confirmed} onClick={() => onSave({ quarter, headcount: f.headcount, fte: f.fte, hires: f.hires, exitsConfirmed: confirmed, openPositions: f.openPositions, afterHoursShifts: f.afterHoursShifts, overtimeHours: f.overtimeHours, notTracked })}>Save {quarter}</button>
        <span className="text-xs text-slate-500">Unplanned absence is left out on purpose: sick-leave records are health-adjacent.</span>
      </div>
    </Section>
  );
}
