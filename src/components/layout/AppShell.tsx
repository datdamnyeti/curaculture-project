// Owner layout: requires a session, loads the clinic, offers setup if there is none.
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/lib/supabaseBrowser';
import { apiFetch } from '@/lib/apiClient';
import ClinicSetup from './ClinicSetup';

export interface Clinic {
  id: string; name: string; team_size: number | null; clinic_type: string | null; ownership: string | null; hours: string | null;
  survey_intro: 'researcher' | 'selfserve'; open_ended_mode: 'screened' | 'hidden';
}

const TABS = [
  { href: '/app', label: 'Surveys' },
  { href: '/app/team', label: 'Team' },
  { href: '/app/settings', label: 'Settings' },
];

export default function AppShell({ children }: { children: (ctx: { clinic: Clinic; role: string; reload: () => void }) => React.ReactNode }) {
  const { session, loading } = useSession();
  const router = useRouter();
  const [state, setState] = useState<{ clinic: Clinic | null; role?: string } | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    apiFetch<{ clinic: Clinic | null; role?: string }>('/api/clinic').then(setState).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!session) { router.replace('/login'); return; }
    load();
  }, [loading, session, router, load]);

  const signOut = async () => { await supabase().auth.signOut(); router.replace('/'); };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 pt-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/app" className="flex items-center gap-2 text-lg font-bold"><Logo />CuraCulture</Link>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              {state?.clinic && <span>{state.clinic.name}</span>}
              {session && <button className="btn btn-ghost px-1" onClick={signOut}>Sign out</button>}
            </div>
          </div>
          {state?.clinic && (
            <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Sections">
              {TABS.map((t) => {
                const on = t.href === '/app' ? router.pathname === '/app' || router.pathname.startsWith('/app/surveys') : router.pathname.startsWith(t.href);
                return <Link key={t.href} href={t.href} aria-current={on ? 'page' : undefined}
                  className={`whitespace-nowrap border-b-2 px-3 pb-2.5 pt-1 text-sm font-medium ${on ? 'border-brand text-brand-ink' : 'border-transparent text-slate-500 hover:text-brand-ink'}`}>{t.label}</Link>;
              })}
            </nav>
          )}
        </div>
      </header>
      <main className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6">
        {error && <p role="alert" className="rounded-lg bg-orange-50 px-4 py-3 text-sm text-orange-900">{error}</p>}
        {!state && !error && <p className="text-slate-500">Loading…</p>}
        {state && !state.clinic && <ClinicSetup onCreated={load} />}
        {state?.clinic && children({ clinic: state.clinic, role: state.role || 'viewer', reload: load })}
      </main>
    </div>
  );
}

export function Logo() {
  return (
    <svg width="24" height="24" viewBox="0 0 26 26" aria-hidden="true"><rect width="26" height="26" rx="7" fill="#1b6984" />
      <path d="M7 15.5c1.6 2.6 4 3.8 6 3.8 3.4 0 6-2.7 6-6.3S16.4 6.7 13 6.7c-2 0-3.6.9-4.7 2.4" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="13" cy="13" r="2.2" fill="#fff" /></svg>
  );
}
