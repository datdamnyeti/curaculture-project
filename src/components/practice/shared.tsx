// Small pieces shared by the Practice data sections.
import { ACTIONS, Tool } from '@/lib/practice/registry';

export const Pilot = () => <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-800">Pilot · not yet validated</span>;

export function Section({ title, sub, right, children }: { title: React.ReactNode; sub?: React.ReactNode; right?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section className="card flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1"><h2 className="font-semibold">{title}</h2>{sub && <p className="text-sm text-slate-600">{sub}</p>}</div>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Meter({ label, value, max, right }: { label: React.ReactNode; value: number; max: number; right: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-sm sm:grid-cols-[minmax(10rem,15rem)_1fr_6rem]">
      <span>{label}</span>
      <div className="col-span-2 h-2 overflow-hidden rounded-full bg-slate-100 sm:col-span-1"><div className="h-full bg-brand" style={{ width: `${max ? (value / max) * 100 : 0}%` }} /></div>
      <span className="text-right font-mono">{right}</span>
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return <div className="flex flex-col gap-0.5 bg-white p-4"><span className="eyebrow">{label}</span><span className="text-2xl font-semibold tracking-tight">{value}</span>{sub && <span className="text-xs text-slate-500">{sub}</span>}</div>;
}

export function Flag({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-2.5 rounded-lg bg-orange-50 px-4 py-3 text-sm text-orange-950">{children}</div>;
}

export function Actions({ tool }: { tool: Tool }) {
  return (
    <Section title="Actions for this tool" sub="Starting points with the strength of evidence behind each.">
      <div className="flex flex-col">
        {ACTIONS.filter((a) => a.tool === tool).map((a) => (
          <div key={a.text} className="flex flex-col gap-1 border-t border-slate-100 py-3 first:border-t-0 first:pt-0">
            <b className="text-sm">{a.text}</b>
            <span className="text-xs text-slate-500"><span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700">{a.evidence}</span>{a.note}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
