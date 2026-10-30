// Exit reason coding (XR1–XR9): one short record per leaver, by role and month.
import { useState } from 'react';
import { fmtDate } from '@/lib/format';
import { DESTINATION, EXIT_REASONS, EXIT_REASON, INITIATED_BY, REASON_SOURCE, REHIRE, ROLES, ROLE_LABEL, RoleCode } from '@/lib/practice/registry';
import { addDays, isCoded, tenureBand, ExitRecord } from '@/lib/practice/metrics';
import type { SectionProps } from './types';
import { Actions, Flag, Meter, Section } from './shared';

const AREA_NAME: Record<string, string> = { TC: 'Team & Communication', WR: 'Workload & Recovery', FL: 'Fairness & Leadership', TE: 'Tools & Environment', PM: 'Purpose & Meaning', GD: 'Growth & Development', ES: 'Ethical Support', CR: 'Compensation & Rewards' };
const fmtMonth = (d: string | null) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—');

export default function ExitsSection({ d, canEdit, save }: SectionProps) {
  const E = d.metrics.exits;
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const coded = d.exits.filter(isCoded).sort((a, b) => b.lastDay.localeCompare(a.lastDay));
  const maxNamed = Math.max(1, ...Object.values(E.named).map((x) => x || 0));

  return (
    <>
      {editing && <ExitForm key={editing} rec={editing === 'new' ? null : d.exits.find((x) => x.id === editing)!} today={d.today} onCancel={() => setEditing(null)}
        onSave={async (body) => { if (await save(editing === 'new' ? '/api/practice/exits' : `/api/practice/exits?id=${editing}`, editing === 'new' ? 'POST' : 'PATCH', body, 'Exit record saved. Turnover and the quarterly exit count update from it.')) setEditing(null); }} />}
      {E.toCode.map((x) => (
        <Flag key={x.id}><span className="flex-1"><b>Code the exit on {fmtDate(x.lastDay)} ({ROLE_LABEL[x.role]}).</b> Due {fmtDate(addDays(x.lastDay, 14))}, while the reasons are fresh.</span>
          {canEdit && <button className="btn" onClick={() => setEditing(x.id)}>Code it</button>}</Flag>
      ))}

      <Section title={<>Why people left · last 12 months <span className="font-mono text-xs text-brand">XR5–XR6</span></>}
        sub="Voluntary exits only (chose to leave, or retired). Reasons 01–10 map to the eight survey areas; 20–24 are not about culture."
        right={canEdit && !editing && <button className="btn btn-primary" onClick={() => setEditing('new')}>Record an exit</button>}>
        {!E.voluntary ? <p className="text-sm text-slate-600">No voluntary exits in the last 12 months.</p>
          : E.countsOnly ? <p className="text-sm"><b>{E.voluntary} voluntary {E.voluntary === 1 ? 'exit' : 'exits'}.</b> With fewer than 5, only counts are shown, not shares.</p>
            : <>
                <p className="text-sm"><b>{E.cultureAddressable} of {E.voluntary}</b> left mainly for a reason the clinic can work on{E.top ? <> · most-named area: <b>{AREA_NAME[E.top]}</b></> : null}</p>
                {Object.entries(E.named).sort((a, b) => (b[1] || 0) - (a[1] || 0)).map(([a, k]) => <Meter key={a} label={AREA_NAME[a]} value={k || 0} max={maxNamed} right={`${E.main[a as keyof typeof E.main] || 0} · ${k}`} />)}
                <p className="text-xs text-slate-500">Numbers: main reason · named at all (main or other). Owner-coded reasons have no validation data yet.</p>
              </>}
      </Section>

      <Section title={<>Exit records <span className="font-mono text-xs text-brand">XR1–XR9</span></>} sub="Role and month only. No names.">
        {!coded.length ? <p className="text-sm text-slate-600">No coded exits yet.</p> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-sm">
            <thead><tr className="text-left text-xs text-slate-500">{['Last day', 'Role', 'Tenure', 'Who started it', 'Main reason', 'Other', 'Went to', 'Source', 'Rehire', ''].map((h) => <th key={h} className="py-2 pr-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>{coded.map((x) => (
              <tr key={x.id} className="border-t border-slate-100 align-top">
                <td className="py-2 pr-3">{fmtMonth(x.lastDay)}</td><td className="py-2 pr-3">{ROLE_LABEL[x.role]}</td><td className="py-2 pr-3">{tenureBand(x)}</td>
                <td className="py-2 pr-3">{INITIATED_BY[x.initiatedBy!]}</td><td className="py-2 pr-3"><span className="font-mono text-xs text-brand">{x.mainReason}</span> {EXIT_REASON[x.mainReason!].label}</td>
                <td className="py-2 pr-3 font-mono text-xs">{x.otherReasons.join(' · ') || '—'}</td><td className="py-2 pr-3">{x.destination ? DESTINATION[x.destination] : '—'}</td>
                <td className="py-2 pr-3">{x.reasonSource ? REASON_SOURCE[x.reasonSource] : '—'}</td><td className="py-2 pr-3">{x.wouldRehire ? REHIRE[x.wouldRehire] : '—'}</td>
                <td className="py-2">{canEdit && <button className="btn btn-ghost px-1" onClick={() => setEditing(x.id)}>Edit</button>}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </Section>
      <Actions tool="exits" />
    </>
  );
}

function ExitForm({ rec, today, onCancel, onSave }: { rec: ExitRecord | null; today: string; onCancel: () => void; onSave: (b: unknown) => void }) {
  const [f, setF] = useState({
    lastDay: rec?.lastDay ?? today, role: (rec?.role ?? 'R2') as RoleCode, startedMonth: rec?.startedMonth ?? '',
    initiatedBy: rec?.initiatedBy ?? '', mainReason: rec?.mainReason ?? '', other1: rec?.otherReasons[0] ?? '', other2: rec?.otherReasons[1] ?? '',
    destination: rec?.destination ?? '', reasonSource: rec?.reasonSource ?? '', wouldRehire: rec?.wouldRehire ?? '',
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const sel = (k: keyof typeof f, label: string, opts: Record<string | number, string>, blank = 'Not yet') => (
    <label className="field"><span>{label}</span><select className="input" value={String(f[k])} onChange={set(k)}><option value="">{blank}</option>{Object.entries(opts).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
  );
  const reasons = Object.fromEntries(EXIT_REASONS.map((r) => [r.code, `${r.code} ${r.label}`]));
  return (
    <Section title={rec && !isCoded(rec) ? `Code the exit on ${fmtDate(rec.lastDay)}` : rec ? 'Edit exit record' : 'Record an exit'} sub="About two minutes. Last day and role are enough to start; add the reasons within 14 days." right={<button className="btn btn-ghost" onClick={onCancel}>Cancel</button>}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="field"><span>Last day worked</span><input className="input" type="date" max={today} value={f.lastDay} onChange={set('lastDay')} /></label>
        {sel('role', 'Role at exit', Object.fromEntries(ROLES.map((r) => [r.code, r.label])), 'Choose')}
        <label className="field"><span>Started (month)</span><input className="input" type="date" value={f.startedMonth} onChange={set('startedMonth')} /></label>
        {sel('initiatedBy', 'Who started the separation?', INITIATED_BY)}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {sel('mainReason', 'Main reason', reasons)}
        {sel('other1', 'Other reason', reasons, 'None')}
        {sel('other2', 'Other reason', reasons, 'None')}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {sel('destination', 'Where did they go?', DESTINATION)}
        {sel('reasonSource', 'How do you know the reason?', REASON_SOURCE)}
        {sel('wouldRehire', 'Would you rehire them in the same role?', REHIRE)}
      </div>
      <button className="btn btn-primary self-start" onClick={() => onSave({
        lastDay: f.lastDay, role: f.role, startedMonth: f.startedMonth || null, initiatedBy: f.initiatedBy || null, mainReason: f.mainReason || null,
        otherReasons: [f.other1, f.other2].filter(Boolean), destination: f.destination || null, reasonSource: f.reasonSource || null, wouldRehire: f.wouldRehire || null,
      })}>Save exit record</button>
    </Section>
  );
}
