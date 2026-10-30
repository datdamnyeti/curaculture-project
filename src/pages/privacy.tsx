// Staff-facing: how answers are protected. Linked from every survey page.
import Link from 'next/link';
import { Logo } from '@/components/layout/AppShell';

const Q = ({ q, children }: { q: string; children: React.ReactNode }) => (
  <section className="flex flex-col gap-2"><h2 className="text-lg font-semibold">{q}</h2><p className="leading-relaxed text-slate-700">{children}</p></section>
);

export default function Privacy() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <Link href="/" className="flex items-center gap-2 text-lg font-bold"><Logo />CuraCulture</Link>
      <article className="card flex flex-col gap-6 sm:p-8">
        <div><p className="eyebrow">For staff</p><h1 className="text-3xl font-bold">How your answers are protected</h1></div>
        <Q q="Who sees my answers?">Nobody at your clinic sees your individual answers. Your clinic sees results for the whole team and for groups of five or more people. If fewer than five people respond, your clinic sees only how many responded.</Q>
        <Q q="Can my answers be traced back to me?">Your answers are stored with no link to your name, your email, your phone number or your survey link. A separate record notes only whether your link is not started, in progress or complete, so reminders stop once you’ve finished. The two records are never connected, and neither has a timestamp that could match them.</Q>
        <Q q="What about the written questions?">Depending on how your clinic runs the survey, a researcher reads written answers before your clinic sees them and holds back anything that could identify you, or your clinic never sees them at all. Leave out names and details only you would know.</Q>
        <Q q="Do I have to answer everything?">No. Every question is optional. You can stop at any point and come back with the same link. You never need an account or a password.</Q>
        <Q q="Does my manager know whether I took it?">Your clinic sees how many people have finished, not who. Reminders go out automatically to anyone who hasn’t finished.</Q>
        <Q q="Can I take my answers back later?">Once submitted, no. Because nothing links a response to the person who gave it, it can’t be found again, even by us.</Q>
      </article>
    </div>
  );
}
