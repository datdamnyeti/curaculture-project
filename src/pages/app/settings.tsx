// Clinic facts and the open survey decisions from the v2.1 brief.
import { useState } from 'react';
import AppShell, { Clinic } from '@/components/layout/AppShell';
import { CLINIC_TYPES, OWNERSHIP } from '@/components/layout/ClinicSetup';
import { apiFetch } from '@/lib/apiClient';
import { useUI } from '@/contexts/UIContext';

export default function SettingsPage() {
  return <AppShell>{({ clinic, role, reload }) => <Settings clinic={clinic} canEdit={role === 'owner' || role === 'admin'} reload={reload} />}</AppShell>;
}

function Settings({ clinic, canEdit, reload }: { clinic: Clinic; canEdit: boolean; reload: () => void }) {
  const [f, setF] = useState({ name: clinic.name, teamSize: clinic.team_size ?? '', clinicType: clinic.clinic_type ?? '', ownership: clinic.ownership ?? '', hours: clinic.hours ?? '' });
  const { showSuccessToast, showErrorToast } = useUI();
  const save = async (body: Record<string, unknown>, msg: string) => {
    try { await apiFetch('/api/clinic', { method: 'PATCH', body: JSON.stringify(body) }); showSuccessToast(msg); reload(); }
    catch (e) { showErrorToast((e as Error).message); }
  };
  const radio = (name: string, value: string, current: string, title: string, sub: string, body: Record<string, unknown>) => (
    <label className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${current === value ? 'border-brand bg-brand-soft' : 'border-slate-200'}`}>
      <input type="radio" name={name} disabled={!canEdit} checked={current === value} onChange={() => save(body, 'Saved.')} className="mt-1" />
      <span className="flex flex-col gap-0.5"><b className="text-sm">{title}</b><span className="text-sm text-slate-600">{sub}</span></span>
    </label>
  );
  return (
    <>
      <div><p className="eyebrow">Settings</p><h1 className="text-2xl font-semibold tracking-tight">{clinic.name}</h1></div>
      <form className="card flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); save(f, 'Clinic facts saved.'); }}>
        <h2 className="font-semibold">Clinic facts</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field"><span>Clinic name</span><input className="input" disabled={!canEdit} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
          <label className="field"><span>Team size</span><input className="input" type="number" min={1} disabled={!canEdit} value={f.teamSize} onChange={(e) => setF({ ...f, teamSize: e.target.value })} /></label>
          <label className="field"><span>Clinic type</span><select className="input" disabled={!canEdit} value={f.clinicType} onChange={(e) => setF({ ...f, clinicType: e.target.value })}><option value="">Choose one</option>{CLINIC_TYPES.map((o) => <option key={o}>{o}</option>)}</select></label>
          <label className="field"><span>Ownership</span><select className="input" disabled={!canEdit} value={f.ownership} onChange={(e) => setF({ ...f, ownership: e.target.value })}><option value="">Choose one</option>{OWNERSHIP.map((o) => <option key={o}>{o}</option>)}</select></label>
          <label className="field sm:col-span-2"><span>Hours</span><input className="input" disabled={!canEdit} value={f.hours} onChange={(e) => setF({ ...f, hours: e.target.value })} /></label>
        </div>
        {canEdit && <button className="btn btn-primary self-start">Save</button>}
      </form>
      <section className="card flex flex-col gap-3">
        <h2 className="font-semibold">Who runs the survey</h2>
        <p className="text-sm text-slate-600">Sets what staff are promised on the first page and in the invitation.</p>
        {radio('intro', 'researcher', clinic.survey_intro, 'An independent researcher runs it', '“Run by an independent researcher, not by clinic management.” A researcher screens written answers.', { surveyIntro: 'researcher' })}
        {radio('intro', 'selfserve', clinic.survey_intro, 'We send it ourselves through CuraCulture', '“Runs through CuraCulture, an independent platform; your clinic never sees individual answers.” Written answers are hidden from owners.', { surveyIntro: 'selfserve' })}
      </section>
      <section className="card flex flex-col gap-3">
        <h2 className="font-semibold">Written answers</h2>
        {radio('oe', 'screened', clinic.open_ended_mode, 'Researcher screens; owners see approved quotes', 'Requires a researcher. Not available with self-serve.', { openEndedMode: 'screened' })}
        {radio('oe', 'hidden', clinic.open_ended_mode, 'Hidden from owners', 'Owners never see the text.', { openEndedMode: 'hidden' })}
      </section>
    </>
  );
}
