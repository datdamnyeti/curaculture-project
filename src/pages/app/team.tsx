// The roster. Contact details only send links and count headcount.
import { useCallback, useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { apiFetch } from '@/lib/apiClient';
import { useUI } from '@/contexts/UIContext';

interface Employee { id: string; name: string; email: string | null; phone: string | null; role_code: number | null }
const ROLES = ['Veterinarian', 'Credentialed technician', 'Technician (not credentialed)', 'Veterinary assistant', 'Practice manager', 'Client service', 'Kennel / animal care', 'Other'];

export default function TeamPage() {
  return <AppShell>{({ role }) => <Team canEdit={role === 'owner' || role === 'admin'} />}</AppShell>;
}

function parseLine(line: string) {
  const [name, contact = ''] = line.split(',').map((s) => s.trim());
  const c = contact.trim();
  return { name, email: c.includes('@') ? c : '', phone: !c.includes('@') && /\d/.test(c) ? c : '' };
}

function Team({ canEdit }: { canEdit: boolean }) {
  const [list, setList] = useState<Employee[] | null>(null);
  const [f, setF] = useState({ name: '', email: '', phone: '', roleCode: '' });
  const [bulk, setBulk] = useState('');
  const { showErrorToast, showSuccessToast, confirm } = useUI();
  const load = useCallback(() => apiFetch<{ employees: Employee[] }>('/api/employees').then((r) => setList(r.employees)).catch((e) => showErrorToast(e.message)), [showErrorToast]);
  useEffect(() => { load(); }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    try { await apiFetch('/api/employees', { method: 'POST', body: JSON.stringify(f) }); setF({ name: '', email: '', phone: '', roleCode: '' }); load(); }
    catch (x) { showErrorToast((x as Error).message); }
  }
  async function importRows() {
    const rows = bulk.split('\n').map((l) => l.trim()).filter(Boolean).map(parseLine);
    if (!rows.length) return;
    try { await apiFetch('/api/employees', { method: 'POST', body: JSON.stringify({ rows }) }); setBulk(''); showSuccessToast(`Added ${rows.length} ${rows.length === 1 ? 'person' : 'people'}.`); load(); }
    catch (x) { showErrorToast((x as Error).message); }
  }
  async function remove(emp: Employee) {
    if (!(await confirm({ title: `Remove ${emp.name}?`, message: 'They won’t get future surveys. Past surveys keep their counts.', confirmText: 'Remove', type: 'danger' }))) return;
    try { await apiFetch(`/api/employees?id=${emp.id}`, { method: 'DELETE' }); load(); } catch (x) { showErrorToast((x as Error).message); }
  }

  const n = list?.length ?? 0, email = list?.filter((e) => e.email).length ?? 0, text = list?.filter((e) => !e.email && e.phone).length ?? 0;
  return (
    <>
      <div><p className="eyebrow">Headcount</p><h1 className="text-2xl font-bold">Team · {n} {n === 1 ? 'person' : 'people'}</h1>
        <p className="text-sm text-slate-600">Everyone who should get the survey, including part-time and relief staff. {email} by email · {text} by text · {n - email - text} with neither.</p></div>
      {canEdit && (
        <div className="grid gap-5 md:grid-cols-2">
          <form onSubmit={add} className="card flex flex-col gap-3">
            <h2 className="font-semibold">Add a person</h2>
            <label className="field"><span>Name</span><input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="field"><span>Work email (optional)</span><input className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
              <label className="field"><span>Mobile (optional)</span><input className="input" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
            </div>
            <label className="field"><span>Role (for headcount only)</span><select className="input" value={f.roleCode} onChange={(e) => setF({ ...f, roleCode: e.target.value })}><option value="">Choose one</option>{ROLES.map((r, i) => <option key={r} value={i + 1}>{r}</option>)}</select></label>
            <button className="btn btn-primary self-start">Add</button>
          </form>
          <div className="card flex flex-col gap-3">
            <h2 className="font-semibold">Paste a list</h2>
            <label className="field"><span>One per line: name, then an email or a mobile number</span>
              <textarea className="input min-h-32 font-mono text-xs" value={bulk} onChange={(e) => setBulk(e.target.value)} placeholder={'Jordan Reyes, jordan@clinic.com\nMaya Fox, (406) 555-0133'} /></label>
            <button className="btn self-start" onClick={importRows}>Import</button>
          </div>
        </div>
      )}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-wider text-slate-500"><th className="px-4 py-3">Name</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Link by</th><th /></tr></thead>
          <tbody>
            {list?.map((e) => (
              <tr key={e.id} className="border-t border-slate-100">
                <td className="px-4 py-2.5">{e.name}<div className="text-xs text-slate-500">{e.role_code ? ROLES[e.role_code - 1] : ''}</div></td>
                <td className="px-4 py-2.5 text-slate-600">{e.email || e.phone || '—'}</td>
                <td className="px-4 py-2.5">{e.email ? 'Email' : e.phone ? 'Text' : <span className="text-orange-700">No contact</span>}</td>
                <td className="px-4 py-2.5 text-right">{canEdit && <button className="btn btn-ghost px-1" onClick={() => remove(e)}>Remove</button>}</td>
              </tr>
            ))}
            {list && !list.length && <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">No one yet. Add people above.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
