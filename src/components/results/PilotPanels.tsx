// The v2.2 pilot pages on the results screen. Reported on their own: never
// added to the eight areas, the lowest-area count or any v2.1 comparison.
import type { Instrument } from '@/lib/instrument';
import type { PilotItem, PilotResults } from '@/lib/scoring';
import DistBar, { Legend } from './DistBar';

const pct = (x: number) => `${Math.round(x * 100)}%`;
const one = (x: number | null) => (x == null ? '—' : x.toFixed(1));
const Pilot = () => <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-800">Pilot · not yet validated</span>;

export default function PilotPanels({ inst, p }: { inst: Instrument; p: PilotResults }) {
  const freq = inst.scales.freq5!.labels, follow = inst.scales.followup4!.labels;
  const a = p.aggression;
  return (
    <>
      <section className="card flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div><h2 className="font-semibold">New team members <span className="font-mono text-xs text-brand">OI1–OI4</span></h2>
            <p className="text-sm text-slate-600">How the team brings new people in. Agree counts any level of agreement (4–6).</p></div><Pilot />
        </div>
        <Legend labels={inst.scales.agree6.labels} />
        {p.integration.items.map((i) => <ItemRow key={i.id} i={i} labels={inst.scales.agree6.labels} />)}
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-slate-100 pt-3">
          <span className="text-sm"><b>Team integration (provisional)</b> <span className="text-slate-500">· mean of OI1–OI4 for the {p.integration.score.n} people who answered at least 3. Not a ninth area.</span></span>
          <span className="font-mono text-lg">{one(p.integration.score.mean)}</span>
        </div>
      </section>

      <section className="card flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div><h2 className="font-semibold">Clients <span className="font-mono text-xs text-brand">CA1–CA4</span></h2>
            <p className="text-sm text-slate-600">The past 3 months. Threats and physical acts are shown as a band only, so no one can be picked out.</p></div><Pilot />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-2"><span className="text-sm"><span className="font-mono text-xs text-brand">CA1</span> Client rudeness or yelling</span>
            <DistBar counts={a.rudeness.counts} labels={freq} risk />
            <span className="text-sm"><b>{pct(a.rudeness.anyShare)}</b> at least once · <b>{pct(a.rudeness.sixPlusShare)}</b> 6 or more times <span className="text-slate-500">· {a.rudeness.n} answered</span></span></div>
          <div className="flex flex-col gap-1"><span className="text-sm"><span className="font-mono text-xs text-brand">CA2</span> Client threats or physical acts</span>
            <span className="text-2xl font-semibold tracking-tight">{a.threatsBand}{a.threatsShare != null ? ` (${pct(a.threatsShare)})` : ''}</span>
            <span className="text-xs text-slate-500">Bands: None · 1–2 people · 3 or more people. Counts are never shown for this question.</span></div>
        </div>
        <div className="flex flex-col gap-2 border-t border-slate-100 pt-3"><span className="text-sm"><span className="font-mono text-xs text-brand">CA3</span> {a.knowHowToReport.text}</span>
          <DistBar thin counts={a.knowHowToReport.counts} labels={inst.scales.agree6.labels} />
          <span className="text-sm"><b>{pct(a.knowHowToReport.agree)}</b> agree · mean {one(a.knowHowToReport.mean)}</span></div>
        <div className="flex flex-col gap-2 border-t border-slate-100 pt-3"><span className="text-sm"><span className="font-mono text-xs text-brand">CA4</span> Afterwards, did someone in charge check in?</span>
          {a.checkIn.suppressed
            ? <p className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-600">Asked only of people who reported an incident. Fewer than 5 were asked, so nothing is shown.</p>
            : <>
                <DistBar counts={a.checkIn.counts} labels={follow} />
                <span className="text-sm"><b>{pct(a.checkIn.withinADay)}</b> within a day · <b>{pct(a.checkIn.toldNoOne)}</b> did not tell anyone in charge <span className="text-slate-500">· {a.checkIn.n} of the {a.checkIn.shown} asked answered</span></span>
              </>}
        </div>
      </section>
    </>
  );
}

function ItemRow({ i, labels }: { i: PilotItem; labels: string[] }) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-1 border-t border-slate-100 py-2 sm:grid-cols-[minmax(10rem,16rem)_1fr_3.5rem_4rem]">
      <span className="text-sm"><span className="font-mono text-xs text-brand">{i.id}</span> {i.short}</span>
      <div className="col-span-3 sm:order-none sm:col-span-1"><DistBar thin counts={i.counts} labels={labels} /></div>
      <span className="text-right font-mono text-sm">{one(i.mean)}</span>
      <span className="text-right font-mono text-sm">{pct(i.agree)}<span className="block font-sans text-[0.65rem] text-slate-500">agree</span></span>
    </div>
  );
}
