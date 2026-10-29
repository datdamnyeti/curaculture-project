// Owner session (Supabase Auth). Staff never sign in.
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseBrowser';

interface SessionState {
  session: Session | null;
  loading: boolean;
  recovering: boolean;
}

const Ctx = createContext<SessionState>({ session: null, loading: true, recovering: false });
export const useSession = () => useContext(Ctx);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SessionState>({ session: null, loading: true, recovering: false });
  useEffect(() => {
    let sb;
    try { sb = supabase(); } catch { setState({ session: null, loading: false, recovering: false }); return; }
    sb.auth.getSession().then(({ data }) => setState((s) => ({ ...s, session: data.session, loading: false })));
    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      setState((s) => ({ session, loading: false, recovering: event === 'PASSWORD_RECOVERY' ? true : s.recovering && !!session }));
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
};
