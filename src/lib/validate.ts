// Server-side validation of what a respondent sends. Every item is optional,
// but every value that is present must be a real code for that item.
import type { Instrument } from './instrument';
import { isShown, itemMap, scaleCodes } from './instrument';

export interface Submission {
  demographics: Record<string, number | string>;
  answers: Record<string, number>;
  openEnded: Record<string, string>;
}

export const MAX_TEXT = 2000;

export class ValidationError extends Error {}

export function cleanSubmission(inst: Instrument, raw: unknown): Submission {
  const body = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const items = itemMap(inst);
  const out: Submission = { demographics: {}, answers: {}, openEnded: {} };

  const demo = (body.demographics ?? {}) as Record<string, unknown>;
  for (const [k, v] of Object.entries(demo)) {
    if (k === 'D1_other') {
      if (typeof v !== 'string') throw new ValidationError('D1_other must be text');
      const t = v.trim().slice(0, 200);
      if (t) out.demographics.D1_other = t;
      continue;
    }
    const d = inst.demographics.find((x) => x.id === k);
    if (!d) throw new ValidationError(`Unknown question ${k}`);
    if (v == null) continue;
    if (!Number.isInteger(v) || (v as number) < 1 || (v as number) > d.options.length) throw new ValidationError(`Invalid answer for ${k}`);
    out.demographics[k] = v as number;
  }
  if (out.demographics.D1_other && out.demographics.D1 !== inst.demographics[0].otherCode) delete out.demographics.D1_other;

  const answers = (body.answers ?? {}) as Record<string, unknown>;
  for (const [k, v] of Object.entries(answers)) {
    const it = items[k];
    if (!it || it.kind === 'open') throw new ValidationError(`Unknown question ${k}`);
    if (v == null) continue;
    if (!Number.isInteger(v) || !scaleCodes(inst, it).includes(v as number)) throw new ValidationError(`Invalid answer for ${k}`);
    out.answers[k] = v as number;
  }
  // A conditional follow-up is kept only if the answers that trigger it are there.
  for (const k of Object.keys(out.answers)) {
    if (!isShown(items[k], out.answers)) delete out.answers[k];
  }

  const open = (body.openEnded ?? {}) as Record<string, unknown>;
  for (const [k, v] of Object.entries(open)) {
    const it = items[k];
    if (!it || it.kind !== 'open') throw new ValidationError(`Unknown question ${k}`);
    if (v == null) continue;
    if (typeof v !== 'string') throw new ValidationError(`Invalid answer for ${k}`);
    const t = v.trim().slice(0, MAX_TEXT);
    if (t) out.openEnded[k] = t;
  }
  return out;
}

/** A draft is the same shape plus the page the respondent was on. */
export function cleanDraft(inst: Instrument, raw: unknown): Submission & { page: number } {
  const s = cleanSubmission(inst, raw);
  const page = Number((raw as { page?: unknown } | null)?.page ?? 0);
  return { ...s, page: Number.isInteger(page) && page >= 0 && page < inst.pages.length ? page : 0 };
}
