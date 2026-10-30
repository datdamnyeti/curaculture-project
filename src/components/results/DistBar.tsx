// How answers spread across the scale. Colours run from least favorable (1) to
// most favorable (6); reverse items are already recoded. Not a traffic light.
const SIX = ['bg-scale-1', 'bg-scale-2', 'bg-scale-3', 'bg-scale-4', 'bg-scale-5', 'bg-scale-6'];
const FIVE = ['bg-scale-1', 'bg-scale-3', 'bg-slate-300', 'bg-scale-4', 'bg-scale-6'];
// Incident follow-up (CA4): within a day is the favorable end.
const FOUR = ['bg-scale-6', 'bg-scale-4', 'bg-scale-2', 'bg-scale-1'];

export default function DistBar({ counts, labels, risk = false, thin = false }: { counts: number[]; labels: string[]; risk?: boolean; thin?: boolean }) {
  const n = counts.reduce((s, x) => s + x, 0);
  let cols = counts.length === 6 ? SIX : counts.length === 4 ? FOUR : FIVE;
  if (risk) cols = [...cols].reverse();
  const label = counts.map((k, i) => `${labels[i]}: ${k}`).join(', ');
  return (
    <div role="img" aria-label={label} className={`flex w-full overflow-hidden rounded ${thin ? 'h-2.5' : 'h-4'} bg-slate-100`}>
      {n > 0 && counts.map((k, i) => k > 0 && (
        <span key={i} className={`${cols[i]} h-full border-l border-white first:border-l-0`} style={{ width: `${(k / n) * 100}%` }} title={`${labels[i]}: ${k} (${Math.round((k / n) * 100)}%)`} />
      ))}
    </div>
  );
}

export function Legend({ labels }: { labels: string[] }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
      {labels.map((l, i) => <span key={l} className="inline-flex items-center gap-1.5"><i className={`inline-block h-2.5 w-2.5 rounded-sm ${SIX[i]}`} />{i + 1} {l}</span>)}
    </div>
  );
}
