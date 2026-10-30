// Validation for the landing page's "Book a demo" form. Pure, so it is tested
// without a server.
import { ValidationError } from './validate';

export const TEAM_SIZES = ['Under 10', '10–30', '31–60', 'More than 60', 'Several clinics'] as const;
export type TeamSize = (typeof TEAM_SIZES)[number];

export interface DemoRequest { name: string; email: string; clinic: string; teamSize: TeamSize | null }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns null for a bot submission (the hidden `website` field is filled in). */
export function cleanDemoRequest(body: unknown): DemoRequest | null {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  if (typeof b.website === 'string' && b.website.trim()) return null;
  const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const name = str(b.name, 120);
  const email = str(b.email, 254).toLowerCase();
  const clinic = str(b.clinic, 160);
  if (!name || !clinic) throw new ValidationError('Add your name and your clinic so we can reply.');
  if (!EMAIL.test(email)) throw new ValidationError('Enter a valid work email.');
  const teamSize = TEAM_SIZES.includes(b.teamSize as TeamSize) ? (b.teamSize as TeamSize) : null;
  return { name, email, clinic, teamSize };
}
