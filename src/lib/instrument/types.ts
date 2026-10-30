// Shared types for versioned survey instruments.

export type ScaleId = 'agree6' | 'satisfy6' | 'agree5' | 'likely5' | 'freq5' | 'followup4';
export type AreaId = 'TC' | 'WR' | 'FL' | 'TE' | 'PM' | 'GD' | 'ES' | 'CR';
/** integration and aggression are the v2.2 pilot pages, reported on their own. */
export type ItemKind = 'scored' | 'supplementary' | 'outcome' | 'open' | 'integration' | 'aggression';

export interface Scale {
  id: ScaleId;
  /** Labels in display order. */
  labels: string[];
  /** Stored code for each label. Omitted means the 1-based position. */
  codes?: number[];
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
  /** Conditional display: shown only when any of these items is answered above 0. */
  showIfAnyAbove0?: string[];
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
  /** A pilot page: reported separately, never added to the v2.1 areas. */
  pilot?: boolean;
}

export interface Instrument {
  version: string;
  name: string;
  minutes: string;
  scales: Partial<Record<ScaleId, Scale>> & Record<'agree6' | 'satisfy6' | 'agree5' | 'likely5', Scale>;
  areas: Area[];
  items: Item[];
  demographics: Demographic[];
  pages: Page[];
  intro: { researcher: string; selfserve: string };
}
