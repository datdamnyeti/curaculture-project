// Registry of versioned instruments. Every campaign and response stores its
// version, and data from different versions is never pooled.
import type { Instrument, Item } from './types';
import { V21 } from './v21';

export * from './types';

const REGISTRY: Record<string, Instrument> = {
  [V21.version]: V21,
};

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
  return item.scale ? inst.scales[item.scale].labels.length : 0;
}
