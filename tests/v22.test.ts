import { describe, expect, it } from 'vitest';
import { V21 } from '../src/lib/instrument/v21';
import { V22 } from '../src/lib/instrument/v22';
import { FIELDABLE, getInstrument, isShown, itemMap } from '../src/lib/instrument';
import { buildResults, exportCsv, StoredResponse } from '../src/lib/scoring';
import { cleanSubmission, ValidationError } from '../src/lib/validate';

const resp = (answers: Record<string, number>, demo: Record<string, number> = {}): StoredResponse => ({ answers, demographics: demo });

describe('instrument v2.2-pilot', () => {
  const asked = V22.pages.flatMap((p) => p.items ?? []);

  it('is registered and can be sent', () => {
    expect(getInstrument('v2.2-pilot')).toBe(V22);
    expect(FIELDABLE.map((f) => f.version)).toEqual(['v2.1', 'v2.2-pilot']);
  });

  it('keeps every v2.1 item, word for word, and adds 8 pilot items', () => {
    const v21 = itemMap(V21), v22 = itemMap(V22);
    for (const i of V21.items) expect(v22[i.id]).toEqual(v21[i.id]);
    expect(V22.items.length - V21.items.length).toBe(8);
    expect(asked).toHaveLength(49);
    expect(new Set(asked).size).toBe(49);
  });

  it('puts the pilot pages after Compensation and immediately before the written questions', () => {
    expect(V22.pages.map((p) => p.id)).toEqual(['intro', 'demo', 'il', 'A', 'B', 'C', 'D', 'comp', 'oi', 'ca', 'open', 'close']);
    expect(V22.pages.find((p) => p.id === 'ca')!.items).toEqual(['CA1', 'CA2', 'CA3', 'CA4']);
    expect(V22.pages.filter((p) => p.pilot).map((p) => p.id)).toEqual(['oi', 'ca']);
  });

  it('codes the frequency scale 0–4 and asks CA4 only after an incident', () => {
    expect(V22.scales.freq5!.codes).toEqual([0, 1, 2, 3, 4]);
    const ca4 = itemMap(V22).CA4;
    expect(isShown(ca4, {})).toBe(false);
    expect(isShown(ca4, { CA1: 0, CA2: 0 })).toBe(false);
    expect(isShown(ca4, { CA1: 0, CA2: 1 })).toBe(true);
    expect(isShown(ca4, { CA1: 3 })).toBe(true);
  });

  it('leaves v2.1 untouched', () => {
    expect(V21.pages.map((p) => p.id)).toEqual(['intro', 'demo', 'il', 'A', 'B', 'C', 'D', 'comp', 'open', 'close']);
    expect(V21.items.some((i) => i.id.startsWith('OI') || i.id.startsWith('CA'))).toBe(false);
  });
});

describe('v2.2 validation', () => {
  it('accepts 0 on the frequency scale but not on agreement items', () => {
    expect(cleanSubmission(V22, { answers: { CA1: 0, CA2: 4 } }).answers).toEqual({ CA1: 0, CA2: 4 });
    expect(() => cleanSubmission(V22, { answers: { CA3: 0 } })).toThrow(ValidationError);
    expect(() => cleanSubmission(V22, { answers: { CA1: 5 } })).toThrow(ValidationError);
    expect(() => cleanSubmission(V21, { answers: { CA1: 1 } })).toThrow(/Unknown question/);
  });

  it('drops a CA4 answer when no incident was reported', () => {
    expect(cleanSubmission(V22, { answers: { CA1: 0, CA2: 0, CA4: 1 } }).answers).toEqual({ CA1: 0, CA2: 0 });
    expect(cleanSubmission(V22, { answers: { CA1: 2, CA4: 1 } }).answers).toEqual({ CA1: 2, CA4: 1 });
  });
});

