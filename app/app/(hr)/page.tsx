"use client";

import Link from "next/link";
import { useState } from "react";
import { apiSend, useApi } from "@/components/sapa/data";
import { Translation } from "@/components/sapa/reply";
import {
  AiMark,
  Button,
  Card,
  CountBar,
  CountUp,
  Dialog,
  FixTrack,
  LaneSection,
  LaneTile,
  PageHeader,
  Quote,
  Row,
  Waiting,
  dayLabel,
  driverName,
  DRIVERS,
  shortDate,
} from "@/components/sapa/ui";

const CONTEXT: Record<string, string> = { PAY_BENEFITS: "Pay and benefits", GROWTH: "Growth", COMMUTE_LOGISTICS: "Commute" };

type Me = { today: string };
type Escalation = { id: string; category: string; created_at: string; closed_at: string | null; waited_hours: number; overdue: boolean };
type Card = { driver: string; enough: boolean; message?: string; n?: number; m?: number; reviewed?: number; ai_confident?: number; held?: { language: string; reason: string }[] };
type Context = { theme: string; enough: boolean; n?: number; m?: number };
type Themes = { cards: Card[]; context: Context[] };
type QueueRow = { id: string; status: string; drivers: string[]; context_tags: string[]; escalate: boolean; evidence_quote: string | null; text: string | null; note: string | null; created_at: string; language?: string };
type Offer = { id: string; answer: string | null; contact_due_at: string | null; contact_done_at: string | null; overdue: boolean };
type Questions = { groups: { id: string; text: string; askers: number; unknown: number; handbook_path: string | null }[]; other: { text: string } };
type Score = { headline: string; detail: string | null; note: string };
type Action = { id: string; driver: string; title: string; status: string; due_on: string | null; done_at: string | null; created_at: string; owner: string | null; overdue: boolean; notice: { status: string }; score: Score | null };
type Impact = { retention: { enough: boolean; text?: string; message?: string; note: string }; leavers: { enough: boolean; top_reasons?: { driver: string; n: number }[]; total?: number } };
type Hire = { start_date: string };

const monthName = (date: string) => new Date(date).toLocaleDateString("en-GB", { month: "long", timeZone: "UTC" });

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
        {shortDate(row.created_at)}
        {row.language === "zh" ? " · Chinese" : ""}
      </div>
      {row.text ? <Quote text={row.text} evidence={row.evidence_quote} /> : null}
      <Translation id={row.id} language={row.language} />
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

