// First run: the clinic facts the v2.1 brief says come from the manager, never from staff.
import { useState } from 'react';
import { apiFetch } from '@/lib/apiClient';

export const CLINIC_TYPES = ['Small animal general practice', 'Mixed animal practice', 'Emergency and specialty', 'Equine', 'Shelter medicine'];
export const OWNERSHIP = ['Independent, single owner', 'Independent, partnership', 'Corporate group', 'Nonprofit'];

export default function ClinicSetup({ onCreated }: { onCreated: () => void }) {
  const [f, setF] = useState({ name: '', teamSize: '', clinicType: '', ownership: '', hours: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    try { await apiFetch('/api/clinic', { method: 'POST', body: JSON.stringify(f) }); onCreated(); }
    catch (x) { setErr((x as Error).message); setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="card mx-auto flex w-full max-w-xl flex-col gap-4">
      <div className="flex flex-col gap-1"><h1 className="text-2xl font-bold">Set up your clinic</h1>
        <p className="text-sm text-slate-600">Used to describe your results. Staff are never asked these questions.</p></div>
      <label className="field"><span>Clinic name</span><input className="input" value={f.name} onChange={set('name')} required /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field"><span>Team size</span><input className="input" type="number" min={1} value={f.teamSize} onChange={set('teamSize')} /></label>
        <label className="field"><span>Hours</span><input className="input" placeholder="Mon–Fri, 7am–6pm" value={f.hours} onChange={set('hours')} /></label>
        <label className="field"><span>Clinic type</span><select className="input" value={f.clinicType} onChange={set('clinicType')}><option value="">Choose one</option>{CLINIC_TYPES.map((o) => <option key={o}>{o}</option>)}</select></label>
        <label className="field"><span>Ownership</span><select className="input" value={f.ownership} onChange={set('ownership')}><option value="">Choose one</option>{OWNERSHIP.map((o) => <option key={o}>{o}</option>)}</select></label>
      </div>
      {err && <p role="alert" className="text-sm text-orange-800">{err}</p>}
      <button className="btn btn-primary self-start" disabled={busy}>{busy ? 'Saving…' : 'Continue'}</button>
    </form>
  );
}
