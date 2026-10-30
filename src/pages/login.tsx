// Owner sign-in. Staff never sign in; they use the link in their email or text.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseBrowser';
import { useSession } from '@/contexts/SessionContext';
import { Wordmark } from '@/components/brand/Logo';

type Mode = 'signin' | 'signup' | 'reset' | 'update' | 'sent';

export default function Login() {
  const router = useRouter();
  const { session, recovering } = useSession();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (router.query.mode === 'signup') setMode('signup'); }, [router.query.mode]);
  useEffect(() => { if (recovering) setMode('update'); else if (session && mode !== 'update') router.replace('/app'); }, [session, recovering, mode, router]);

  const redirect = () => `${window.location.origin}/login`;

  async function run(fn: () => Promise<{ error: { message: string } | null }>, after?: () => void) {
    setBusy(true); setErr('');
    const { error } = await fn();
    setBusy(false);
    if (error) setErr(error.message); else after?.();
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const sb = supabase();
    if (mode === 'signin') return run(() => sb.auth.signInWithPassword({ email, password }));
    if (mode === 'signup') {
      if (password.length < 10) { setErr('Use a password of at least 10 characters.'); return; }
      return run(() => sb.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/app` } }), () => { setMsg(`We sent a confirmation link to ${email}. Open it to set up your clinic.`); setMode('sent'); });
    }
    if (mode === 'reset') return run(() => sb.auth.resetPasswordForEmail(email, { redirectTo: redirect() }), () => { setMsg(`If an account exists for ${email}, a reset link is on its way.`); setMode('sent'); });
    if (mode === 'update') {
      if (password.length < 10) { setErr('Use a password of at least 10 characters.'); return; }
      return run(() => sb.auth.updateUser({ password }), () => router.replace('/app'));
    }
  };
  const magic = () => {
    if (!email) { setErr('Enter your work email to get a sign-in link.'); return; }
    run(() => supabase().auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/app`, shouldCreateUser: false } }),
      () => { setMsg(`We sent a sign-in link to ${email}. It works once.`); setMode('sent'); });
  };

  const titles: Record<Mode, string> = { signin: 'Sign in', signup: 'Create your clinic’s account', reset: 'Reset your password', update: 'Set a new password', sent: 'Check your email' };

  return (
    <div className="flex min-h-screen flex-col items-center gap-5 px-4 py-10">
      <Link href="/" aria-label="CuraCulture home"><Wordmark /></Link>
      <form onSubmit={submit} className="card flex w-full max-w-md flex-col gap-4 sm:p-7">
        <div><h1 className="text-2xl font-semibold tracking-tight">{titles[mode]}</h1>
          {mode === 'signin' && <p className="text-sm text-slate-600">For practice owners, managers and medical directors.</p>}
          {mode === 'signup' && <p className="text-sm text-slate-600">You’ll set up your clinic and team next. Staff never need accounts.</p>}</div>
        {mode === 'sent' ? <p className="text-slate-700">{msg}</p> : (
          <>
            {mode !== 'update' && <label className="field"><span>Work email</span><input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>}
            {mode !== 'reset' && (
              <label className="field"><span className="flex justify-between">Password {mode === 'signin' && <button type="button" className="font-normal text-brand" onClick={() => { setMode('reset'); setErr(''); }}>Forgot password?</button>}</span>
                <input className="input" type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} required value={password} onChange={(e) => setPassword(e.target.value)} />
                {(mode === 'signup' || mode === 'update') && <span className="text-xs font-normal text-slate-500">At least 10 characters.</span>}</label>
            )}
            {err && <p role="alert" className="text-sm text-orange-800">{err}</p>}
            <button className="btn btn-primary py-2.5" disabled={busy}>{busy ? 'Working…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Save password'}</button>
            {mode === 'signin' && <button type="button" className="btn" onClick={magic} disabled={busy}>Email me a sign-in link</button>}
          </>
        )}
        <p className="text-sm">
          {mode === 'signin' && <>New clinic? <button type="button" className="text-brand" onClick={() => { setMode('signup'); setErr(''); }}>Create an account</button></>}
          {mode !== 'signin' && mode !== 'update' && <button type="button" className="text-brand" onClick={() => { setMode('signin'); setErr(''); }}>Back to sign in</button>}
        </p>
      </form>
      <p className="max-w-md rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600"><b>Staff:</b> you don’t need an account. Open the survey from the link in your email or text.</p>
    </div>
  );
}
