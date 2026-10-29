import { describe, expect, it } from 'vitest';
import { V21 } from '../src/lib/instrument/v21';
import { itemMap } from '../src/lib/instrument';
import { buildResults, exportCsv, personAreaScore, recode, robustDiff, StoredResponse } from '../src/lib/scoring';
import { cleanSubmission, ValidationError } from '../src/lib/validate';

const items = itemMap(V21);
const resp = (answers: Record<string, number>, demo: Record<string, number> = {}): StoredResponse => ({ answers, demographics: demo });

describe('scoring', () => {
  it('recodes reverse items as 7 - code', () => {
    expect(recode(items.TC1, 1)).toBe(6);
    expect(recode(items.TC2, 1)).toBe(1);
    expect(recode(items.TC1, undefined)).toBeNull();
  });

  it('averages recoded items per person and ignores skipped items', () => {
    // TC1 = 2 (recoded 5), TC2 = 4, TC3 skipped, TC4 = 6  -> (5 + 4 + 6) / 3
    expect(personAreaScore(V21, 'TC', resp({ TC1: 2, TC2: 4, TC4: 6 }))).toBeCloseTo(5);
    expect(personAreaScore(V21, 'TC', resp({}))).toBeNull();
  });

  it('shows nothing but the count under five responses', () => {
    const r = buildResults(V21, [1, 2, 3, 4].map(() => resp({ TC2: 5 })));
    expect(r).toEqual({ version: 'v2.1', n: 4, suppressed: true });
  });

  it('builds distributions and % favorable, with code 4 as its own slice', () => {
    const rs = [6, 5, 4, 3, 1].map((v) => resp({ FL3: v }));
    const fl = buildResults(V21, rs).areas!.find((a) => a.id === 'FL')!;
    const fl3 = fl.items.find((i) => i.id === 'FL3')!;
    expect(fl3.counts).toEqual([1, 0, 1, 1, 1, 1]);
    expect(fl3.favorable).toBeCloseTo(0.4);
    expect(fl3.slightlyAgree).toBeCloseTo(0.2);
    expect(fl3.disagree).toBeCloseTo(0.4);
  });

  it('has no overall score field', () => {
    const r = buildResults(V21, [1, 2, 3, 4, 5].map(() => resp({ TC2: 5 })));
    expect(Object.keys(r)).not.toContain('overall');
  });

  it('hides a breakdown when any group has fewer than five', () => {
    const rs = [
      ...[1, 2, 3, 4, 5].map(() => resp({ CR1: 2 }, { D1: 3 })),
      ...[1, 2, 3, 4].map(() => resp({ CR1: 5 }, { D1: 1 })),
    ];
    const role = buildResults(V21, rs).breakdowns!.find((b) => b.key === 'role')!;
    expect(role.shown).toBe(false);
    expect(role.groups.find((g) => g.id === 'rest')!.n).toBe(4);
    expect(role.groups.every((g) => g.areas === undefined)).toBe(true);
  });

  it('shows a breakdown when every group has five or more', () => {
    const rs = [
      ...[1, 2, 3, 4, 5].map(() => resp({ CR1: 2 }, { D1: 4 })),
      ...[1, 2, 3, 4, 5].map(() => resp({ CR1: 5 }, { D1: 6 })),
    ];
    const role = buildResults(V21, rs).breakdowns!.find((b) => b.key === 'role')!;
    expect(role.shown).toBe(true);
    expect(role.groups[0].areas!.CR).toBe(2);
    expect(role.groups[1].areas!.CR).toBe(5);
  });

  it('separates leaving the clinic from leaving the profession', () => {
    const rs = [
      resp({ IL1: 5, IL2: 4, IL3: 1 }),  // looking
      resp({ IL1: 1, IL2: 1, IL3: 5 }),  // not staying a year -> looking; considered profession
      resp({ IL1: 3, IL2: 4, IL3: 2 }),  // undecided
      resp({ IL1: 1, IL2: 5, IL3: 4 }),  // staying; considered profession
      resp({ IL1: 2, IL2: 5 }),          // staying; skipped IL3
    ];
    const il = buildResults(V21, rs).intentToLeave!;
    expect(il.clinic).toEqual({ answered: 5, looking: 2, undecided: 1, staying: 2 });
    expect(il.profession).toEqual({ answered: 4, considered: 2 });
  });

  it('counts a change as clear only when it survives dropping the most influential respondent', () => {
    expect(robustDiff([3, 3, 3, 3, 3], [4, 4, 4, 4, 4]).holds).toBe(true);
    expect(robustDiff([3, 3, 3, 3, 3], [3, 3, 3, 3, 6]).holds).toBe(false); // one person drives it
    expect(robustDiff([3, 3, 3], [3.1, 3.1, 3.1]).holds).toBe(false);       // under 0.25
  });

  it('exports raw codes keyed by item id, without written answers', () => {
    const csv = exportCsv(V21, 'c1', [resp({ TC1: 2 }, { D1: 3 })]);
    const [head, row] = csv.split('\n');
    expect(head.startsWith('campaign_id,instrument_version,D1,D2,D3,D4,D5,TC1')).toBe(true);
    expect(head).not.toContain('OE1');
    expect(row.startsWith('c1,v2.1,3,,,,,2')).toBe(true); // TC1 stays raw (not recoded)
  });
});

describe('submission validation', () => {
  it('accepts any subset of questions', () => {
    expect(cleanSubmission(V21, {})).toEqual({ demographics: {}, answers: {}, openEnded: {} });
  });

  it('rejects out-of-range codes and unknown questions', () => {
    expect(() => cleanSubmission(V21, { answers: { TC1: 7 } })).toThrow(ValidationError);
    expect(() => cleanSubmission(V21, { answers: { IL1: 6 } })).toThrow(ValidationError);
    expect(() => cleanSubmission(V21, { answers: { X9: 1 } })).toThrow(ValidationError);
    expect(() => cleanSubmission(V21, { demographics: { D3: 6 } })).toThrow(ValidationError);
    expect(() => cleanSubmission(V21, { answers: { TC1: 2.5 } })).toThrow(ValidationError);
  });

  it('keeps "please specify" text only when Other is chosen, and trims written answers', () => {
    expect(cleanSubmission(V21, { demographics: { D1: 2, D1_other: 'x' } }).demographics).toEqual({ D1: 2 });
    expect(cleanSubmission(V21, { demographics: { D1: 8, D1_other: ' Groomer ' } }).demographics).toEqual({ D1: 8, D1_other: 'Groomer' });
    expect(cleanSubmission(V21, { openEnded: { OE1: '  ', OE2: ' More staff ' } }).openEnded).toEqual({ OE2: 'More staff' });
  });
});
