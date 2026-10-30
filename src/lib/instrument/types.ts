// Shared types for versioned survey instruments.

export type ScaleId = 'agree6' | 'satisfy6' | 'agree5' | 'likely5';
export type AreaId = 'TC' | 'WR' | 'FL' | 'TE' | 'PM' | 'GD' | 'ES' | 'CR';
export type ItemKind = 'scored' | 'supplementary' | 'outcome' | 'open';

export interface Scale {
  id: ScaleId;
  /** Labels in display order; the stored value is the 1-based position. */
  labels: string[];
}

export interface Area {
  id: AreaId;
  name: string;
}

export interface Item {
  id: string;
  kind: ItemKind;
  /** Wording exactly as fielded. Never edit once a campaign has used it. */
  text: string;
  /** Short label for dashboards and findings. */
  short: string;
  area?: AreaId;
  scale?: ScaleId;
  reverse?: boolean;
}

export interface Demographic {
  id: 'D1' | 'D2' | 'D3' | 'D4' | 'D5';
  text: string;
  options: string[];
  /** 1-based code of an option that takes free text ("Other (please specify)"). */
  otherCode?: number;
}

export type PageType = 'intro' | 'demographics' | 'items' | 'open' | 'close';

export interface Page {
  id: string;
  type: PageType;
  title: string;
  items?: string[];
  /** Shown at the top of the page before its items. */
  note?: string;
}

export interface Instrument {
  version: string;
  name: string;
  minutes: string;
  scales: Record<ScaleId, Scale>;
  areas: Area[];
  items: Item[];
  demographics: Demographic[];
  pages: Page[];
  intro: { researcher: string; selfserve: string };
}
