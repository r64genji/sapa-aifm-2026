"use client";

import Link from "next/link";
import { useApi } from "@/components/sapa/data";
import { AiMark, CountBar, Loading, PageHeader, driverName, shortDate } from "@/components/sapa/ui";

type Card = { driver: string; enough: boolean; n?: number; m?: number; reviewed?: number; ai_confident?: number; note?: string | null; message?: string };
type Themes = { cards: Card[] };
type Action = { driver: string; status: string; owner: string | null; assigned_at: string | null; title: string };

const inProgress = (a: Action) => a.status === "assigned" || a.status === "accepted";

export default function Page() {
  const themes = useApi<Themes>("/api/hr/themes?touchpoint=14");
  const actions = useApi<Action[]>("/api/hr/actions");
  if (!themes.data || !actions.data) return <Loading />;

  const cards = [...themes.data.cards].sort((a, b) => (b.n ?? -1) - (a.n ?? -1));
  const fixOf = (driver: string) => actions.data!.find((a) => a.driver === driver && inProgress(a));
  const need = cards.filter((c) => !fixOf(c.driver));
  const progress = cards.filter((c) => fixOf(c.driver));

  const item = (c: Card) => {
    const fix = fixOf(c.driver);
    return (
      <Link key={c.driver} href={`/problems/${c.driver}`} className="sp-card flex flex-col gap-2 p-4" style={{ color: "inherit", textDecoration: "none" }}>
        <span className="text-[17px] font-bold">{driverName(c.driver)}</span>
        {c.enough ? <CountBar count={c.n} of={c.m} label="who answered the Day 14 check-in" /> : <CountBar notEnough />}
        <span className="sp-caption">
          {fix
            ? `${fix.title} · ${fix.status === "accepted" ? `${fix.owner} accepted` : `sent to ${fix.owner}${fix.assigned_at ? ` ${shortDate(fix.assigned_at)}` : ""}, not accepted yet`}`
            : "No fix yet"}
          {c.note ? ` · ${c.note}` : ""}
        </span>
      </Link>
    );
  };

  return (
    <>
      <PageHeader
        title="Shared problems"
        sub="The AI reads every reply and sorts it into a problem area. Sapa counts them. Pick a problem to see what people mean, who has it, and the fix to start."
      />
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 sp-caption">
        <span className="inline-flex items-center gap-2">
          <AiMark label="AI suggestion" />
          check it before you act
        </span>
        <span>Counts include replies you checked and replies the AI was sure about</span>
        <span>Under 5 people: no number</span>
      </div>
      <section className="flex flex-col gap-3" aria-labelledby="need-title">
        <h2 id="need-title" className="sp-caption m-0 font-bold">Needs a fix</h2>
        {need.length ? need.map(item) : <span className="sp-muted">Every problem area has a fix in progress.</span>}
      </section>
      <section className="flex flex-col gap-3" aria-labelledby="progress-title">
        <h2 id="progress-title" className="sp-caption m-0 font-bold">Fix in progress</h2>
        {progress.length ? progress.map(item) : <span className="sp-muted">No fix in progress yet.</span>}
      </section>
    </>
  );
}
