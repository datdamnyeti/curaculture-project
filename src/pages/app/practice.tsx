// Practice data: the v2.2 pilot owner tools. Records the clinic keeps about
// itself (staffing, exits, onboarding, client safety), shown next to what
// staff said. Pilot, not yet validated.
import { useCallback, useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { apiFetch } from '@/lib/apiClient';
import { useUI } from '@/contexts/UIContext';
import type { PracticeOverview } from '@/lib/server/practiceService';
import { Pilot } from '@/components/practice/shared';
import Overview from '@/components/practice/Overview';
import VitalsSection from '@/components/practice/Vitals';
import ExitsSection from '@/components/practice/Exits';
import OnboardingSection from '@/components/practice/Onboarding';
import SafetySection from '@/components/practice/Safety';
import type { SectionProps, View } from '@/components/practice/types';

const VIEWS: [View, string][] = [['overview', 'Overview'], ['vitals', 'Vitals'], ['exits', 'Exits'], ['onboarding', 'Onboarding'], ['safety', 'Client safety']];

export default function PracticePage() {
  return <AppShell>{({ role }) => <Practice canEdit={role === 'owner' || role === 'admin'} />}</AppShell>;
}

function Practice({ canEdit }: { canEdit: boolean }) {
  const [d, setD] = useState<PracticeOverview | null>(null);
  const [view, setView] = useState<View>('overview');
  const { showErrorToast, showSuccessToast } = useUI();
  const reload = useCallback(async () => {
    try { setD(await apiFetch<PracticeOverview>('/api/practice')); } catch (e) { showErrorToast((e as Error).message); }
  }, [showErrorToast]);
  useEffect(() => { reload(); }, [reload]);

  const save: SectionProps['save'] = async (path, method, body, ok) => {
    try {
      await apiFetch(path, { method, body: body === undefined ? undefined : JSON.stringify(body) });
      if (ok) showSuccessToast(ok);
      await reload();
      return true;
    } catch (e) { showErrorToast((e as Error).message); return false; }
  };
  const go = (v: View) => { setView(v); window.scrollTo(0, 0); };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1"><p className="eyebrow">Measure · owner records</p><h1 className="text-2xl font-semibold tracking-tight">Practice data</h1>
          <p className="max-w-3xl text-sm text-slate-600">What the clinic records about itself: staffing, exits, onboarding and client safety. These describe the clinic, not anyone’s survey answers, so the 5-response rule does not apply. Counts come first and rates second, because small numbers swing.</p></div>
        <Pilot />
      </div>
      <nav aria-label="Practice data sections" className="flex w-fit max-w-full overflow-x-auto rounded-lg border border-line bg-white p-1 text-sm">
        {VIEWS.map(([k, l]) => (
          <button key={k} onClick={() => go(k)} aria-pressed={view === k}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 font-medium ${view === k ? 'bg-brand-ink text-white' : 'text-slate-600 hover:text-brand-ink'}`}>{l}</button>
        ))}
      </nav>
      {!d ? <p className="text-slate-500">Loading…</p> : (() => {
        const p: SectionProps = { d, canEdit, reload, go, save };
        if (view === 'vitals') return <VitalsSection {...p} />;
        if (view === 'exits') return <ExitsSection {...p} />;
        if (view === 'onboarding') return <OnboardingSection {...p} />;
        if (view === 'safety') return <SafetySection {...p} />;
        return <Overview {...p} />;
      })()}
    </>
  );
}
