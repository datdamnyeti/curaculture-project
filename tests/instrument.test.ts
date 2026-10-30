import { describe, expect, it } from 'vitest';
import { V21 } from '../src/lib/instrument/v21';
import { getInstrument, itemMap } from '../src/lib/instrument';

describe('instrument v2.1', () => {
  const items = itemMap(V21);
  const asked = V21.pages.flatMap((p) => p.items ?? []);

  it('has 41 questions: 27 scored, 3 supplementary, 3 intent-to-leave, 3 open-ended, 5 demographics', () => {
    const by = (k: string) => V21.items.filter((i) => i.kind === k).length;
    expect(by('scored')).toBe(27);
    expect(by('supplementary')).toBe(3);
    expect(by('outcome')).toBe(3);
    expect(by('open')).toBe(3);
    expect(V21.demographics).toHaveLength(5);
    expect(asked).toHaveLength(41);
  });

  it('asks every question exactly once, in the fielded page order', () => {
    expect(new Set(asked).size).toBe(41);
    expect(V21.pages.map((p) => p.id)).toEqual(['intro', 'demo', 'il', 'A', 'B', 'C', 'D', 'comp', 'open', 'close']);
    expect(V21.pages.find((p) => p.id === 'A')!.items).toEqual(['TC2', 'WR1', 'FL2', 'TE1', 'WR3', 'FL1', 'S3']);
    expect(V21.pages.find((p) => p.id === 'D')!.items).toEqual(['FL3', 'GD2', 'TC1', 'PM3', 'TE3', 'S2']);
    expect(V21.pages.find((p) => p.id === 'open')!.items).toEqual(['OE3', 'OE1', 'OE2']);
  });

  it('has 8 areas with 3 or 4 items each', () => {
    const counts = V21.areas.map((a) => V21.items.filter((i) => i.area === a.id).length);
    expect(counts).toEqual([4, 4, 3, 3, 3, 3, 4, 3]);
  });

  it('flags exactly TC1, WR2 and GD3 as reverse-scored', () => {
    expect(V21.items.filter((i) => i.reverse).map((i) => i.id)).toEqual(['TC1', 'WR2', 'GD3']);
  });

  it('uses the right scale for each item', () => {
    expect(['CR1', 'CR2', 'CR3'].map((id) => items[id].scale)).toEqual(['satisfy6', 'satisfy6', 'satisfy6']);
    expect(items.IL1.scale).toBe('likely5');
    expect(items.IL2.scale).toBe('agree5');
    expect(items.IL3.scale).toBe('agree5');
    expect(items.S1.scale).toBe('agree6');
    expect(V21.scales.agree6.labels[3]).toBe('Slightly agree');
  });

  it('keeps fielded wording and option codes', () => {
    expect(items.FL3.text).toBe('Leadership at this clinic follows through on commitments and holds everyone to the same standards.');
    expect(V21.demographics[0].options[2]).toBe('Veterinary Technician (not credentialed)');
    expect(V21.demographics[0].otherCode).toBe(8);
    expect(V21.demographics[1].options).toEqual(['Early career: 0-5 years', 'Mid-career: 6-15 years', 'Established: 16 or more years']);
  });

  it('rejects unknown versions', () => {
    expect(getInstrument('v2.1')).toBe(V21);
    expect(() => getInstrument('2025-draft')).toThrow();
  });
});