describe('v2.2 pilot results', () => {
  const base = (i: number, extra: Record<string, number>) => resp({ TC2: 5, OI1: 4 + (i % 3), OI2: 3, OI3: 6, OI4: i % 2 ? 2 : 5, CA3: i % 2 ? 3 : 5, ...extra });

  it('is absent for v2.1 surveys and separate from the areas for v2.2', () => {
    const rs = [0, 1, 2, 3, 4].map((i) => base(i, { CA1: 1 }));
    expect(buildResults(V21, rs.map((r) => resp({ TC2: r.answers.TC2! }))).pilot).toBeUndefined();
    const r = buildResults(V22, rs);
    expect(r.areas).toHaveLength(8);
    expect(r.areas!.flatMap((a) => a.items.map((i) => i.id)).some((id) => id.startsWith('OI'))).toBe(false);
    expect(r.pilot).toBeDefined();
  });

  it('reports OI agreement at codes 4–6 and a provisional score for people with 3+ answers', () => {
    const rs = [
      resp({ OI1: 4, OI2: 4, OI3: 4 }), resp({ OI1: 3, OI2: 3, OI3: 3, OI4: 3 }), resp({ OI1: 6 }),
      resp({ OI1: 5, OI2: 5, OI3: 5 }), resp({ OI1: 1, OI2: 2, OI3: 3 }),
    ];
    const p = buildResults(V22, rs).pilot!;
    expect(p.integration.items[0].agree).toBeCloseTo(3 / 5);
    expect(p.integration.score.n).toBe(4);                      // the OI1-only person is left out
    expect(p.integration.score.mean).toBeCloseTo((4 + 3 + 5 + 2) / 4);
  });

  it('reports rudeness as shares, threats only as a band', () => {
    const none = buildResults(V22, [0, 1, 2, 3, 4].map((i) => base(i, { CA1: i, CA2: 0 }))).pilot!;
    expect(none.aggression.rudeness.anyShare).toBeCloseTo(4 / 5);
    expect(none.aggression.rudeness.sixPlusShare).toBeCloseTo(2 / 5);
    expect(none.aggression.threatsBand).toBe('None');
    const few = buildResults(V22, [0, 1, 2, 3, 4].map((i) => base(i, { CA2: i < 2 ? 1 : 0 }))).pilot!;
    expect(few.aggression).toMatchObject({ threatsBand: '1–2 people', threatsShare: null });
    const many = buildResults(V22, [0, 1, 2, 3, 4, 5].map((i) => base(i, { CA2: i < 3 ? 2 : 0 }))).pilot!;
    expect(many.aggression.threatsBand).toBe('3 or more people');
    expect(many.aggression.threatsShare).toBeCloseTo(3 / 6);
  });

  it('suppresses the check-in question when fewer than five were asked it', () => {
    const four = buildResults(V22, [0, 1, 2, 3, 4].map((i) => base(i, i < 4 ? { CA1: 1, CA4: 1 } : { CA1: 0 }))).pilot!;
    expect(four.aggression.checkIn).toMatchObject({ shown: 4, suppressed: true, counts: [] });
    const five = buildResults(V22, [0, 1, 2, 3, 4].map((i) => base(i, { CA1: 1, CA4: i < 2 ? 1 : 4 }))).pilot!;
    expect(five.aggression.checkIn).toMatchObject({ shown: 5, suppressed: false, n: 5 });
    expect(five.aggression.checkIn.withinADay).toBeCloseTo(2 / 5);
    expect(five.aggression.checkIn.toldNoOne).toBeCloseTo(3 / 5);
  });

  it('keeps threat and follow-up codes out of owner exports', () => {
    const rs = [0, 1, 2, 3, 4].map((i) => base(i, { CA1: 1, CA2: 1, CA4: 2 }));
    const owner = exportCsv(V22, 'c1', rs).split('\n')[0].split(',');
    const researcher = exportCsv(V22, 'c1', rs, { researcher: true }).split('\n')[0].split(',');
    expect(owner).toContain('CA1');
    expect(owner).not.toContain('CA2');
    expect(owner).not.toContain('CA4');
    expect(researcher).toEqual(expect.arrayContaining(['CA2', 'CA4']));
  });
});
