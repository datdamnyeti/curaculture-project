import type { PracticeOverview } from '@/lib/server/practiceService';

export type View = 'overview' | 'vitals' | 'exits' | 'onboarding' | 'safety';
export interface SectionProps {
  d: PracticeOverview;
  canEdit: boolean;
  reload: () => Promise<void>;
  go: (v: View) => void;
  /** Sends a write, toasts on success or failure, reloads. Resolves true on success. */
  save: (path: string, method: string, body?: unknown, ok?: string) => Promise<boolean>;
}
