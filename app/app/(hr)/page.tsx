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
type Action = { status: string; owner: string | null; overdue: boolean };
type Questions = { groups: { id: string; askers: number; unknown: number; handbook_path: string | null }[] };

const pct = (part: number, whole: number) => Math.round((part / Math.max(whole, 1)) * 100);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
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

function Tile({ label, value, base, href }: { label: string; value: number | undefined; base: ReactNode; href: string }) {
  return (
    <Link href={href} className="sp-card flex flex-col gap-2 px-[18px] py-4 no-underline" style={{ color: "var(--ink)" }}>
      <span className="text-[13px] font-semibold leading-[18px] sp-muted">{label}</span>
      <span className="sp-num text-[30px] font-bold leading-[32px] tracking-[-0.01em]" style={value ? undefined : { color: "var(--ink-muted)" }}>
        {value ?? "–"}
      </span>
      <span className="sp-caption">{base}</span>
    </Link>
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

export default function Page() {
  const [done, setDone] = useState<{ row: QueueRow; undo: () => Promise<unknown> }[]>([]);
  const me = useApi<Me>("/api/hr/me", 60000);
  const themes = useApi<Themes>("/api/hr/themes?touchpoint=14");
  const queue = useApi<QueueRow[]>("/api/hr/queue");
  const actions = useApi<Action[]>("/api/hr/actions");
  const questions = useApi<Questions>("/api/hr/questions");

  const doneIds = new Set(done.map((d) => d.row.id));
  const toCheck = (queue.data ?? []).filter((r) => !r.escalate && !doneIds.has(r.id));
  const cards = themes.data?.cards ?? [];
  const typed = (c: Card) => (c.reviewed ?? 0) + (c.ai_confident ?? 0);
  const enough = cards.filter((c) => c.enough).sort((a, b) => (b.n ?? 0) - (a.n ?? 0) || typed(b) - typed(a));
  const top = enough[0];
  const notEnough = cards.find((c) => !c.enough);
  const open = (actions.data ?? []).filter((a) => ["draft", "assigned", "accepted"].includes(a.status));
  const drafts = open.filter((a) => a.status === "draft").length;
  const waiting = open.filter((a) => a.status !== "draft" && a.owner !== "HR");
  const late = waiting.filter((a) => a.overdue).length;
  const unaccepted = waiting.filter((a) => a.status === "assigned").length;
  const gaps = (questions.data?.groups ?? []).filter((g) => !g.handbook_path || g.unknown > 0);
  const asked = gaps.reduce((t, g) => t + g.askers, 0);

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

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))" }}>
        <Tile href="/fixes" label="Drafts to finish" value={actions.data ? drafts : undefined} base={drafts ? "Fixes you started and did not send" : "No unsent fixes"} />
        <Tile
          href="/fixes"
          label="Waiting for a manager"
          value={actions.data ? waiting.length : undefined}
          base={late ? <b style={{ color: "var(--waiting-ink)" }}>{plural(late, "fix", "fixes")} overdue</b> : unaccepted ? `${unaccepted} not accepted yet` : waiting.length ? "Accepted, not done yet" : "No fix with a manager"}
        />
        <Tile
          href={gaps.length ? `/problems/q-${gaps[0].id}` : "/problems"}
          label="Questions the handbook cannot answer"
          value={questions.data ? gaps.length : undefined}
          base={gaps.length ? `Asked by ${plural(asked, "new hire", "new hires")}` : "The handbook answers every question"}
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
    </>
  );
}
