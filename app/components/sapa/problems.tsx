"use client";

import Link from "next/link";
import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { useApi } from "./data";
import { Translation, type ReplyItem } from "./reply";
import { AiMark, Button, CountBar, FixTrack, Loading, Quote, Waiting, dayLabel, driverName, shortDate } from "./ui";

type Share = { enough: true; n: number; m: number; reviewed?: number; ai_confident?: number; score_only?: number } | { enough: false; have: number; need: number };
type Card = { driver: string; enough: boolean; n?: number; m?: number; reviewed?: number; ai_confident?: number; score_only?: number; message?: string };
type Themes = { cards: Card[] };
type Detail = {
  card: Share;
  by_day: (Share & { touchpoint: number })[];
  by_intake: (Share & { intake: string })[];
  by_role: (Share & { role: string })[];
};
type Groups = { status: "unavailable" } | { status: "ok"; enough: false; have: number; need: number } | { status: "ok"; groups: { title: string; n: number; reply_ids: string[] }[]; not_grouped: number };
type Entry = { id: string; title: string; text: string; used: number; difference: number | null; evidence: string; result: string };
type Lead = { id: string; name: string };
type TeamRow = { kind: "team" | "tower"; name: string; teams: string[]; n: number; m: number; avg: number | null; leads: Lead[] };
type Teams = { enough: false } | { enough: true; week: string; company: { n: number; m: number; avg: number | null }; verdict: "none" | "some" | "most"; rows: TeamRow[]; eligible: number; small: number; safety: number };
type Questions = { groups: { id: string; text: string; askers: number; unknown: number; handbook_path: string | null }[]; other: { text: string } };
type Action = { id: string; driver: string; status: string; owner: string | null; assigned_at: string | null; due_on: string | null; title: string; steps: string | null; library_entry_id: string | null };

const STEP: Record<string, number> = { draft: 1, assigned: 2, accepted: 3 };
const live = (a: Action) => a.status === "draft" || a.status === "assigned" || a.status === "accepted";
const month = (intake: string) => new Date(`${intake}-01T00:00:00Z`).toLocaleString("en-GB", { month: "long", timeZone: "UTC" });
const fixLine = (a: Action) =>
  a.status === "draft" ? `${a.title} · draft, not sent yet` : a.status === "accepted" ? `${a.title} · ${a.owner} accepted` : `${a.title} · sent to ${a.owner}${a.assigned_at ? ` ${shortDate(a.assigned_at)}` : ""}, not accepted yet`;
const counted = (r: ReplyItem) => r.status === "reviewed" || (r.status === "ok" && r.counted !== false);
const noArea = (r: ReplyItem) => !!r.text && !r.escalate && !r.drivers?.length && counted(r);
const inHandbook = (g: Questions["groups"][number]) => !!g.handbook_path && g.unknown === 0;
const fixHref = (driver: string, entry: string | undefined, teams: string[]) =>
  `/fixes/new?driver=${driver}${entry ? `&entry=${entry}` : ""}${teams.map((t) => `&team=${encodeURIComponent(t)}`).join("")}`;

function Bar({ s, label }: { s: Share; label: string }) {
  if (s.enough) return <CountBar count={s.n} of={s.m} label={label} />;
  return (
    <div>
      <span className="sp-caption font-semibold">{label.charAt(0).toUpperCase() + label.slice(1)}</span>
      <CountBar notEnough have={s.have} need={s.need} />
    </div>
  );
}

