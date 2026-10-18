"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { apiSend, useApi } from "@/components/sapa/data";
import { Spark, Waffle } from "@/components/sapa/problems";
import { AiMark, Button, CountBar, Dialog, LaneSection, PageHeader, Quote, Row, Waiting, dayLabel, driverName, DRIVERS, shortDate } from "@/components/sapa/ui";

const CONTEXT: Record<string, string> = { PAY_BENEFITS: "Pay and benefits", GROWTH: "Growth", COMMUTE_LOGISTICS: "Commute" };

type Me = { today: string };
type Card = { driver: string; enough: boolean; message?: string; n?: number; m?: number; reviewed?: number; ai_confident?: number; score_only?: number; held?: { language: string; reason: string }[] };
type Context = { theme: string; enough: boolean; n?: number; m?: number };
type Themes = { cards: Card[]; context: Context[] };
type Share = { enough: true; n: number; m: number } | { enough: false };
type Detail = { by_intake: (Share & { intake: string })[] };
type QueueRow = { id: string; status: string; drivers: string[]; context_tags: string[]; escalate: boolean; evidence_quote: string | null; text: string | null; note: string | null; created_at: string; language?: string; byline: string };
type Action = { status: string; hiring_side: boolean; verdict: "worked" | "no_clear_change" | "too_early" | null };
type Impact = {
  retention: { enough: true; k: number; n: number } | { enough: false; message: string };
  baseline: { kept: number; of: number } | null;
  retention_by_intake: { intake: string; hired: number; employed: number }[];
  day14: { answered: number; of: number } | null;
};
type TeamRow = { name: string; teams: string[]; n: number; m: number };
type Teams = { enough: false } | { enough: true; rows: TeamRow[]; eligible: number };

const pct = (part: number, whole: number) => Math.round((part / Math.max(whole, 1)) * 100);
const month = (intake: string) => new Date(`${intake}-01T00:00:00Z`).toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
const typedLine = (c: Card) => `${c.reviewed} reviewed${c.ai_confident ? `, ${c.ai_confident} AI-confident` : ""}${c.score_only ? `, ${c.score_only} from a 1–5 score only` : ""}`;

