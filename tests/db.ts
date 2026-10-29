// Spins up an in-memory Postgres (PGlite) with the pieces of Supabase the
// migration relies on: the auth schema, auth.uid() and the standard roles.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const MIGRATIONS = path.join(__dirname, '..', 'supabase', 'migrations');

export async function freshDb() {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin;
    create schema auth;
    create table auth.users (id uuid primary key default gen_random_uuid(), email text);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  `);
  for (const f of readdirSync(MIGRATIONS).sort()) {
    await db.exec(readFileSync(path.join(MIGRATIONS, f), 'utf8'));
  }
  return db;
}

import type { Rpc } from '../src/lib/server/supabaseAdmin';

/** Calls SQL functions the way supabase.rpc does: named arguments, set-returning
 *  functions come back as row arrays, scalar functions as the bare value. */
export function pgRpc(db: PGlite): Rpc {
  return (async (fn: string, args: Record<string, unknown>) => {
    const keys = Object.keys(args);
    const sql = `select * from public.${fn}(${keys.map((k, i) => `${k} => $${i + 1}`).join(', ')})`;
    const params = keys.map((k) => {
      const v = args[k];
      return v !== null && typeof v === 'object' && !Array.isArray(v) ? JSON.stringify(v) : v;
    });
    const r = await db.query<Record<string, unknown>>(sql, params);
    if (r.fields.length === 1 && r.fields[0].name === fn) return r.rows.length ? r.rows[0][fn] : null;
    return r.rows;
  }) as Rpc;
}