function Timeline({ stops }: { stops: (Share & { touchpoint: number })[] }) {
  return (
    <ol className="m-0 flex list-none flex-col p-0">
      {stops.map((s, i) => (
        <li key={s.touchpoint} className="relative flex gap-3 pb-4 last:pb-0">
          {i < stops.length - 1 ? <span aria-hidden="true" className="absolute left-[5px] top-4 bottom-0 w-0.5" style={{ background: "var(--line)" }} /> : null}
          <span
            aria-hidden="true"
            className="relative mt-1 h-3 w-3 flex-none rounded-full border-2"
            style={s.enough ? { background: "var(--problems)", borderColor: "var(--problems)" } : { background: "var(--surface-sunken)", borderColor: "var(--line)" }}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="sp-caption font-semibold">{dayLabel(s.touchpoint)}</span>
            {s.enough ? (
              <CountBar count={s.n} of={s.m} />
            ) : (
              <span className="sp-count-muted text-[13px]">
                Waiting: {s.have} of {s.need} people answered
              </span>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function Step({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden="true" className="sp-step">
        {n}
      </span>
      <h3 className="m-0 text-[18px] font-bold leading-6">{title}</h3>
    </div>
  );
}

function Spark({ points, label }: { points: { n: number; m: number }[]; label: string }) {
  const top = Math.max(...points.map((p) => p.n / p.m), 0.01);
  const xy = points.map((p, i) => [4 + (i * 112) / Math.max(points.length - 1, 1), 37 - (p.n / p.m / top) * 30]);
  const last = xy[xy.length - 1];
  return (
    <svg viewBox="0 0 120 40" width="200" height="66" role="img" aria-label={label} className="max-w-full">
      <polyline
        className="sp-spark"
        pathLength={1}
        points={xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")}
        style={{ fill: "none", stroke: "var(--problems)", strokeWidth: 2.5, strokeLinejoin: "round", strokeLinecap: "round" }}
      />
      <circle cx={last[0]} cy={last[1]} r="3.5" className="sp-fade-in" style={{ fill: "var(--problems)", animationDelay: "0.9s" }} />
    </svg>
  );
}

function ReplyCard({ r, label }: { r: ReplyItem; label: string }) {
  return (
    <article className="sp-card flex flex-col gap-2 px-4 py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="sp-caption">
          {r.touchpoint !== null ? `${dayLabel(r.touchpoint)} check-in · ` : ""}
          {shortDate(r.created_at)}
        </span>
        <AiMark state={r.status === "reviewed" ? (r.changed_by_hr ? "corrected" : "confirmed") : "suggested"} label={label} reviewer="HR" />
      </div>
      <Quote text={r.text ?? ""} evidence={r.evidence_quote} />
      <Translation id={r.id} language={r.language} />
    </article>
  );
}

function Replies({ driver, replies, groups, filter, setFilter }: { driver: string; replies: ReplyItem[]; groups: { title: string; reply_ids: string[] }[]; filter: string | null; setFilter: (f: string | null) => void }) {
  const [all, setAll] = useState(false);
  const group = groups.find((g) => g.title === filter);
  const shown = group ? replies.filter((r) => group.reply_ids.includes(r.id)) : replies;
  const visible = all ? shown : shown.slice(0, 6);
  return (
    <div id="replies" className="flex scroll-mt-6 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="m-0 mr-2 text-[15px] font-bold">What they said</h4>
        {groups.length ? (
          <div role="group" aria-label="Show replies" className="sp-tabs">
            <button type="button" className="sp-tab" aria-pressed={!filter} onClick={() => setFilter(null)}>
              All · {replies.length}
            </button>
            {groups.map((g) => (
              <button key={g.title} type="button" className="sp-tab" aria-pressed={filter === g.title} onClick={() => setFilter(g.title)}>
                {g.title}
              </button>
            ))}
          </div>
        ) : (
          <span className="sp-caption">{replies.length} replies counted in {driverName(driver)}, newest first</span>
        )}
      </div>
      {shown.length === 0 ? <span className="sp-muted">No replies counted here yet.</span> : null}
      <div key={filter ?? "all"} className="sp-stagger grid gap-3 lg:grid-cols-2">
        {visible.map((r) => (
          <ReplyCard key={r.id} r={r} label={r.status === "reviewed" ? "Checked" : "AI was sure"} />
        ))}
      </div>
      {shown.length > visible.length ? (
        <Button className="self-start" onClick={() => setAll(true)}>
          Show all {shown.length} replies
        </Button>
      ) : null}
    </div>
  );
}

function Where({ driver, name, where, entry }: { driver: string; name: string; where: Teams | undefined; entry: string | undefined }) {
  const [off, setOff] = useState<string[]>([]);
  if (!where) return <div className="sp-skel h-24" />;
  if (!where.enough) return <span className="sp-muted">Teams show once 5 people answer Day 14 and the first weekly snapshot is taken.</span>;
  const rate = Math.round((where.company.n / where.company.m) * 100);
  const ticked = where.rows.filter((r) => !off.includes(r.name));
  const listed = where.rows.filter((r) => r.kind === "team").length;
  const towers = where.rows.length - listed;
  const places = [
    ...(listed ? [`${listed} of ${where.eligible} teams`] : []),
    ...(towers ? [`${towers} pooled ${towers === 1 ? "tower" : "towers"}`] : []),
  ].join(" and ");
  const verdict =
    where.verdict === "none"
      ? { title: `${name} is not more common in any one team`, sub: "A company-wide fix fits better than a team fix." }
      : where.verdict === "most"
        ? { title: `In most teams: ${listed} of ${where.eligible}`, sub: "A company-wide fix may fit better. You can still send one fix to each team lead below." }
        : { title: `In ${places}, not everywhere`, sub: "Send a fix to these teams." };
  return (
    <div className="flex flex-col gap-3 rounded-lg border px-4 py-3.5" style={{ borderColor: "var(--line)" }}>
      <div className="flex flex-col gap-0.5 rounded-lg px-3 py-2.5" style={{ background: "var(--surface-sunken)" }}>
        <span className="text-[15px] font-bold">{verdict.title}</span>
        <span className="sp-caption">{verdict.sub}</span>
      </div>
      {where.rows.length ? (
        <>
          <div className="flex flex-col gap-0.5">
            <h4 className="m-0 text-[14px] font-bold">Teams above the company rate ({rate}%)</h4>
            <span className="sp-caption">
              A to Z. Only teams with 5 or more answers, at least 2 more than expected.
            </span>
          </div>
          <div className="flex flex-col">
            {where.rows.map((r) => (
              <div key={r.name} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t py-2.5" style={{ borderColor: "var(--line-soft)" }}>
                <label className="flex min-w-0 flex-[1_1_200px] items-start gap-2.5">
                  <input type="checkbox" className="mt-1" checked={!off.includes(r.name)} onChange={() => setOff((o) => (o.includes(r.name) ? o.filter((x) => x !== r.name) : [...o, r.name]))} />
                  <span className="flex flex-col">
                    <span className="font-semibold">{r.kind === "tower" ? `${r.name} tower` : r.name}</span>
                    <span className="sp-caption">
                      {r.kind === "tower" ? `${r.teams.length} small teams pooled · ` : ""}
                      {r.leads.map((l) => l.name).join(", ") || "No team lead"}
                    </span>
                  </span>
                </label>
                <div className="flex w-[160px] max-w-full flex-none flex-col gap-1">
                  <CountBar count={r.n} of={r.m} />
                  {r.avg !== null ? <span className="sp-caption">Avg {r.avg}</span> : null}
                </div>
                <Link href={fixHref(driver, entry, r.teams)} className="text-[13px] font-semibold" style={{ color: "var(--problems)" }}>
                  {r.kind === "team" && r.leads.length === 1 ? `Send fix to ${r.leads[0].name}` : "Draft a fix for these teams"}
                </Link>
              </div>
            ))}
          </div>
          {ticked.length > 1 ? (
            <Button variant="primary" lane="problems" className="self-start" href={fixHref(driver, entry, ticked.flatMap((r) => r.teams))}>
              Draft one fix for {ticked.length} {ticked.length === 1 ? "team" : "teams"}
            </Button>
          ) : null}
        </>
      ) : null}
      <span className="sp-caption">
        {where.eligible - listed} {where.eligible - listed === 1 ? "team is" : "teams are"} at or near the company rate and not listed.
        {where.small ? ` ${where.small} ${where.small === 1 ? "team has" : "teams have"} fewer than 5 answers, so no number.` : ""}
        {where.safety ? ` ${where.safety} more ${where.safety === 1 ? "row is" : "rows are"} hidden so the hidden teams cannot be worked out.` : ""} Weekly numbers from {shortDate(where.week)}. Never ranked.
      </span>
    </div>
  );
}

function QuestionPanel({ g }: { g: Questions["groups"][number] }) {
  return (
    <section id="cur" aria-labelledby="cur-title" className="sp-card flex min-w-0 flex-[999_1_560px] scroll-mt-4 flex-col gap-4 px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-1">
        <span className="sp-caption font-semibold">Asked the bot · last 30 days · no names</span>
        <h2 id="cur-title" className="m-0 text-[24px] font-bold leading-[30px]">
          {g.text}
        </h2>
        <span>
          {g.askers} new hires asked · {inHandbook(g) ? `the handbook answers it on ${g.handbook_path}` : "the handbook could not answer it"}
        </span>
      </div>
      <span className="sp-muted">
        {inHandbook(g)
          ? "The bot answered from the handbook, but many still asked. Onboarding could say it earlier."
          : "New hires got \"I don't know yet\". Add it to onboarding so the next intake knows."}
      </span>
      <span className="sp-caption">You see the question group only, never who asked or their own words.</span>
      <Button variant="primary" lane="problems" className="self-start" href={`/fixes/new?driver=ONBOARDING_TRAINING&own=${encodeURIComponent(g.text)}`}>
        Draft an onboarding fix
      </Button>
    </section>
  );
}

function NoAreaPanel({ replies }: { replies: ReplyItem[] }) {
  return (
    <section id="cur" aria-labelledby="cur-title" className="sp-card flex min-w-0 flex-[999_1_560px] scroll-mt-4 flex-col gap-4 px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-1">
        <h2 id="cur-title" className="m-0 text-[24px] font-bold leading-[30px]">
          Replies that fit no problem area
        </h2>
        <span className="sp-muted">The AI put these in none of the 5 areas. Read them. If one fits an area, change its label in All replies, and it counts there.</span>
        <Link href="/#all-replies" className="text-[13px] font-semibold">
          Open All replies
        </Link>
      </div>
      {replies.length === 0 ? <span className="sp-muted">Every reply fits a problem area.</span> : null}
      <div className="sp-stagger grid gap-3 lg:grid-cols-2">
        {replies.map((r) => (
          <ReplyCard key={r.id} r={r} label="No area" />
        ))}
      </div>
    </section>
  );
}

function Problem({ driver, card, actions, waiting }: { driver: string; card: Card; actions: Action[]; waiting: number }) {
  const [filter, setFilter] = useState<string | null>(null);
  const detail = useApi<Detail>(`/api/hr/themes/${driver}?touchpoint=14`);
  const groups = useApi<Groups>(`/api/hr/themes/${driver}/groups?touchpoint=14`);
  const library = useApi<Entry[]>(`/api/hr/actions/library?driver=${driver}`);
  const replies = useApi<ReplyItem[]>("/api/hr/replies", 30000);
  const where = useApi<Teams>(`/api/hr/themes/${driver}/teams`);
  const fixes = actions.filter((a) => a.driver === driver && live(a));
  const name = driverName(driver);

  const d = detail.data;
  const g = groups.data;
  const grouped = g && g.status === "ok" && "groups" in g ? g.groups : [];
  const mine = (replies.data ?? [])
    .filter((r) => r.touchpoint === 14 && !r.escalate && r.drivers?.includes(driver) && counted(r))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const byId = new Map(mine.map((r) => [r.id, r]));
  const intakes = (d?.by_intake ?? []).filter((s): s is Extract<typeof s, { enough: true }> => s.enough);
  const roles = (d?.by_role ?? []).filter((s) => s.enough);
  const smallRoles = (d?.by_role ?? []).length - roles.length;
  const shown = (library.data ?? []).filter((f) => !fixes.some((a) => a.library_entry_id === f.id));
  const own = fixes.filter((a) => !a.library_entry_id || !(library.data ?? []).some((f) => f.id === a.library_entry_id));
  const readGroup = (title: string | null) => {
    setFilter(title);
    document.getElementById("replies")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section id="cur" aria-labelledby="cur-title" className="sp-card min-w-0 flex-[999_1_560px] scroll-mt-4 overflow-hidden">
      <div key={driver} className="sp-enter">
        <div className="flex flex-col gap-4 border-b px-5 py-5 sm:px-6" style={{ borderColor: "var(--line)" }}>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 id="cur-title" className="m-0 text-[28px] font-bold leading-[34px] tracking-[-0.01em]">
              {name}
            </h2>
            <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: fixes.length ? "var(--fixes-soft)" : "var(--problems-soft)", color: fixes.length ? "var(--fixes)" : "var(--problems)" }}>
              {fixes.length ? "Fix in progress" : "Needs a fix"}
            </span>
          </div>
          <div className="flex flex-wrap items-end gap-x-8 gap-y-5">
            <div className="flex flex-none flex-col gap-0.5">
              {card.enough ? (
                <>
                  <span className="sp-num text-[40px] font-bold leading-[44px]">
                    {card.n} of {card.m}
                  </span>
                  <span>who answered the Day 14 check-in</span>
                  <span className="sp-caption">
                    {card.reviewed ?? 0} you checked · {card.ai_confident ?? 0} the AI was sure about · {card.score_only ?? 0} from a 1–5 score only
                  </span>
                </>
              ) : (
                <CountBar notEnough />
              )}
            </div>
            {intakes.length > 1 ? (
              <figure className="m-0 flex w-[200px] max-w-full flex-none flex-col gap-1">
                <Spark points={intakes} label={`${name} in each intake, out of who answered: ${intakes.map((s) => `${s.n} of ${s.m}`).join(", ")}`} />
                <figcaption className="sp-caption">
                  Each intake, {month(intakes[0].intake)} to {month(intakes[intakes.length - 1].intake)}: {intakes.map((s) => `${s.n} of ${s.m}`).join(", ")}
                </figcaption>
              </figure>
            ) : null}
            <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-2">
              {waiting > 0 ? (
                <Link href="/#replies" className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-[13px] leading-[18px] no-underline transition-colors hover:brightness-95" style={{ background: "var(--ai-soft)", color: "var(--ai)" }}>
                  <MessageSquare size={16} className="mt-px flex-none" aria-hidden="true" />
                  <span>
                    <b>
                      {waiting} new {waiting === 1 ? "reply waits" : "replies wait"} for you.
                    </b>{" "}
                    The AI put {waiting === 1 ? "it" : "them"} here. {waiting === 1 ? "It is" : "They are"} not in the {card.n ?? 0} until you confirm. <span className="font-semibold underline">Check it</span>
                  </span>
                </Link>
              ) : null}
              {fixes.map((a) => (
                <span key={a.id} className="sp-meta">
                  Fix in progress: {fixLine(a)}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-b px-5 py-5 sm:px-6" style={{ borderColor: "var(--line)" }}>
          <Step n={1} title="What new hires mean" />
          {g && g.status === "ok" && "groups" in g && grouped.length ? (
            <div className="sp-stagger flex flex-col gap-2.5">
              {grouped.map((group) => {
                const sample = group.reply_ids.map((id) => byId.get(id)).find((r) => r?.text);
                return (
                  <div key={group.title} className="flex flex-wrap items-start gap-x-6 gap-y-3.5 rounded-lg border px-4 py-3.5" style={{ borderColor: "var(--line)" }}>
                    <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2">
                      <AiMark label={group.title} />
                      {sample ? <Quote text={sample.text!} evidence={sample.evidence_quote} by={`${dayLabel(14)} check-in · ${shortDate(sample.created_at)}`} /> : null}
                    </div>
                    <div className="flex w-[200px] max-w-full flex-none flex-col gap-2.5">
                      {card.enough ? <CountBar count={group.n} of={card.n} label="of these replies" /> : null}
                      <button type="button" className="sp-link" onClick={() => readGroup(group.title)}>
                        Read the {group.n} replies
                      </button>
                    </div>
                  </div>
                );
              })}
              {g.not_grouped > 0 ? (
                <span className="sp-meta">
                  {g.not_grouped} more replies are not grouped: each idea came from fewer than 5 people.{" "}
                  <button type="button" className="sp-link" onClick={() => readGroup(null)}>
                    Read them
                  </button>
                </span>
              ) : null}
            </div>
          ) : g && g.status === "ok" && !("groups" in g) ? (
            <span className="sp-muted">
              {g.have} of {g.need} needed. Shows once {g.need} people answer Day 14.
            </span>
          ) : null}
          {replies.data ? <Replies driver={driver} replies={mine} groups={grouped} filter={filter} setFilter={setFilter} /> : <div className="sp-skel h-24" />}
        </div>

        <div className="flex flex-col gap-4 border-b px-5 py-5 sm:px-6" style={{ borderColor: "var(--line)" }}>
          <Step n={2} title="Who has it" />
          <Where driver={driver} name={name} where={where.data} entry={shown[0]?.id} />
          {d ? (
            <div className="sp-stagger grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <div className="flex flex-col gap-2.5 rounded-lg px-4 py-3.5" style={{ background: "var(--surface-sunken)" }}>
                <h4 className="m-0 text-[14px] font-bold">When it starts</h4>
                <span className="sp-caption">The same group, at each check-in</span>
                <Timeline stops={d.by_day} />
              </div>
              <div className="flex flex-col gap-2.5 rounded-lg px-4 py-3.5" style={{ background: "var(--surface-sunken)" }}>
                <h4 className="m-0 text-[14px] font-bold">By intake</h4>
                {d.by_intake.map((s) => (
                  <Bar key={s.intake} s={s} label={`in the ${month(s.intake)} intake`} />
                ))}
              </div>
              <div className="flex flex-col gap-2.5 rounded-lg px-4 py-3.5" style={{ background: "var(--surface-sunken)" }}>
                <h4 className="m-0 text-[14px] font-bold">By role</h4>
                {roles.map((s) => (
                  <Bar key={s.role} s={s} label={s.role.toLowerCase()} />
                ))}
                {smallRoles ? (
                  <span className="sp-caption">
                    {roles.length ? "Other roles" : `${smallRoles} roles`}: fewer than 5 people answered in each, so no number.
                  </span>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="sp-skel h-40" />
          )}
        </div>

        <div className="flex flex-col gap-4 px-5 py-5 sm:px-6">
          <Step n={3} title="Fix it" />
          <div className="sp-stagger flex flex-col gap-3">
            {fixes.map((a) => {
              const entry = library.data?.find((f) => f.id === a.library_entry_id);
              return (
                <div key={a.id} className="flex flex-wrap items-start gap-x-6 gap-y-3.5 rounded-lg border px-[18px] py-4" style={{ borderColor: "var(--line)" }}>
                  <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-2">
                    <span className="self-start rounded-[3px] px-2 py-0.5 text-xs font-bold" style={{ background: "var(--fixes-soft)", color: "var(--fixes)" }}>
                      Fix in progress
                    </span>
                    <div className="text-[17px] font-bold leading-6">{a.title}</div>
                    {entry || a.steps ? <span className="sp-muted">{entry?.text ?? a.steps}</span> : null}
                  </div>
                  <div className="flex w-[190px] max-w-full flex-none flex-col items-start gap-2.5">
                    <div className="w-full text-[13px] font-semibold">
                      <FixTrack step={STEP[a.status] ?? 1} />
                    </div>
                    <span className="sp-meta">
                      {a.owner ?? "HR"}
                      {a.due_on ? ` · due ${shortDate(a.due_on)}` : ""}
                    </span>
                    {a.status === "assigned" && a.assigned_at ? <Waiting>Sent {shortDate(a.assigned_at)}, not accepted yet</Waiting> : null}
                    <Link href={`/fixes/${a.id}`} className="text-[13px] font-semibold" style={{ color: "var(--fixes)" }}>
                      View fix
                    </Link>
                  </div>
                </div>
              );
            })}
            {library.data
              ? shown.map((f, i) => {
                  const best = i === 0 && own.length === 0;
                  const good = (f.difference ?? 0) > 0;
                  return (
                    <div
                      key={f.id}
                      className="flex flex-wrap items-start gap-x-6 gap-y-3.5 rounded-lg px-[18px] py-4"
                      style={{ border: `${best ? 2 : 1}px solid ${best ? "var(--problems)" : "var(--line)"}` }}
                    >
                      <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-2">
                        {best ? (
                          <span className="self-start rounded-[3px] px-2 py-0.5 text-xs font-bold" style={{ background: "var(--problems)", color: "var(--on-problems)" }}>
                            Best match
                          </span>
                        ) : null}
                        <div className="text-[17px] font-bold leading-6">{f.title}</div>
                        <span className="sp-muted">{f.text}</span>
                        <div className="flex flex-col gap-0.5 rounded-lg px-3 py-2.5" style={{ background: good ? "var(--fixes-soft)" : "var(--surface-sunken)" }}>
                          <span className="text-xs font-bold" style={{ color: good ? "var(--fixes)" : "var(--ink-muted)" }}>
                            {good ? "Worked here before" : "How it worked here"}
                          </span>
                          <span className="sp-num text-[14px] font-semibold" style={{ color: good ? "var(--fixes)" : "var(--ink-muted)" }}>
                            {f.evidence}
                          </span>
                        </div>
                      </div>
                      <div className="flex w-[190px] max-w-full flex-none flex-col items-start gap-2.5">
                        <Button variant={best ? "primary" : "secondary"} lane="problems" href={`/fixes/new?driver=${driver}&entry=${f.id}`}>
                          Draft this fix
                        </Button>
                        <span className="sp-caption">You edit the draft, pick who it covers and approve the note before anything is sent.</span>
                      </div>
                    </div>
                  );
                })
              : <div className="sp-skel h-32" />}
          </div>
          <span className="sp-meta">
            None of these fit?{" "}
            <Link href={`/fixes/new?driver=${driver}`} className="font-semibold" style={{ color: "var(--problems)" }}>
              Write your own fix
            </Link>
          </span>
        </div>
      </div>
    </section>
  );
}

export function Problems({ driver }: { driver?: string }) {
  const themes = useApi<Themes>("/api/hr/themes?touchpoint=14");
  const actions = useApi<Action[]>("/api/hr/actions");
  const queue = useApi<ReplyItem[]>("/api/hr/queue");
  const questions = useApi<Questions>("/api/hr/questions");
  const replies = useApi<ReplyItem[]>("/api/hr/replies", 30000);
  if (!themes.data || !actions.data) return <Loading />;

  const cards = [...themes.data.cards].sort((a, b) => (b.n ?? -1) - (a.n ?? -1));
  const fixOf = (d: string) => actions.data!.find((a) => a.driver === d && live(a));
  const waitingOf = (d: string) => (queue.data ?? []).filter((r) => !r.escalate && r.status !== "reviewed" && r.drivers?.includes(d)).length;
  const groups = questions.data?.groups.toReversed() ?? [];
  const loose = (replies.data ?? []).filter(noArea).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const question = driver?.startsWith("q-") ? groups.find((g) => `q-${g.id}` === driver) : undefined;
  const current = question || driver === "no-area" ? undefined : (cards.find((c) => c.driver === driver) ?? cards[0]);
  const answered = cards.find((c) => c.enough)?.m;
  const pick = () => {
    if (window.innerWidth < 1180) setTimeout(() => document.getElementById("cur")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const item = (c: Card) => {
    const fix = fixOf(c.driver);
    const waiting = waitingOf(c.driver);
    return (
      <Link key={c.driver} href={`/problems/${c.driver}`} scroll={false} onClick={pick} className="sp-pick" aria-current={c.driver === current?.driver ? "true" : undefined}>
        <span className="text-[15px] font-bold leading-5">{driverName(c.driver)}</span>
        {c.enough ? <CountBar count={c.n} of={c.m} label="who answered" /> : <CountBar notEnough />}
        <span className="sp-caption">
          {fix ? fixLine(fix) : "No fix yet"}
          {waiting ? ` · ${waiting} ${waiting === 1 ? "reply waits" : "replies wait"} for you` : ""}
        </span>
      </Link>
    );
  };
  const head = (title: string, first = false) => (
    <div className={`px-4 pb-1 pt-3 text-xs font-bold sp-muted${first ? "" : " border-t"}`} style={{ borderColor: "var(--line-soft)" }}>
      {title}
    </div>
  );

  return (
    <>
      <header className="flex flex-col gap-1.5">
        <span className="sp-caption font-semibold">Day 14 check-in{answered ? ` · ${answered} new hires answered` : ""}</span>
        <h1 className="sp-page-title">Shared problems</h1>
        <span className="sp-muted">What new hires struggle with. Pick one. Send a fix to the teams that need it.</span>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1.5 sp-caption">
          <span>Counts include replies you checked and replies the AI was sure about</span>
          <span>Under 5 people: no number</span>
        </div>
      </header>

      <div className="flex flex-wrap items-start gap-5">
        <div className="flex min-w-0 max-w-full flex-[1_1_300px] flex-col gap-4 min-[1180px]:sticky min-[1180px]:top-6 min-[1180px]:max-w-[340px]">
          <section aria-labelledby="list-title" className="sp-card overflow-hidden">
            <div className="border-b px-4 pb-3 pt-3.5" style={{ borderColor: "var(--line)" }}>
              <h2 id="list-title" className="m-0 text-[15px] font-bold leading-5">
                Problems right now
              </h2>
            </div>
            {head("From check-ins", true)}
            <div className="sp-stagger flex flex-col gap-1.5 px-2 pb-2.5">{cards.map(item)}</div>
            {head("Questions they asked the bot")}
            <div className="flex flex-col gap-1.5 px-2 pb-2.5">
              {groups.map((g) => (
                <Link key={g.id} href={`/problems/q-${g.id}`} scroll={false} onClick={pick} className="sp-pick" aria-current={question?.id === g.id ? "true" : undefined}>
                  <span className="text-[15px] font-bold leading-5">{g.text}</span>
                  <span className="sp-caption">
                    {g.askers} asked · {inHandbook(g) ? "in the handbook" : "not in the handbook"}
                  </span>
                </Link>
              ))}
              {questions.data ? <span className="sp-caption px-2 py-1">{questions.data.other.text}</span> : <div className="sp-skel h-10" />}
            </div>
            {head("No area yet")}
            <div className="flex flex-col gap-1.5 px-2 pb-2.5">
              <Link href="/problems/no-area" scroll={false} onClick={pick} className="sp-pick" aria-current={driver === "no-area" ? "true" : undefined}>
                <span className="text-[15px] font-bold leading-5">
                  {loose.length} {loose.length === 1 ? "reply fits" : "replies fit"} no area
                </span>
                <span className="sp-caption">Read them and label them</span>
              </Link>
            </div>
          </section>
        </div>
        {question ? (
          <QuestionPanel g={question} />
        ) : driver === "no-area" ? (
          <NoAreaPanel replies={loose} />
        ) : current ? (
          <Problem driver={current.driver} card={current} actions={actions.data} waiting={waitingOf(current.driver)} />
        ) : null}
      </div>

      <p className="m-0 rounded-lg border border-dashed px-4 py-3.5 sp-meta" style={{ borderColor: "var(--line-strong)" }}>
        This page shows what is happening now. Problems a fix already solved, and how well each fix worked, are in{" "}
        <Link href="/fixes" className="font-semibold">
          Fixes and impact
        </Link>
        .
      </p>
    </>
  );
}