function ReplyItem({ row, onDone }: { row: QueueRow; onDone: (row: QueueRow, undo: () => Promise<unknown>) => void }) {
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const label = row.drivers.length ? row.drivers.map(driverName).join(" and ") : row.context_tags.length ? row.context_tags.map((t) => CONTEXT[t] ?? t).join(" and ") : "Nothing to act on";
  const send = async (body: object) => {
    setError(null);
    try {
      await apiSend(`/api/hr/replies/${row.id}/review`, "POST", body);
      onDone(row, () => apiSend(`/api/hr/replies/${row.id}/review`, "POST", { drivers: row.drivers, context_tags: row.context_tags }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    }
    setPicking(false);
  };
  const waiting = row.status === "awaiting_ai";
  return (
    <Row
      muted={false}
      metric={waiting ? <Waiting>Waiting for the AI</Waiting> : <AiMark state={row.status === "needs_review" ? "unsure" : "suggested"} label={label} />}
      action={
        waiting ? null : (
          <>
            {row.status === "ok" ? (
              <Button variant="primary" lane="ai" onClick={() => send({})}>
                Confirm label
              </Button>
            ) : null}
            <Button variant="secondary" lane="ink" onClick={() => setPicking(true)}>
              Change label
            </Button>
          </>
        )
      }
    >
      <div className="sp-caption" style={{ color: "var(--ai)", fontWeight: 600 }}>
        {row.byline} · {shortDate(row.created_at)}
        {row.language === "zh" ? " · Chinese" : ""}
      </div>
      {row.text ? <Quote text={row.text} evidence={row.evidence_quote} /> : null}
      {row.note ? <div className="sp-row-meta">{row.note}</div> : null}
      {error ? <div className="sp-row-meta" style={{ color: "var(--serious)" }}>{error}</div> : null}
      {picking ? (
        <Dialog title="What is this reply about?" onClose={() => setPicking(false)}>
          <span className="sp-muted">The AI said {label}. Pick the closer one.</span>
          <div className="flex flex-wrap gap-2">
            {Object.keys(DRIVERS).map((d) => (
              <Button key={d} lane="ai" onClick={() => send({ drivers: [d] })}>
                {driverName(d)}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => send({ drivers: [], context_tags: [] })}>Nothing to act on</Button>
            <Button onClick={() => setPicking(false)}>Cancel</Button>
          </div>
        </Dialog>
      ) : null}
    </Row>
  );
}

function Tile({ label, value, viz, base, href }: { label: string; value: ReactNode; viz?: ReactNode; base: ReactNode; href: string }) {
  return (
    <Link href={href} className="sp-card flex flex-col gap-2 px-[18px] py-4 no-underline" style={{ color: "var(--ink)" }}>
      <span className="text-[13px] font-semibold leading-[18px] sp-muted">{label}</span>
      <span className="flex flex-wrap items-end justify-between gap-2.5">
        <span className="sp-num whitespace-nowrap text-[30px] font-bold leading-[32px] tracking-[-0.01em]">{value}</span>
        {viz}
      </span>
      <span className="sp-num sp-caption">{base}</span>
    </Link>
  );
}

function Line({ values, label }: { values: number[]; label: string }) {
  const top = Math.max(...values);
  const low = Math.min(...values);
  const xy = values.map((v, i) => [4 + (i * 72) / Math.max(values.length - 1, 1), 30 - ((v - low) / Math.max(top - low, 1)) * 24]);
  const end = xy[xy.length - 1];
  return (
    <svg viewBox="0 0 80 34" width="80" height="34" role="img" aria-label={label}>
      <polyline className="sp-draw" pathLength={1} points={xy.map(([a, b]) => `${a},${b}`).join(" ")} style={{ fill: "none", stroke: "var(--fixes)", strokeWidth: 2.5, strokeLinejoin: "round", strokeLinecap: "round" }} />
      <circle className="sp-dot" cx={end[0]} cy={end[1]} r="3.5" style={{ fill: "var(--fixes)", transformOrigin: `${end[0]}px ${end[1]}px` }} />
    </svg>
  );
}

function Bar({ parts, label }: { parts: { n: number; color?: string; className?: string }[]; label: string }) {
  return (
    <span role="img" aria-label={label} className="sp-grow-x mb-2 flex h-3 min-w-12 max-w-24 flex-1 gap-[2px] overflow-hidden rounded-full" style={{ background: "var(--track-empty)" }}>
      {parts.map((p, i) => (p.n ? <span key={i} className={p.className} style={{ flexGrow: p.n, background: p.color }} /> : null))}
    </span>
  );
}

function Focus({ top, others, context }: { top: Card; others: Card[]; context: Context[] }) {
  const detail = useApi<Detail>(`/api/hr/themes/${top.driver}?touchpoint=14`);
  const points = (detail.data?.by_intake ?? []).flatMap((s) => (s.enough ? [{ label: month(s.intake), n: s.n, m: s.m }] : []));
  return (
    <section aria-label="Focus now" className="sp-card flex flex-col" style={{ borderColor: "var(--problems)", borderWidth: 2 }}>
      <div className="flex flex-wrap gap-6 px-[22px] py-5">
        <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-3">
          <span className="flex items-center gap-2">
            <span className="sp-caption font-semibold uppercase tracking-wide">Focus now</span>
            <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: "var(--problems)", color: "var(--on-problems)" }}>
              Top problem
            </span>
          </span>
          <h2 className="m-0 text-[26px] font-bold leading-8">{driverName(top.driver)}</h2>
          <CountBar count={top.n} of={top.m} label={`who answered at ${dayLabel(14)}`} />
          <span className="sp-meta">{typedLine(top)}</span>
          {top.held?.map((h) => (
            <span key={h.language} className="sp-meta">{h.reason}</span>
          ))}
          <span className="flex flex-wrap gap-2 pt-1">
            <Button variant="primary" lane="problems" href={`/fixes/new?driver=${top.driver}`}>
              Draft a fix
            </Button>
            <Button variant="secondary" lane="problems" href={`/problems/${top.driver}`}>
              See the replies
            </Button>
          </span>
        </div>
        <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-4">
          <Waffle c={top} />
          {points.length > 1 ? (
            <div className="flex max-w-[220px] flex-col gap-0.5">
              <span className="sp-caption font-semibold">Each intake</span>
              <Spark points={points} label={`${driverName(top.driver)} in each intake: ${points.map((p) => `${p.label} ${p.n} of ${p.m}`).join(", ")}`} />
              <span className="flex justify-between sp-caption">
                <span>{points[0].label}</span>
                <span>{points[points.length - 1].label}</span>
              </span>
            </div>
          ) : null}
        </div>
      </div>
      {others.length ? (
        <div className="grid gap-x-6 gap-y-2 border-t px-[22px] py-4" style={{ borderColor: "var(--line-soft)", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          {others.map((c) => (
            <Link key={c.driver} href={`/problems/${c.driver}`} className="flex flex-col gap-1 rounded-lg py-1 no-underline" style={{ color: "var(--ink)" }}>
              <span className="flex justify-between gap-2 text-[13px]">
                <span className="font-semibold">{driverName(c.driver)}</span>
                <span className="sp-num sp-muted">
                  {c.n} of {c.m}
                </span>
              </span>
              <span className="h-1.5 overflow-hidden rounded-full" style={{ background: "var(--track-empty)" }}>
                <span className="sp-grow-x block h-full rounded-full" style={{ width: `${pct(c.n ?? 0, c.m ?? 0)}%`, background: "var(--problems)", opacity: 0.6 }} />
              </span>
            </Link>
          ))}
        </div>
      ) : null}
      {context.some((c) => c.enough) ? (
        <div className="sp-meta border-t px-[22px] py-3" style={{ borderColor: "var(--line-soft)" }}>
          <b>For HR only:</b> {context.filter((c) => c.enough).map((c) => `${CONTEXT[c.theme] ?? c.theme} ${c.n} of ${c.m}`).join(" · ")}. Outside a manager&apos;s control, so never sent as a manager task.
        </div>
      ) : null}
    </section>
  );
}

function TeamGrid({ drivers }: { drivers: string[] }) {
  const lists: Record<string, Teams | undefined> = {
    ROLE_CLARITY: useApi<Teams>("/api/hr/themes/ROLE_CLARITY/teams", 60000).data,
    ONBOARDING_TRAINING: useApi<Teams>("/api/hr/themes/ONBOARDING_TRAINING/teams", 60000).data,
    MANAGER_SUPPORT: useApi<Teams>("/api/hr/themes/MANAGER_SUPPORT/teams", 60000).data,
    BELONGING: useApi<Teams>("/api/hr/themes/BELONGING/teams", 60000).data,
    WORKLOAD: useApi<Teams>("/api/hr/themes/WORKLOAD/teams", 60000).data,
  };
  const ready = drivers.every((d) => lists[d]);
  const cell = new Map<string, TeamRow>();
  for (const d of drivers) {
    const list = lists[d];
    if (list?.enough) for (const r of list.rows) cell.set(`${r.name}|${d}`, r);
  }
  const names = [...new Set([...cell.keys()].map((k) => k.split("|")[0]))].sort((a, b) => a.localeCompare(b));
  const eligible = drivers.map((d) => lists[d]).find((l): l is Extract<Teams, { enough: true }> => !!l?.enough)?.eligible;
  return (
    <LaneSection
      lane="problems"
      title="Which teams need a fix"
      meta={eligible !== undefined ? `${names.length} of ${eligible} teams with 5+ answers stand out · A to Z, never ranked` : undefined}
    >
      {!ready ? (
        <div className="sp-skel mx-[18px] my-4 h-32" />
      ) : names.length === 0 ? (
        <Row title="No team stands out" meta="Each problem is about as common in every team, so a company-wide fix fits." />
      ) : (
        <div className="overflow-x-auto px-[18px] py-4">
          <table className="w-full min-w-[560px] table-fixed border-separate text-[13px]" style={{ borderSpacing: 4 }}>
            <thead>
              <tr>
                <th className="w-[26%]" />
                {drivers.map((d) => (
                  <th key={d} scope="col" className="px-1 pb-1 text-left text-xs font-semibold leading-4 sp-muted">
                    {driverName(d)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {names.map((name) => (
                <tr key={name}>
                  <th scope="row" className="pr-2 text-left font-semibold">
                    {name}
                  </th>
                  {drivers.map((d) => {
                    const r = cell.get(`${name}|${d}`);
                    return (
                      <td key={d} className="p-0">
                        {r ? (
                          <Link
                            href={`/fixes/new?driver=${d}${r.teams.map((t) => `&team=${encodeURIComponent(t)}`).join("")}`}
                            title={`Draft a ${driverName(d).toLowerCase()} fix for ${name}`}
                            className="sp-num flex h-10 items-center justify-center rounded-md font-bold no-underline"
                            style={{ background: "var(--problems)", color: "var(--on-problems)" }}
                          >
                            {r.n} of {r.m}
                          </Link>
                        ) : (
                          <span className="block h-10 rounded-md" style={{ background: "var(--surface-sunken)" }} aria-label="Not above the company rate" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="sp-caption m-0 mt-2">
            A filled box means that team raised the problem at least 2 more times than the company rate predicts, in the latest weekly snapshot. Tap it to draft a fix for that team lead. Teams under 5 answers are pooled or hidden.
          </p>
        </div>
      )}
    </LaneSection>
  );
}

export default function Page() {
  const [done, setDone] = useState<{ row: QueueRow; undo: () => Promise<unknown> }[]>([]);
  const me = useApi<Me>("/api/hr/me", 60000);
  const themes = useApi<Themes>("/api/hr/themes?touchpoint=14");
  const queue = useApi<QueueRow[]>("/api/hr/queue");
  const actions = useApi<Action[]>("/api/hr/actions");
  const impact = useApi<Impact>("/api/hr/impact");

  const doneIds = new Set(done.map((d) => d.row.id));
  const toCheck = (queue.data ?? []).filter((r) => !r.escalate && !doneIds.has(r.id));
  const cards = themes.data?.cards ?? [];
  const typed = (c: Card) => (c.reviewed ?? 0) + (c.ai_confident ?? 0);
  const enough = cards.filter((c) => c.enough).sort((a, b) => (b.n ?? 0) - (a.n ?? 0) || typed(b) - typed(a));
  const top = enough[0];
  const notEnough = cards.find((c) => !c.enough);
  const judged = (actions.data ?? []).filter((a) => a.status === "done" && !a.hiring_side && a.verdict);
  const measured = judged.filter((a) => a.verdict !== "too_early");
  const worked = measured.filter((a) => a.verdict === "worked").length;
  const tooEarly = judged.length - measured.length;
  const retention = impact.data?.retention;
  const kept = retention?.enough ? pct(retention.k, retention.n) : null;
  const base = impact.data?.baseline ? pct(impact.data.baseline.kept, impact.data.baseline.of) : null;
  const trend = (impact.data?.retention_by_intake ?? []).map((r) => pct(r.employed, r.hired));
  const day14 = impact.data?.day14;

  return (
    <>
      <PageHeader
        title="Home"
        sub={
          <>
            {me.data ? `${new Date(me.data.today).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kuala_Lumpur" })} · ` : ""}
            {dayLabel(14)} check-in · new hires in their first six months
          </>
        }
      />

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(160px, 100%), 1fr))" }}>
        <Tile
          href="/fixes"
          label="Still employed at Month 6"
          value={kept !== null ? `${kept}%` : "–"}
          viz={trend.length > 1 ? <Line values={trend} label={`Still employed by intake: ${trend.map((t) => `${t}%`).join(", ")}`} /> : null}
          base={kept !== null && base !== null ? <><b style={{ color: "var(--fixes)" }}>{kept - base >= 0 ? "+" : "-"}{Math.abs(kept - base)} pts</b> vs {base}% before Sapa</> : retention && !retention.enough ? retention.message : ""}
        />
        <Tile
          href="/fixes"
          label={`Answered ${dayLabel(14)}`}
          value={day14 ? `${pct(day14.answered, day14.of)}%` : "–"}
          viz={day14 ? <Bar parts={[{ n: day14.answered, color: "var(--problems)" }, { n: day14.of - day14.answered }]} label={`${day14.answered} of ${day14.of} answered`} /> : null}
          base={day14 ? `${day14.answered} of ${day14.of} new hires` : "Not enough people yet"}
        />
        <Tile
          href="#replies"
          label="Replies to check"
          value={queue.data ? toCheck.length : "–"}
          viz={
            toCheck.length ? (
              <span aria-hidden="true" className="mb-1.5 flex flex-wrap justify-end gap-1">
                {toCheck.slice(0, 8).map((r, i) => (
                  <span key={r.id} className="sp-dot h-3 w-3 rounded-full" style={{ background: r.status === "needs_review" ? "var(--waiting)" : "var(--ai)", animationDelay: `${i * 60}ms` }} />
                ))}
              </span>
            ) : null
          }
          base={toCheck.length ? "The AI labelled them. Confirm or change." : done.length ? `${done.length} checked just now` : "All checked"}
        />
        <Tile
          href="/fixes"
          label="Fixes that worked"
          value={measured.length ? `${worked} of ${measured.length}` : "–"}
          viz={judged.length ? <Bar parts={[{ n: worked, color: "var(--fixes)" }, { n: measured.length - worked, color: "var(--line-strong)" }, { n: tooEarly, className: "sp-bar-hatch" }]} label={`${worked} worked, ${measured.length - worked} no clear change, ${tooEarly} too early`} /> : null}
          base={measured.length ? `measured${tooEarly ? ` · ${tooEarly} too early to tell` : ""}` : "No fix measured yet"}
        />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        {top ? (
          <Focus top={top} others={enough.slice(1)} context={themes.data?.context ?? []} />
        ) : (
          <section aria-label="Focus now" className="sp-card flex flex-col gap-2 px-[22px] py-5">
            <span className="sp-caption font-semibold uppercase tracking-wide">Focus now</span>
            {notEnough ? (
              <>
                <CountBar notEnough />
                <span className="sp-caption">{notEnough.message}</span>
              </>
            ) : (
              <div className="sp-skel h-40" />
            )}
          </section>
        )}

        <LaneSection lane="ai" id="replies" title="Replies to check" meta={`${toCheck.length} need you`}>
          {done.map(({ row, undo }) => (
            <Row
              key={row.id}
              metric={<AiMark state="confirmed" label="Checked" />}
              action={
                <Button
                  onClick={async () => {
                    await undo();
                    setDone((d) => d.filter((x) => x.row.id !== row.id));
                  }}
                >
                  Undo
                </Button>
              }
            >
              {row.text ? <Quote text={row.text} evidence={row.evidence_quote} /> : null}
            </Row>
          ))}
          {toCheck.slice(0, 3).map((row) => (
            <ReplyItem key={row.id} row={row} onDone={(r, undo) => setDone((d) => [...d, { row: r, undo }])} />
          ))}
          {queue.data && toCheck.length === 0 && done.length === 0 ? <Row title="Nothing to check" meta="New replies show here as soon as a new hire finishes a check-in." /> : null}
          <div className="border-t px-[18px] py-3" style={{ borderColor: "var(--line-soft)" }}>
            <Link href="/replies" className="inline-flex min-h-11 items-center text-[13px] font-semibold md:min-h-0">
              See all replies and chat logs
            </Link>
          </div>
        </LaneSection>
      </div>

      <TeamGrid drivers={enough.length ? enough.map((c) => c.driver) : Object.keys(DRIVERS)} />
    </>
  );
}
