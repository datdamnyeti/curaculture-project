// Signals: an owner record placed next to what staff said. "Corroborated"
// means both point the same way; "diverges" means they split. Neither is a
// score. Staff results only enter through Results objects, which already apply
// the 5-response rule, so nothing here can expose an individual answer.
//
// The thresholds are pilot rules set before any data, and every signal says
// which rule it used. The spec's "Healthy/Optimal" band wording is replaced by
// rank among the eight areas, since v2.1 reports no bands.
import type { AreaId } from '../instrument';
import type { Results } from '../scoring';
import { exitMetrics, onboardingMetrics, vitalsMetrics, PolicyAudit } from './metrics';
import { POLICY_STATUS } from './registry';

export type SignalKind = 'corroborated' | 'diverges' | 'not_enough';
export interface Signal { key: string; title: string; kind: SignalKind; owner: string; staff: string; meaning: string; rule: string }

const pct = (x: number) => `${Math.round(x * 100)}%`;
const one = (x: number | null | undefined) => (x == null ? '—' : x.toFixed(1));

export function signals(input: {
  vitals: ReturnType<typeof vitalsMetrics>;
  exits: ReturnType<typeof exitMetrics> | null;
  onboarding: ReturnType<typeof onboardingMetrics>;
  audit: PolicyAudit | null;
  /** Latest survey with 5+ responses (any version). */
  survey: Results | null;
  /** Latest v2.2-pilot survey with 5+ responses. */
  pilot: Results | null;
}): Signal[] {
  const out: Signal[] = [];
  const { vitals: V, exits: E, onboarding: O, audit, survey: S } = input;
  const P = input.pilot?.pilot ?? null;
  const areaName = (id: AreaId) => S?.areas?.find((a) => a.id === id)?.name ?? id;
  const ranked = S?.areas ? [...S.areas].filter((a) => a.mean != null).sort((a, b) => a.mean! - b.mean!).map((a) => a.id) : [];

  // 1. Turnover and intent to leave
  if (V && S?.intentToLeave?.clinic.answered) {
    const c = S.intentToLeave.clinic, look = c.looking / c.answered;
    const hiT = V.turnover.rate >= 0.23, hiI = look >= 0.25, same = hiT === hiI;
    out.push({
      key: 'turnover-intent', title: 'Turnover and intent to leave', kind: same ? 'corroborated' : 'diverges',
      owner: `${V.turnover.count} people left in 12 months (${pct(V.turnover.rate)})`,
      staff: `${c.looking} of ${c.answered} are looking or not staying a year (${pct(look)})`,
      meaning: same ? (hiT ? 'People are leaving, and those still here say more may follow.' : 'Both are low.')
        : hiT ? 'People have been leaving, but those who stayed mostly plan to stay. Check whether the exits cluster in one role or in the first 90 days.'
          : 'Few have left so far, but more staff say they are looking. Treat it as an early warning.',
      rule: 'Turnover counts as high at 23% or more (AAHA’s reported average, a reference point, not a band); intent at 25% or more looking.',
    });
  }

  // 2. After-hours load and Workload & Recovery
  if (V && ranked.length && V.afterHours.now != null && V.afterHours.priorMean != null) {
    const up = V.afterHours.now >= V.afterHours.priorMean * 1.1, low = ranked.slice(0, 2).includes('WR'), same = up === low;
    const wr = S!.areas!.find((a) => a.id === 'WR')!;
    out.push({
      key: 'afterhours-wr', title: 'After-hours load and Workload & Recovery', kind: same ? 'corroborated' : 'diverges',
      owner: `${one(V.afterHours.now)} after-hours shifts per clinical FTE a month (previous average ${one(V.afterHours.priorMean)})`,
      staff: `Workload & Recovery mean ${one(wr.mean)}, ${low ? 'one of the two lowest areas' : 'not among the two lowest areas'}`,
      meaning: same ? (up ? 'The rota is getting heavier and staff feel it.' : 'The load is steady and Workload & Recovery is not a weak spot.')
        : up ? 'The load is rising but staff don’t rate it low yet. Watch it at the next pulse.' : 'Staff rate workload low although after-hours load has not risen: look at daytime pace and breaks.',
      rule: 'Load counts as rising at 10% or more above the clinic’s own previous four quarters; Workload & Recovery counts as low when it is one of the two lowest areas.',
    });
  }

  // 3. Why people left and the lowest survey area
  if (E && E.voluntary && ranked.length) {
    if (E.countsOnly || !E.top) {
      out.push({ key: 'exits-area', title: 'Why people left and the lowest area', kind: 'not_enough',
        owner: `${E.voluntary} voluntary ${E.voluntary === 1 ? 'exit' : 'exits'} in 12 months`, staff: `Lowest area: ${areaName(ranked[0])}`,
        meaning: 'Fewer than 5 voluntary exits, so only counts are shown.', rule: 'Compared once there are 5 or more voluntary exits in 12 months.' });
    } else {
      const rank = ranked.indexOf(E.top);
      const kind: SignalKind = rank >= 0 && rank < 2 ? 'corroborated' : rank >= 4 ? 'diverges' : 'not_enough';
      out.push({
        key: 'exits-area', title: 'Why people left and the lowest area', kind,
        owner: `Most-named exit area: ${areaName(E.top)} (${E.named[E.top]} of ${E.voluntary} voluntary exits)`,
        staff: `${areaName(E.top)} ranks ${rank + 1} of 8 in the survey (lowest: ${areaName(ranked[0])})`,
        meaning: kind === 'corroborated' ? 'What leavers named is what current staff score lowest.'
          : kind === 'diverges' ? 'Leavers named an area current staff rate highly. Check how reasons were recorded: your own view is weaker evidence than an exit conversation.'
            : 'Partly lines up: the exit area sits mid-table in the survey.',
        rule: 'Corroborated when the most-named exit area is one of the two lowest survey areas; diverges when it is in the top half.',
      });
    }
  }

  // 4. Reporting route: CP5 and CA3
  if (audit && P) {
    const own = audit.answers.CP5 === 2, ok = P.aggression.knowHowToReport.agree >= 0.7, same = own === ok;
    out.push({
      key: 'reporting', title: 'Reporting route: policy and staff', kind: same ? 'corroborated' : 'diverges',
      owner: `Audit, one named reporting route: ${POLICY_STATUS[audit.answers.CP5] ?? 'not answered'}`,
      staff: `${pct(P.aggression.knowHowToReport.agree)} of staff know how to report a client problem`,
      meaning: same ? (own ? 'The route exists and staff know it.' : 'No clear route, and staff confirm it.')
        : own ? 'The route exists on paper but has not reached the floor. Walk the team through it.' : 'Staff know a route even though none is written down. Write down what already works.',
      rule: 'The staff side counts as strong at 70% or more agreeing (4–6).',
    });
  }

  // 5. Check-in after an incident: CP14 and CA4
  if (audit && P) {
    const own = audit.answers.CP14 === 2, ci = P.aggression.checkIn;
    if (ci.suppressed) {
      out.push({ key: 'checkin', title: 'Check-in after an incident', kind: 'not_enough',
        owner: `Audit, leader checks in within a day: ${POLICY_STATUS[audit.answers.CP14] ?? 'not answered'}`, staff: 'Fewer than 5 staff were asked the follow-up question',
        meaning: 'Not enough people reported an incident to compare.', rule: 'Needs 5 or more staff asked the follow-up question.' });
    } else {
      const ok = ci.withinADay >= 0.5, same = own === ok;
      const es4 = S?.areas?.find((a) => a.id === 'ES')?.items.find((i) => i.id === 'ES4');
      out.push({
        key: 'checkin', title: 'Check-in after an incident', kind: same ? 'corroborated' : 'diverges',
        owner: `Audit, leader checks in within a day: ${POLICY_STATUS[audit.answers.CP14] ?? 'not answered'}`,
        staff: `${pct(ci.withinADay)} of staff who had an incident were checked on within a day${es4 ? ` · leadership backs staff with clients: ${pct(es4.favorable)} favorable` : ''}`,
        meaning: same ? (own ? 'Leaders check in, and staff say so.' : 'Check-ins are not happening, and staff confirm it.')
          : own ? 'The audit says leaders check in within a day; most staff who had an incident say that did not happen.' : 'Staff report quick check-ins even though the audit does not claim them.',
        rule: 'The staff side counts as strong when half or more of those asked say “Yes, within a day”.',
      });
    }
  }

  // 6. Onboarding steps and how integration feels
  if (P && O.meanRecent != null && P.integration.score.mean != null) {
    const hiC = O.meanRecent >= 80, hiO = P.integration.score.mean >= 3.5, same = hiC === hiO;
    out.push({
      key: 'onboarding', title: 'Onboarding steps and how integration feels', kind: same ? 'corroborated' : 'diverges',
      owner: `Checklist completion: ${Math.round(O.meanRecent)}% on average over ${O.recentCount} hires in 12 months`,
      staff: `Team integration (provisional): ${one(P.integration.score.mean)} on 1–6`,
      meaning: same ? (hiC ? 'Steps are being done and the team feels it.' : 'Steps are being missed and the team notices.')
        : hiC ? 'Steps are being ticked without being felt.' : 'The team feels new people are brought in well even though steps are being missed. Record what is working.',
      rule: 'Completion counts as high at 80% or more; integration at 3.5 or more, the midpoint of 1–6.',
    });
  }
  return out;
}
