// Registry of versioned instruments. Every campaign and response stores its
// version, and data from different versions is never pooled.
import type { Instrument, Item } from './types';
import { V21 } from './v21';
import { V22 } from './v22';

export * from './types';

const REGISTRY: Record<string, Instrument> = {
  [V21.version]: V21,
  [V22.version]: V22,
};

/** Versions an owner can choose when sending a survey, newest pilot last. */
export const FIELDABLE = [
  { version: V21.version, label: 'Veterinary Practice Assessment v2.1 · 41 questions' },
  { version: V22.version, label: 'v2.1 plus the v2.2 pilot pages · 49 questions' },
] as const;

export const CURRENT_VERSION = V21.version;

export function getInstrument(version: string): Instrument {
  const inst = REGISTRY[version];
  if (!inst) throw new Error(`Unknown instrument version: ${version}`);
  return inst;
}

export function itemMap(inst: Instrument): Record<string, Item> {
  return Object.fromEntries(inst.items.map((i) => [i.id, i]));
}

/** Scale length for an item, or 0 for open-ended items. */
export function scaleLength(inst: Instrument, item: Item): number {
  return item.scale ? inst.scales[item.scale]!.labels.length : 0;
}

/** The stored codes for an item's answer options, in display order. */
export function scaleCodes(inst: Instrument, item: Item): number[] {
  if (!item.scale) return [];
  const sc = inst.scales[item.scale]!;
  return sc.codes ?? sc.labels.map((_, i) => i + 1);
}

/** Whether a conditional item is shown, given the answers so far. */
export function isShown(item: Item, answers: Record<string, number | undefined>): boolean {
  if (!item.showIfAnyAbove0) return true;
  return item.showIfAnyAbove0.some((id) => (answers[id] ?? 0) > 0);
}
