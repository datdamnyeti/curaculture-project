import { describe, expect, it } from 'vitest';
import { freshDb } from './db';
import { cleanDemoRequest } from '../src/lib/demoRequest';
import { ValidationError } from '../src/lib/validate';

describe('demo request form', () => {
  it('cleans a valid request', () => {
    expect(cleanDemoRequest({ name: ' Dana Vet ', email: 'Dana@Clinic.Example', clinic: 'Rimrock Vet', teamSize: '10–30' }))
      .toEqual({ name: 'Dana Vet', email: 'dana@clinic.example', clinic: 'Rimrock Vet', teamSize: '10–30' });
  });

  it('drops an unknown team size rather than failing', () => {
    expect(cleanDemoRequest({ name: 'A', email: 'a@b.co', clinic: 'C', teamSize: 'huge' })?.teamSize).toBeNull();
  });

  it('asks for a name, clinic and a real email', () => {
    expect(() => cleanDemoRequest({ email: 'a@b.co', clinic: 'C' })).toThrow(ValidationError);
    expect(() => cleanDemoRequest({ name: 'A', email: 'a@b.co' })).toThrow(ValidationError);
    expect(() => cleanDemoRequest({ name: 'A', email: 'not-an-email', clinic: 'C' })).toThrow(/valid work email/);
  });

  it('treats a filled hidden field as a bot and stores nothing', () => {
    expect(cleanDemoRequest({ name: 'A', email: 'a@b.co', clinic: 'C', website: 'spam.example' })).toBeNull();
  });
});

describe('demo_requests table', () => {
  it('stores a request with row level security on', async () => {
    const db = await freshDb();
    await db.query(`insert into demo_requests (name, email, clinic, team_size) values ('A', 'a@b.co', 'C', 'Under 10')`);
    const r = await db.query<{ n: number; status: string }>(`select count(*)::int as n, min(status) as status from demo_requests`);
    expect(r.rows[0]).toEqual({ n: 1, status: 'new' });
    const rls = await db.query<{ relrowsecurity: boolean }>(`select relrowsecurity from pg_class where relname = 'demo_requests'`);
    expect(rls.rows[0].relrowsecurity).toBe(true);
  });

  it('rejects a team size outside the form’s options', async () => {
    const db = await freshDb();
    await expect(db.query(`insert into demo_requests (name, email, clinic, team_size) values ('A', 'a@b.co', 'C', 'huge')`)).rejects.toThrow();
  });
});
