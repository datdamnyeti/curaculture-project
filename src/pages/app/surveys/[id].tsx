// One survey's progress and results, following the v2.1 analysis rules:
// distributions, no overall score, no colour bands, groups of 5+ only.
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AppShell from '@/components/layout/AppShell';
import DistBar, { Legend } from '@/components/results/DistBar';
import { apiFetch } from '@/lib/apiClient';
import { supabase } from '@/lib/supabaseBrowser';
import { useUI } from '@/contexts/UIContext';
import { getInstrument } from '@/lib/instrument';
import type { Results } from '@/lib/scoring';
import type { Counts } from '@/lib/server/surveyService';
import { fmtDate, one, pct } from '@/lib/format';

interface Data {
  campaign: { id: string; name: string; status: 'active' | 'closed'; closes_on: string; opens_on: string; instrument_version: string };
  counts: Counts; results: Results; quotes: { item_id: string; body: string }[]; headcount: number | null; openEndedMode: string;
}

export default function SurveyResultsPage() {
  return <AppShell>{({ role }) => <View canEdit={role === 'owner' || role === 'admin'} />}</AppShell>;
}

function View({ canEdit }: { canEdit: boolean }) {
  const { query } = useRouter();
  const id = typeof query.id === 'string' ? query.id : '';
  const [d, setD] = useState<Data | null>(null);
  const [open, setOpen] = useState<Set<string>>(new Set(['FL']));
  const [grouping, setGrouping] = useState('role');
  const { showErrorToast, showSuccessToast, confirm } = useUI();
  const load = useCallback(() => { if (id) apiFetch<Data>(`/api/campaigns/${id}`).then(setD).catch((e) => showErrorToast(e.message)); }, [id, showErrorToast]);
  useEffect(() => { load(); }, [load]);

  if (!d) return <p className="text-slate-500">Loading…</p>;
  const { campaign: c, counts: k, results: r } = d;
  const inst = getInstrument(c.instrument_version);

  async function remind() {
    try {
      const x = await apiFetch<{ sent: { email: number; text: number }; failed: number; simulated: boolean }>(`/api/campaigns/${c.id}`, { method: 'POST', body: JSON.stringify({ action: 'remind' }) });
      showSuccessToast(`Reminder sent: ${x.sent.email} by email, ${x.sent.text} by text${x.simulated ? ' (simulated)' : ''}. Names stay hidden from you.`, 6000);
    } catch (e) { showErrorToast((e as Error).message); }
  }
  async function close() {
    if (!(await confirm({ title: 'Close this survey?', message: 'Unused links stop working and saved drafts are deleted. This can’t be undone.', confirmText: 'Close survey', type: 'warning' }))) return;
    try { await apiFetch(`/api/campaigns/${c.id}`, { method: 'POST', body: JSON.stringify({ action: 'close' }) }); load(); } catch (e) { showErrorToast((e as Error).message); }
  }
  async function exportCsv() {
    try {
      const { data } = await supabase().auth.getSession();
      const res = await fetch(`/api/campaigns/${c.id}/export`, { headers: { Authorization: `Bearer ${data.session?.access_token ?? ''}` } });
      if (!res.ok) throw new Error((await res.json()).error);
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a'); a.href = url; a.download = `curaculture-${c.id}.csv`; a.click(); URL.revokeObjectURL(url);
    } catch (e) { showErrorToast((e as Error).message); }
  }

  const rate = k.total ? k.complete / k.total : 0;
  const areas = r.areas ? [...r.areas].sort((a, b) => (b.mean ?? 0) - (a.mean ?? 0)) : [];
  const bd = r.breakdowns?.find((b) => b.key === grouping);

  return (
    <>
      <Link href="/app" className="text-sm text-brand">← All surveys</Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="eyebrow">Practice Assessment · {c.instrument_version} · {c.status === 'active' ? `collecting until ${fmtDate(c.closes_on)}` : `closed ${fmtDate(c.closes_on)}`}</p>
          <h1 className="text-2xl font-bold">{c.name}</h1></div>
        {canEdit && c.status === 'active' && <div className="flex gap-2"><button className="btn" onClick={remind}>Send reminder</button><button className="btn btn-ghost" onClick={close}>Close survey</button></div>}
      </div>

      <div className="grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-3">
        <Stat label="Responses" value={`${k.complete}`} sub={`of ${k.total} invited · ${pct(rate)}`} />
        <Stat label="Still to finish" value={`${k.inProgress + k.notStarted}`} sub={`${k.inProgress} in progress · counts only, never names`} />
        <Stat label="Coverage" value={d.headcount && k.complete / d.headcount >= 0.7 ? 'Whole team' : 'Part of the team'} sub={d.headcount ? `${Math.round((k.complete / d.headcount) * 100)}% of headcount (${d.headcount})` : 'Add your roster to see coverage'} />
      </div>

      {r.suppressed ? (
        <div className="card flex flex-col items-center gap-2 py-10 text-center">
          <h2 className="text-lg font-semibold">{r.n} {r.n === 1 ? 'response' : 'responses'} so far</h2>
          <p className="max-w-md text-sm text-slate-600">Results appear at 5 responses. With fewer, individual answers could be guessed, so nothing else is shown.</p>
        </div>
      ) : (
        <>
          <section className="card flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><h2 className="font-semibold">Areas</h2><p className="text-sm text-slate-600">Sorted by mean on the 1–6 scale. Reverse items (TC1, WR2, GD3) are recoded first, so 6 is always the favorable end. No overall score: there are no norms yet.</p></div>
              <button className="btn" onClick={() => setOpen(open.size === areas.length ? new Set() : new Set(areas.map((a) => a.id)))}>{open.size === areas.length ? 'Collapse all' : 'Show every item'}</button>
            </div>
            <Legend labels={inst.scales.agree6.labels} />
            <div>
              {areas.map((a) => (
                <div key={a.id} className="border-t border-slate-100 py-3">
                  <Row
                    name={<button className="text-left font-semibold" aria-expanded={open.has(a.id)} onClick={() => { const s = new Set(open); if (s.has(a.id)) s.delete(a.id); else s.add(a.id); setOpen(s); }}>{open.has(a.id) ? '▾' : '▸'} {a.name}</button>}
                    bar={<DistBar counts={a.counts} labels={inst.scales[a.id === 'CR' ? 'satisfy6' : 'agree6'].labels} />}
                    mean={a.mean} fav={a.favorable} />
                  {open.has(a.id) && a.items.map((i) => (
                    <div key={i.id} className="mt-2 pl-4">
                      <Row thin name={<span className="text-sm"><span className="font-mono text-xs text-brand">{i.id}</span> {i.short}{i.reverse && <span className="ml-1 text-xs text-slate-500">(reverse)</span>}<span className="block text-xs text-slate-500">“{i.text}”</span></span>}
                        bar={<DistBar thin counts={i.counts} labels={inst.scales[i.scale as 'agree6'].labels} />} mean={i.mean} fav={i.favorable} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-5 md:grid-cols-2">
            <section className="card flex flex-col gap-3">
              <h2 className="font-semibold">Intent to leave</h2>
              <p className="text-sm text-slate-600">Two separate risks, never mixed into the areas.</p>
              <Bar label="Looking, or not staying a year" v={r.intentToLeave!.clinic.looking} of={r.intentToLeave!.clinic.answered} />
              <Bar label="Undecided" v={r.intentToLeave!.clinic.undecided} of={r.intentToLeave!.clinic.answered} />
              <Bar label="Planning to stay" v={r.intentToLeave!.clinic.staying} of={r.intentToLeave!.clinic.answered} />
              <div className="border-t border-slate-100 pt-3"><Bar label="Thought seriously about leaving the profession" v={r.intentToLeave!.profession.considered} of={r.intentToLeave!.profession.answered} /></div>
              {r.intentToLeave!.items.map((i) => (
                <div key={i.id} className="flex flex-col gap-1"><span className="text-xs"><span className="font-mono text-brand">{i.id}</span> {i.text}</span>
                  <DistBar thin counts={i.counts} labels={inst.scales[i.scale as 'agree5'].labels} risk={i.id !== 'IL2'} /></div>
              ))}
            </section>
            <section className="card flex flex-col gap-3">
              <h2 className="font-semibold">Each person’s lowest area</h2>
              <p className="text-sm text-slate-600">How many respondents scored each area lowest of their eight. Ties count for each tied area.</p>
              {Object.entries(r.lowestArea!).sort((a, b) => b[1] - a[1]).map(([id, v]) => <Bar key={id} label={inst.areas.find((x) => x.id === id)!.name} v={v} of={r.n} />)}
            </section>
          </div>

          <section className="card flex flex-col gap-2">
            <h2 className="font-semibold">Supplementary items</h2>
            <p className="text-sm text-slate-600">Shown item by item and never added to any area.</p>
            {r.supplementary!.map((i) => (
              <div key={i.id} className="border-t border-slate-100 py-2">
                <Row thin name={<span className="text-sm"><span className="font-mono text-xs text-brand">{i.id}</span> {i.short}</span>} bar={<DistBar thin counts={i.counts} labels={inst.scales.agree6.labels} />} mean={i.mean} fav={i.favorable} />
              </div>
            ))}
          </section>

          <section className="card flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Group breakdowns</h2>
              <div className="flex overflow-hidden rounded-lg border border-slate-300 text-sm">
                {r.breakdowns!.map((b) => <button key={b.key} onClick={() => setGrouping(b.key)} aria-pressed={grouping === b.key} className={`px-3 py-1 ${grouping === b.key ? 'bg-brand-soft font-semibold' : ''}`}>{b.label}</button>)}
              </div></div>
            {bd && !bd.shown && <p className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-600">{bd.hiddenReason}</p>}
            {bd?.shown && (
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead><tr className="text-left text-xs uppercase tracking-wider text-slate-500"><th className="py-2">Area</th>{bd.groups.map((g) => <th key={g.id} className="py-2 text-right">{g.label}<div className="normal-case tracking-normal">n = {g.n}</div></th>)}</tr></thead>
                <tbody>{inst.areas.map((a) => <tr key={a.id} className="border-t border-slate-100"><td className="py-2">{a.name}</td>{bd.groups.map((g) => <td key={g.id} className="py-2 text-right font-mono">{one(g.areas![a.id])}</td>)}</tr>)}</tbody>
              </table></div>
            )}
          </section>

          <section className="card flex flex-col gap-2">
            <h2 className="font-semibold">In their own words</h2>
            {d.openEndedMode === 'hidden' ? <p className="text-sm text-slate-600">Written answers are hidden from owners for this clinic.</p>
              : d.quotes.length ? d.quotes.map((q, i) => <p key={i} className="text-sm">“{q.body}” <span className="text-xs text-slate-500">{q.item_id}</span></p>)
              : <p className="text-sm text-slate-600">No approved quotes yet. A researcher screens written answers before owners see them.</p>}
          </section>

          {canEdit && <section className="card flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="font-semibold">Item-level export</h2><p className="text-sm text-slate-600">Raw codes by item ID with instrument version and survey ID. Written answers are left out.</p></div>
            <button className="btn" onClick={exportCsv}>Download CSV</button>
          </section>}
        </>
      )}
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return <div className="flex flex-col gap-0.5 bg-white p-4"><span className="eyebrow">{label}</span><span className="text-2xl font-bold">{value}</span><span className="text-xs text-slate-500">{sub}</span></div>;
}

function Row({ name, bar, mean, fav, thin }: { name: React.ReactNode; bar: React.ReactNode; mean: number | null; fav: number; thin?: boolean }) {
  return (
    <div className={`grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 sm:grid-cols-[minmax(10rem,14rem)_1fr_4rem_4rem] ${thin ? '' : ''}`}>
      <div className="min-w-0">{name}</div>
      <div className="col-span-2 sm:col-span-1 sm:order-none">{bar}</div>
      <div className="text-right font-mono text-sm">{one(mean)}</div>
      <div className="text-right font-mono text-sm">{pct(fav)}<span className="block font-sans text-[0.65rem] text-slate-500">favorable</span></div>
    </div>
  );
}

function Bar({ label, v, of }: { label: string; v: number; of: number }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-sm sm:grid-cols-[minmax(10rem,14rem)_1fr_5.5rem]">
      <span>{label}</span>
      <div className="col-span-2 h-2 overflow-hidden rounded-full bg-slate-100 sm:col-span-1"><div className="h-full bg-brand" style={{ width: `${of ? (v / of) * 100 : 0}%` }} /></div>
      <span className="text-right font-mono">{v} of {of}</span>
    </div>
  );
}
