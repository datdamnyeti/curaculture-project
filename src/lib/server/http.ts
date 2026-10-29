// Shared helpers for API routes: auth, membership checks, error mapping.
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from './supabaseAdmin';
import { Conflict, NotFound } from './surveyService';
import { ValidationError } from '../validate';

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export type Handler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

export function api(methods: Record<string, Handler>): Handler {
  return async (req, res) => {
    const h = methods[req.method || 'GET'];
    if (!h) { res.setHeader('Allow', Object.keys(methods).join(', ')); res.status(405).json({ error: 'Method not allowed' }); return; }
    try {
      await h(req, res);
    } catch (e) {
      if (e instanceof HttpError) { res.status(e.status).json({ error: e.message }); return; }
      if (e instanceof ValidationError) { res.status(400).json({ error: e.message }); return; }
      if (e instanceof NotFound) { res.status(404).json({ error: e.message }); return; }
      if (e instanceof Conflict) { res.status(409).json({ error: e.message }); return; }
      console.error(e);
      res.status(500).json({ error: 'Something went wrong on our side. Try again in a minute.' });
    }
  };
}

export async function requireUser(req: NextApiRequest): Promise<{ id: string; email: string | null }> {
  const header = req.headers.authorization || '';
  const jwt = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!jwt) throw new HttpError(401, 'Sign in to continue.');
  const { data, error } = await supabaseAdmin().auth.getUser(jwt);
  if (error || !data.user) throw new HttpError(401, 'Your session has expired. Sign in again.');
  return { id: data.user.id, email: data.user.email ?? null };
}

export type Role = 'owner' | 'admin' | 'viewer' | 'researcher';

/** The signed-in user's clinic. One clinic per user for now. */
export async function requireClinic(userId: string, roles?: Role[]): Promise<{ clinicId: string; role: Role }> {
  const { data, error } = await supabaseAdmin()
    .from('clinic_members').select('clinic_id, role').eq('user_id', userId).order('created_at').limit(1);
  if (error) throw error;
  if (!data || !data.length) throw new HttpError(404, 'No clinic yet. Set up your clinic first.');
  const m = data[0] as { clinic_id: string; role: Role };
  if (roles && !roles.includes(m.role)) throw new HttpError(403, 'Your access level can’t do this. Ask a clinic admin.');
  return { clinicId: m.clinic_id, role: m.role };
}

export async function requireCampaign(clinicId: string, campaignId: unknown) {
  if (typeof campaignId !== 'string') throw new HttpError(400, 'Missing campaign id.');
  const { data, error } = await supabaseAdmin()
    .from('campaigns').select('*').eq('id', campaignId).eq('clinic_id', clinicId).maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, 'Survey not found.');
  return data as { id: string; name: string; instrument_version: string; status: 'active' | 'closed'; closes_on: string; opens_on: string; kind: string };
}

export const ADMIN_ROLES: Role[] = ['owner', 'admin'];
