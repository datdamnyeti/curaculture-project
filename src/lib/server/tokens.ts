// Survey links. The raw token is never stored: it is derived from the
// invitation id with a server secret, so reminders can rebuild the same link,
// and only sha256(token) is kept for lookup.
import { createHash, createHmac, randomUUID } from 'node:crypto';

function secret(): string {
  const s = process.env.SURVEY_TOKEN_SECRET;
  if (!s || s.length < 32) throw new Error('SURVEY_TOKEN_SECRET must be set to at least 32 characters');
  return s;
}

export function newInvitationId(): string {
  return randomUUID();
}

export function tokenFor(invitationId: string, key = secret()): string {
  return createHmac('sha256', key).update(`invitation:${invitationId}`).digest('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Tokens are 43 base64url characters. Reject anything else before touching the database. */
export function isWellFormed(token: unknown): token is string {
  return typeof token === 'string' && /^[A-Za-z0-9_-]{43}$/.test(token);
}

export function surveyUrl(token: string): string {
  const base = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${base}/s/${token}`;
}