export default function Page() {
  const touchpoint = 14;
  const [done, setDone] = useState<{ row: QueueRow; undo: () => Promise<unknown> }[]>([]);
  const me = useApi<Me>("/api/hr/me", 60000);
  const themes = useApi<Themes>(`/api/hr/themes?touchpoint=${touchpoint}`);
  const escalations = useApi<Escalation[]>("/api/hr/escalations");
  const queue = useApi<QueueRow[]>("/api/hr/queue");
  const offers = useApi<Offer[]>("/api/hr/offers");
  const questions = useApi<Questions>("/api/hr/questions");
  const actions = useApi<Action[]>("/api/hr/actions");
  const impact = useApi<Impact>("/api/hr/impact");
  const hires = useApi<Hire[]>("/api/hr/hires", 60000);

  const replies = (queue.data ?? []).filter((r) => !r.escalate);
  const doneIds = new Set(done.map((d) => d.row.id));
  const toCheck = replies.filter((r) => !doneIds.has(r.id));
  const cards = themes.data?.cards ?? [];
  const enough = cards.filter((c) => c.enough).sort((a, b) => (b.n ?? 0) - (a.n ?? 0));
  const top = enough[0];
  const others = enough.slice(1);
  const notEnough = cards.find((c) => !c.enough);
  const tasks = (offers.data ?? []).filter((o) => o.answer === "yes" && o.contact_due_at && !o.contact_done_at);
  const fixes = actions.data ?? [];
  const openFixes = fixes.filter((a) => a.status !== "done" && a.status !== "dismissed");
  const finished = fixes.filter((a) => a.status === "done" && a.score).sort((a, b) => (b.done_at ?? "").localeCompare(a.done_at ?? ""));
  const latest = finished[0];
  const since = me.data ? new Date(new Date(me.data.today.slice(0, 10)).setUTCMonth(new Date(me.data.today.slice(0, 10)).getUTCMonth() - 6)).toISOString().slice(0, 10) : "";
  const group = (hires.data ?? []).filter((h) => h.start_date >= since);
  const intakes = [...new Set(group.map((h) => h.start_date.slice(0, 7)))].sort();
  const activity = [
    ...(escalations.data ?? []).map((e) => ({ at: e.created_at, what: "A serious concern arrived" })),
    ...fixes.flatMap((a) => [
      { at: a.created_at, what: `Fix drafted: ${a.title}` },
      ...(a.done_at ? [{ at: a.done_at, what: `Fix done: ${a.title}` }] : []),
    ]),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 4);

  return (
    <>
      <PageHeader
        title="Needs you"
        sub={
          <>
            {me.data ? `${new Date(me.data.today).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kuala_Lumpur" })} · ` : ""}
            {dayLabel(touchpoint)} check-in · new hires in their first six months
          </>
        }
      />

      <nav aria-label="Lanes on this page" className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <LaneTile
          lane="problems"
          count={top ? <><CountUp value={top.n ?? 0} /> of <CountUp value={top.m ?? 0} /></> : "–"}
          label={top ? `Raised ${driverName(top.driver).toLowerCase()}` : "Shared problems"}
          hint={top ? `Top problem at ${dayLabel(touchpoint)}` : notEnough?.message}
          href="#problems"
        />
        <LaneTile lane="ai" count={toCheck.length} label="Replies to check" hint={done.length ? `${done.length} checked just now` : undefined} href="#replies" />
        <LaneTile lane="fixes" count={openFixes.length} label="Fixes" hint={finished.length ? `${finished.length} with a result` : undefined} href="#fixes" />
      </nav>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          <LaneSection lane="problems" id="problems" title="Shared problems" meta={`${dayLabel(touchpoint)} · counted from labels HR checked or the AI was sure of`}>
            {notEnough ? (
              <div className="px-[18px] py-4">
                <CountBar notEnough />
                <div className="sp-caption mt-1">{notEnough.message}</div>
              </div>
            ) : top ? (
              <>
                <div className="flex flex-col gap-4 px-[18px] py-4">
                  <div className="sp-caption font-semibold uppercase tracking-wide">Top problem area</div>
                  <div className="text-[22px] font-bold leading-7">{driverName(top.driver)}</div>
                  <CountBar count={top.n} of={top.m} label={`who answered at ${dayLabel(touchpoint)}`} />
                  <div className="sp-meta">
                    {top.reviewed} reviewed{top.ai_confident ? `, ${top.ai_confident} AI-confident` : ""}
                  </div>
                  {top.held?.map((h) => (
                    <div key={h.language} className="sp-meta">{h.reason}</div>
                  ))}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="primary" lane="problems" href={`/fixes/new?driver=${top.driver}`}>
                      Draft a fix
                    </Button>
                    <Button variant="secondary" lane="problems" href={`/problems/${top.driver}`}>
                      See the replies
                    </Button>
                  </div>
                </div>
                {others.length ? <div className="sp-caption border-t px-[18px] pt-3 font-semibold uppercase tracking-wide" style={{ borderColor: "var(--line-soft)" }}>Other problem areas</div> : null}
                {others.map((c) => (
                  <Row
                    key={c.driver}
                    title={driverName(c.driver)}
                    meta={`${c.reviewed} reviewed${c.ai_confident ? `, ${c.ai_confident} AI-confident` : ""}`}
                    metric={<CountBar count={c.n} of={c.m} label="who answered" />}
                    action={
                      <Button variant="secondary" lane="problems" href={`/problems/${c.driver}`}>
                        See the replies
                      </Button>
                    }
                  />
                ))}
                {themes.data?.context.some((c) => c.enough) ? (
                  <div className="sp-meta border-t px-[18px] py-3" style={{ borderColor: "var(--line-soft)" }}>
                    <b>For HR only:</b> {themes.data.context.filter((c) => c.enough).map((c) => `${CONTEXT[c.theme] ?? c.theme} ${c.n} of ${c.m}`).join(" · ")}. Outside a manager&apos;s control, so never sent as a manager task.
                  </div>
                ) : null}
              </>
            ) : null}
          </LaneSection>

          <LaneSection lane="ai" id="replies" title="Replies to check" meta={`${toCheck.length} need you · labels the AI was sure of count straight away, and you can change any`}>
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
            {toCheck.length === 0 && done.length === 0 ? <Row title="Nothing to check" /> : null}
            <div className="border-t px-[18px] py-3" style={{ borderColor: "var(--line-soft)" }}>
              <Link href="/replies" className="inline-flex min-h-11 items-center text-[13px] font-semibold md:min-h-0">
                See all replies
              </Link>
            </div>
          </LaneSection>

          {tasks.length ? (
            <LaneSection lane="ai" title="Contact tasks" meta="People who said Yes to a private chat">
              {tasks.map((o) => (
                <Row
                  key={o.id}
                  title="Contact someone who said Yes to a private chat"
                  meta={`Due ${shortDate(o.contact_due_at)}`}
                  metric={o.overdue ? <Waiting>Overdue</Waiting> : null}
                  action={
                    <Button variant="primary" lane="ai" onClick={() => apiSend(`/api/hr/offers/${o.id}/contact-done`)}>
                      Mark done
                    </Button>
                  }
                />
              ))}
            </LaneSection>
          ) : null}

          <LaneSection lane="fixes" id="fixes" title="Fixes" meta="Draft, assigned, accepted, done, note sent to new hires">
            {openFixes.map((a) => (
              <Row
                key={a.id}
                title={a.title}
                meta={`${a.owner ?? "HR"} · from ${driverName(a.driver)}`}
                metric={
                  <>
                    <FixTrack step={["draft", "assigned", "accepted"].indexOf(a.status) + 1} detail={a.due_on ? `due ${shortDate(a.due_on)}` : undefined} />
                    {a.overdue ? <Waiting>Overdue</Waiting> : null}
                  </>
                }
                action={
                  <Button variant="secondary" lane="fixes" href="/fixes">
                    View
                  </Button>
                }
              />
            ))}
            {latest?.score ? (
              <Row
                title={latest.title}
                meta={`${latest.owner ?? "HR"} · from ${driverName(latest.driver)} · done ${shortDate(latest.done_at)}`}
                metric={<FixTrack step={latest.notice.status === "sent" ? 5 : 4} />}
                action={
                  <Button variant="secondary" lane="fixes" href="/fixes">
                    See result
                  </Button>
                }
              >
                <div className="sp-meta mt-2">
                  <b style={{ color: "var(--ink)" }}>{latest.score.headline}</b>
                  {latest.score.detail ? ` ${latest.score.detail}` : ""}
                  <div>{latest.score.note}</div>
                </div>
              </Row>
            ) : null}
            {openFixes.length === 0 && !latest ? <Row title="No fixes yet" /> : null}
          </LaneSection>
        </div>

        <aside aria-label="Group, impact and activity" className="flex min-w-0 flex-col gap-4">
          <Card title="This group" meta={hires.data && me.data ? `${group.length} new hires` : undefined}>
            {intakes.length ? (
              <div className="sp-meta">
                {intakes.length} {intakes.length === 1 ? "intake" : "intakes"}, {monthName(`${intakes[0]}-01`)} to {monthName(`${intakes[intakes.length - 1]}-01`)} · each leaves at their own Month 6
              </div>
            ) : null}
            {top ? <div className="sp-meta">{top.m} answered {dayLabel(touchpoint)}</div> : null}
            <div className="sp-caption">Check-ins go out on working days, in working hours only.</div>
          </Card>

          <Card title="Is it working?">
            {impact.data ? (
              <>
                <div>
                  <div className="sp-num text-[15px] font-bold">{impact.data.retention.enough ? impact.data.retention.text : impact.data.retention.message}</div>
                  <div className="sp-caption mt-1">A trend, not proof that Sapa caused it.</div>
                </div>
                {impact.data.leavers.enough && impact.data.leavers.top_reasons?.[0] ? (
                  <div className="sp-meta">
                    Leavers&apos; top reason: {driverName(impact.data.leavers.top_reasons[0].driver)}, {impact.data.leavers.top_reasons[0].n} of {impact.data.leavers.total}
                  </div>
                ) : null}
                <Link href="/impact" className="inline-flex min-h-11 items-center self-start text-[13px] font-semibold md:min-h-0">
                  Open Impact
                </Link>
              </>
            ) : null}
          </Card>

          <Card title="Questions new hires ask" meta="Last 30 days · no names">
            {questions.data?.groups.toReversed().map((g) => (
              <div key={g.id}>
                <div className="font-semibold">{g.text}</div>
                <div className="sp-meta">
                  {g.askers} asked · {g.handbook_path && g.unknown === 0 ? `from the handbook page ${g.handbook_path}` : "Not in the handbook"}
                </div>
                {g.handbook_path && g.unknown === 0 ? null : (
                  <Link
                    href={`/fixes/new?driver=ONBOARDING_TRAINING&own=${encodeURIComponent(g.text)}`}
                    className="inline-flex min-h-11 items-center text-[13px] font-semibold md:min-h-0"
                  >
                    Fix this gap
                  </Link>
                )}
              </div>
            ))}
            {questions.data ? <div className="sp-caption">{questions.data.other.text}</div> : null}
          </Card>

          <Card title="Recent activity">
            {activity.map((e, i) => (
              <div key={i} className="flex justify-between gap-3">
                <span>{e.what}</span>
                <span className="sp-caption shrink-0">{shortDate(e.at)}</span>
              </div>
            ))}
            {activity.length === 0 ? <span className="sp-muted">Nothing yet</span> : null}
          </Card>
        </aside>
      </div>
    </>
  );
}
