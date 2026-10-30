// Surveys: send the v2.1 assessment and follow completion (counts, never names).
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell, { Clinic } from '@/components/layout/AppShell';
import { apiFetch } from '@/lib/apiClient';
import { useUI } from '@/contexts/UIContext';
import type { Counts } from '@/lib/server/surveyService';
import { fmtDate as fmt } from '@/lib/format';
import { CURRENT_VERSION, FIELDABLE } from '@/lib/instrument';
import type { DueItem } from '@/lib/practice/metrics';

interface Campaign { id: string; name: string; status: 'active' | 'closed'; closes_on: string; opens_on: string; instrument_version: string; counts: Counts }
interface Employee { id: string; name: string; email: string | null; phone: string | null }


export default function SurveysPage() {
  return <AppShell>{({ clinic, role }) => <Surveys clinic={clinic} canEdit={role === 'owner' || role === 'admin'} />}</AppShell>;
}

function Surveys({ clinic, canEdit }: { clinic: Clinic; canEdit: boolean }) {
  const [list, setList] = useState<Campaign[] | null>(null);
  const [creating, setCreating] = useState(false);
  const { showErrorToast } = useUI();
  const load = useCallback(() => apiFetch<{ campaigns: Campaign[] }>('/api/campaigns').then((r) => setList(r.campaigns)).catch((e) => showErrorToast(e.message)), [showErrorToast]);
  useEffect(() => { load(); }, [load]);
  const [due, setDue] = useState<DueItem[]>([]);
  useEffect(() => { apiFetch<{ due: DueItem[] }>('/api/practice').then((r) => setDue(r.due)).catch(() => setDue([])); }, []);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="eyebrow">{clinic.name}</p><h1 className="text-2xl font-semibold tracking-tight">Surveys</h1>
          <p className="text-sm text-slate-600">Each person gets a single-use link by email or text. Answers are stored with no link to who gave them.</p></div>
        {canEdit && !creating && <button className="btn btn-primary" onClick={() => setCreating(true)}>Send a survey</button>}
      </div>
      {due.length > 0 && (
        <Link href="/app/practice" className="card flex flex-col gap-2 hover:border-slate-400">
          <div className="flex items-center justify-between gap-2"><h2 className="font-semibold">Due from practice data</h2><span className="text-sm text-brand">Open →</span></div>
          {due.slice(0, 4).map((x) => <p key={x.key} className="text-sm"><span className={`mr-2 rounded-full px-2 py-0.5 text-xs font-semibold ${x.overdue ? 'bg-orange-50 text-orange-800' : 'bg-brand-soft text-brand'}`}>{x.badge ?? (x.overdue ? 'Overdue' : `Due ${fmt(x.due)}`)}</span>{x.title}</p>)}
          {due.length > 4 && <p className="text-sm text-slate-500">and {due.length - 4} more</p>}
        </Link>
      )}
      {creating && <NewSurvey onCancel={() => setCreating(false)} onSent={() => { setCreating(false); load(); }} />}
      {list && !list.length && !creating && (
        <div className="card flex flex-col items-center gap-3 py-10 text-center">
          <h2 className="text-lg font-semibold">No surveys yet</h2>
          <p className="max-w-md text-sm text-slate-600">Add your team, then send the baseline assessment: 41 questions, about 10–12 minutes, every question optional.</p>
          <div className="flex gap-2"><Link className="btn" href="/app/team">Add your team</Link>{canEdit && <button className="btn btn-primary" onClick={() => setCreating(true)}>Send a survey</button>}</div>
        </div>
      )}
      {list?.map((c) => {
        const k = c.counts, pct = (x: number) => (k.total ? Math.round((x / k.total) * 100) : 0);
        return (
          <Link key={c.id} href={`/app/surveys/${c.id}`} className="card flex flex-col gap-3 hover:border-slate-400">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><p className="eyebrow">Practice Assessment · {c.instrument_version}{c.instrument_version !== CURRENT_VERSION ? " · includes pilot pages" : ""}</p><h2 className="text-lg font-semibold">{c.name}</h2>
                <p className="text-sm text-slate-500">Sent {fmt(c.opens_on)} · {c.status === 'active' ? 'closes' : 'closed'} {fmt(c.closes_on)}</p></div>
              <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${c.status === 'active' ? 'bg-brand-soft text-brand' : 'bg-slate-100 text-slate-500'}`}>{c.status === 'active' ? 'Collecting' : 'Closed'}</span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-slate-200"><div className="bg-brand" style={{ width: `${pct(k.complete)}%` }} /><div className="bg-brand/40" style={{ width: `${pct(k.inProgress)}%` }} /></div>
            <p className="text-sm">{k.complete} complete · {k.inProgress} in progress · {k.notStarted} not started · {pct(k.complete)}% response rate</p>
          </Link>
        );
      })}
    </>
  );
}

function NewSurvey({ onCancel, onSent }: { onCancel: () => void; onSent: () => void }) {
  const [emps, setEmps] = useState<Employee[] | null>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [name, setName] = useState('');
  const [version, setVersion] = useState<string>(CURRENT_VERSION);
  const [closes, setCloses] = useState(() => new Date(Date.now() + 18 * 864e5).toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const { showSuccessToast } = useUI();

  useEffect(() => {
    apiFetch<{ employees: Employee[] }>('/api/employees').then((r) => { setEmps(r.employees); setSel(new Set(r.employees.filter((e) => e.email || e.phone).map((e) => e.id))); }).catch((e) => setErr(e.message));
  }, []);

  const chosen = (emps || []).filter((e) => sel.has(e.id));
  const byEmail = chosen.filter((e) => e.email).length, byText = chosen.filter((e) => !e.email && e.phone).length;
  const neither = (emps || []).filter((e) => !e.email && !e.phone);

  async function send() {
    setBusy(true); setErr('');
    try {
      const r = await apiFetch<{ sent: { email: number; text: number }; failed: number; simulated: boolean }>('/api/campaigns', {
        method: 'POST', body: JSON.stringify({ name: name.trim() || 'Practice assessment', closesOn: closes, employeeIds: [...sel], version }),
      });
      showSuccessToast(`Sent ${r.sent.email} by email and ${r.sent.text} by text${r.failed ? `; ${r.failed} failed` : ''}${r.simulated ? ' (simulated: no email or text provider is set up)' : ''}.`, 7000);
      onSent();
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  }

  return (
    <section className="card flex flex-col gap-4">
      <div className="flex items-start justify-between"><div><p className="eyebrow">New survey</p><h2 className="text-lg font-semibold">Send a survey</h2></div><button className="btn btn-ghost" onClick={onCancel}>Cancel</button></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field sm:col-span-2"><span>Survey</span><select className="input" value={version} onChange={(e) => setVersion(e.target.value)}>{FIELDABLE.map((f) => <option key={f.version} value={f.version}>{f.label}</option>)}</select>
          {version !== CURRENT_VERSION && <span className="text-xs font-normal text-slate-500">Adds two pilot pages (new team members, clients) before the written questions. Pilot, not yet validated; reported separately.</span>}</label>
        <label className="field"><span>Survey name</span><input className="input" placeholder="Spring 2027 baseline" value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="field"><span>Closes</span><input className="input" type="date" value={closes} onChange={(e) => setCloses(e.target.value)} /></label>
      </div>
      {!emps ? <p className="text-sm text-slate-500">Loading your team…</p> : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm"><span className="font-medium text-slate-600">Recipients · {sel.size} selected</span>
            <span className="flex gap-2"><button className="btn btn-ghost px-1" onClick={() => setSel(new Set(emps.filter((e) => e.email || e.phone).map((e) => e.id)))}>Select all</button><button className="btn btn-ghost px-1" onClick={() => setSel(new Set())}>Clear</button></span></div>
          <div className="max-h-64 overflow-auto rounded-lg border border-slate-200">
            {emps.map((e) => {
              const reach = e.email ? 'Email' : e.phone ? 'Text' : 'No contact';
              return (
                <label key={e.id} className={`flex items-center gap-3 border-t border-slate-100 px-3 py-2 first:border-t-0 ${reach === 'No contact' ? 'text-slate-400' : ''}`}>
                  <input type="checkbox" disabled={reach === 'No contact'} checked={sel.has(e.id)} onChange={(ev) => { const s = new Set(sel); if (ev.target.checked) s.add(e.id); else s.delete(e.id); setSel(s); }} />
                  <span>{e.name}</span><span className="ml-auto text-xs">{reach}</span>
                </label>
              );
            })}
          </div>
          <p className="text-sm">{byEmail} by email · {byText} by text{neither.length ? ` · ${neither.length} with no email or mobile can’t get a link yet` : ''}</p>
        </div>
      )}
      <p className="note">Results appear once 5 people respond. You’ll see how many have finished, never who.</p>
      {err && <p role="alert" className="text-sm text-orange-800">{err}</p>}
      <button className="btn btn-primary self-start" onClick={send} disabled={busy || sel.size < 5}>{busy ? 'Sending…' : `Send to ${sel.size} ${sel.size === 1 ? 'person' : 'people'}`}</button>
      {sel.size < 5 && <p className="text-sm text-slate-500">Choose at least 5 people so results can be shown.</p>}
    </section>
  );
}
