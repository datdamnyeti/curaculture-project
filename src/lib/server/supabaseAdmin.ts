// Service-role client. Server only: it bypasses row level security, so every
// API route that uses it checks clinic membership first.
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

/** Calls a SQL function and returns its data, throwing the database's message on error. */
export type Rpc = <T = unknown>(fn: string, args: Record<string, unknown>) => Promise<T>;

export const rpc: Rpc = async <T,>(fn: string, args: Record<string, unknown>) => {
  const { data, error } = await supabaseAdmin().rpc(fn, args);
  if (error) throw new DbError(error.message);
  return data as T;
};

export class DbError extends Error {}
