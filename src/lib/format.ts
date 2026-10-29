export const fmtDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
export const pct = (x: number) => `${Math.round(x * 100)}%`;
export const one = (x: number | null | undefined) => (x == null ? '—' : x.toFixed(1));
