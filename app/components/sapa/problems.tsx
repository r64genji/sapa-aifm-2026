"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, BookCheck, BookX, Building2, MessageCircleQuestion, MessageSquare, Users } from "lucide-react";
import { ApiError, apiSend, useApi } from "./data";
import { Avatar, ReplyRow, TranslatedQuote, type ReplyItem } from "./reply";
import { Button, CountBar, DRIVERS, LaneSection, Loading, Row, dayLabel, delay, driverName, month, shortDate } from "./ui";

type Share = { enough: true; n: number; m: number; reviewed?: number; ai_confident?: number; score_only?: number } | { enough: false; have: number; need: number };
type Card = { driver: string; enough: boolean; n?: number; m?: number; reviewed?: number; ai_confident?: number; score_only?: number; avg?: number | null; message?: string };
type Themes = { cards: Card[] };
type Detail = {
  card: Share;
  by_day: (Share & { touchpoint: number })[];
  by_intake: (Share & { intake: string })[];
  by_role: (Share & { role: string })[];
  by_experience: (Share & { group: string })[];
};
type Groups = { status: "unavailable" } | { status: "ok"; enough: false; have: number; need: number } | { status: "ok"; groups: { title: string; n: number; reply_ids: string[] }[]; not_grouped: number };
type Entry = { id: string; title: string; text: string; used: number; difference: number | null; evidence: string; result: string };
type Lead = { id: string; name: string };
type TeamRow = { kind: "team" | "tower"; name: string; teams: string[]; n: number; m: number; avg: number | null; leads: Lead[]; times?: number };
type Teams = { enough: false } | { enough: true; week: string; company: { n: number; m: number; avg: number | null }; verdict: "none" | "some" | "most"; rows: TeamRow[]; eligible: number; small: number; safety: number };
type Overview = { details: Record<string, Detail>; teams: Record<string, Teams> };
type Questions = {
  groups: { id: string; text: string; askers: number; unknown: number; handbook_path: string | null }[];
  all: { id: string; text: string; askers: number }[];
  other: { text: string };
};
type Action = { id: string; driver: string; status: string; owner: string | null; assigned_at: string | null; due_on: string | null; title: string; steps: string | null; library_entry_id: string | null };
type Point = { label: string; n: number; m: number };

const live = (a: Action) => a.status === "draft" || a.status === "assigned" || a.status === "accepted";
const counted = (r: ReplyItem) => r.status === "reviewed" || (r.status === "ok" && r.counted !== false);
const inHandbook = (g: Questions["groups"][number]) => !!g.handbook_path && g.unknown === 0;
const fixHref = (driver: string, entry: string | undefined, teams: string[]) =>
  `/fixes/new?driver=${driver}${entry ? `&entry=${entry}` : ""}${teams.map((t) => `&team=${encodeURIComponent(t)}`).join("")}`;
const ordinal = (n: number) => `${n}${["th", "st", "nd", "rd"][n % 100 > 10 && n % 100 < 14 ? 0 : n % 10 < 4 ? n % 10 : 0]}`;
const rate = (p: { n: number; m: number }) => (p.m ? p.n / p.m : 0);
const pct = (p: { n: number; m: number }) => `${Math.round(rate(p) * 100)}%`;
const average = (points: Point[]) => rate({ n: points.reduce((t, p) => t + p.n, 0), m: points.reduce((t, p) => t + p.m, 0) });
const intakePoints = (d: Detail | undefined): Point[] => (d?.by_intake ?? []).flatMap((s) => (s.enough ? [{ label: month(s.intake), n: s.n, m: s.m }] : []));

export function Spark({ points, label }: { points: Point[]; label: string }) {
  const top = Math.max(0.5, ...points.map(rate));
  const xy = points.map((p, i) => [4 + (i * 152) / Math.max(points.length - 1, 1), 44 - (rate(p) / top) * 38]);
  const line = xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = xy[xy.length - 1];
  const avg = 44 - (average(points) / top) * 38;
  return (
    <svg viewBox="0 0 160 48" role="img" aria-label={label} className="block h-auto w-full overflow-visible">
      <polygon className="sp-fade-in" points={`${xy[0][0]},48 ${line} ${last[0]},48`} style={{ fill: "var(--problems-soft)", ...delay(400) }} />
      <line x1="0" x2="160" y1={avg} y2={avg} style={{ stroke: "var(--line-strong)", strokeWidth: 1, strokeDasharray: "3 3" }} />
      <polyline className="sp-spark" pathLength={1} points={line} style={{ fill: "none", stroke: "var(--problems)", strokeWidth: 2.25, strokeLinejoin: "round", strokeLinecap: "round" }} />
      <circle cx={last[0]} cy={last[1]} r="3.5" className="sp-fade-in" style={{ fill: "var(--problems)", ...delay(900) }} />
    </svg>
  );
}

function Tile({ c, active, start, fix, waiting, onPick }: { c: Card; active: boolean; start: boolean; fix: boolean; waiting: number; onPick: () => void }) {
  const overview = useApi<Overview>("/api/hr/themes/overview").data;
  const where = overview?.teams[c.driver];
  const points = intakePoints(overview?.details[c.driver]);
  const name = driverName(c.driver);
  const stands = where?.enough ? where.rows.length : 0;
  const status = fix
    ? { icon: <ArrowRight size={13} />, text: "Fix in progress", color: "var(--fixes)" }
    : !where?.enough
      ? null
      : where.verdict === "none"
        ? { icon: <Building2 size={13} />, text: "Company-wide", color: "var(--ink-muted)" }
        : { icon: <Users size={13} />, text: where.verdict === "most" ? "Most teams" : `${stands} ${stands === 1 ? "team" : "teams"} above rate`, color: "var(--problems)" };
  return (
    <Link href={`/problems/${c.driver}`} scroll={false} onClick={onPick} className="sp-area" aria-current={active ? "true" : undefined}>
      <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <span className="text-[14px] font-bold leading-5">{name}</span>
        {start ? (
          <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: "var(--problems)", color: "var(--on-problems)" }}>
            Start here
          </span>
        ) : null}
      </span>
      {c.enough ? (
        <span className="flex items-baseline justify-between gap-2">
          <span className="sp-num text-[28px] font-bold leading-8">
            {c.n}
            <span className="text-[14px] font-semibold sp-muted"> of {c.m}</span>
          </span>
          <span className="sp-num text-[13px] font-semibold sp-muted">{pct({ n: c.n ?? 0, m: c.m ?? 0 })}</span>
        </span>
      ) : (
        <CountBar notEnough />
      )}
      {points.length > 1 ? (
        <div className="flex flex-col gap-0.5">
          <Spark points={points} label={`${name} in each start month: ${points.map((p) => `${p.label} ${p.n} of ${p.m}`).join(", ")}. Dashed line: average ${Math.round(average(points) * 100)}%`} />
          <span className="flex justify-between sp-caption">
            <span>{points[0].label}</span>
            <span>{points[points.length - 1].label}</span>
          </span>
        </div>
      ) : (
        <div className={overview ? "h-[66px]" : "sp-skel h-[66px]"} />
      )}
      <span className="mt-auto flex min-h-5 items-center gap-1.5 text-xs font-semibold" style={{ color: status?.color }}>
        {status?.icon}
        {status?.text}
        {waiting ? (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5" style={{ background: "var(--ai-soft)", color: "var(--ai)" }} title={`${waiting} new ${waiting === 1 ? "reply waits" : "replies wait"} for you`}>
            <MessageSquare size={12} aria-hidden="true" />
            {waiting}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

export function Waffle({ c }: { c: Card }) {
  const m = c.m ?? 0;
  const parts = [
    { n: c.reviewed ?? 0, color: "var(--problems)", label: "you checked" },
    { n: c.ai_confident ?? 0, color: "var(--ai)", label: "AI labelled" },
    { n: c.score_only ?? 0, color: "var(--line-strong)", label: "1–5 score only" },
  ];
  const fills = parts.flatMap((p) => Array<string>(p.n).fill(p.color));
  const cols = Math.min(12, Math.ceil(Math.sqrt(m * 1.4)));
  return (
    <figure className="m-0 flex flex-col gap-3">
      <div
        role="img"
        aria-label={`${c.n} of ${m} who answered: ${parts.map((p) => `${p.n} ${p.label}`).join(", ")}`}
        className="grid gap-[5px] self-start"
        style={{ gridTemplateColumns: `repeat(${cols}, 14px)` }}
      >
        {Array.from({ length: m }, (_, i) => (
          <span key={i} className="sp-dot h-[14px] w-[14px] rounded-full" style={{ background: fills[i] ?? "var(--track-empty)", ...delay(i * 6) }} />
        ))}
      </div>
      <figcaption className="flex flex-wrap gap-x-3 gap-y-1 sp-caption">
        {parts
          .filter((p) => p.n)
          .map((p) => (
            <span key={p.label} className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
              {p.n} {p.label}
            </span>
          ))}
      </figcaption>
    </figure>
  );
}

function Columns({ points }: { points: Point[] }) {
  const top = Math.max(...points.map(rate), 0.01);
  const avg = average(points);
  return (
    <div role="img" aria-label={`${points.map((p) => `${p.label}: ${p.n} of ${p.m}`).join(", ")}. Average ${Math.round(avg * 100)}%`} className="flex flex-col gap-1">
      <span aria-hidden="true" className="flex items-center justify-end gap-1.5 text-[11px] font-semibold sp-muted">
        <span className="w-4 border-t border-dashed" style={{ borderColor: "var(--line-strong)" }} />
        Avg {Math.round(avg * 100)}%
      </span>
      <div className="relative flex h-[132px] items-end gap-2">
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 border-t border-dashed" style={{ bottom: `${20 + (avg / top) * 84}px`, borderColor: "var(--line-strong)" }} />
        {points.map((p, i) => (
          <div key={p.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1" title={`${p.label}: ${p.n} of ${p.m} hires named it`}>
            <span className="sp-num relative px-0.5 text-[11px] font-semibold sp-muted" style={{ background: "var(--surface-raised)" }}>{pct(p)}</span>
            <span className="sp-grow-y w-full max-w-9 rounded-t" style={{ height: `${Math.max((rate(p) / top) * 84, 3)}px`, background: i === points.length - 1 ? "var(--problems)" : "var(--problems-soft)", ...delay(i * 70) }} />
            <span className="sp-caption">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HBar({ label, n, of, sub, onClick }: { label: string; n: number; of: number; sub?: string; onClick?: () => void }) {
  const body = (
    <>
      <span className="flex items-baseline justify-between gap-3 text-[13px]">
        <span className="min-w-0 font-semibold">{label}</span>
        <span className="sp-num flex-none sp-muted">
          {n} of {of}
        </span>
      </span>
      <span className="block h-2 overflow-hidden rounded-full" style={{ background: "var(--track-empty)" }}>
        <span className="sp-bar-fill sp-lane-problems block rounded-full" style={{ width: `${(n / of) * 100}%` }} />
      </span>
      {sub ? <span className="sp-caption">{sub}</span> : null}
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} className="flex w-full cursor-pointer flex-col gap-1.5 rounded-lg border-0 bg-transparent p-0 text-left font-[inherit] text-[color:var(--ink)] hover:opacity-80">
      {body}
    </button>
  ) : (
    <div className="flex flex-col gap-1.5">{body}</div>
  );
}

function RateBar({ row, company }: { row: TeamRow; company: number }) {
  return (
    <div className="relative pt-5">
      <span className="absolute top-0 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold sp-muted" style={{ left: `${company * 100}%` }}>
        Company {Math.round(company * 100)}%
      </span>
      <div className="relative h-3 rounded-full" style={{ background: "var(--track-empty)" }} role="img" aria-label={`${row.n} of ${row.m} in this team, company ${Math.round(company * 100)}%`}>
        <div className="sp-bar-fill sp-lane-problems h-full rounded-full" style={{ width: `${rate(row) * 100}%` }} />
        <span aria-hidden="true" className="absolute -bottom-1 -top-1 w-0.5 rounded" style={{ left: `${company * 100}%`, background: "var(--ink)" }} />
      </div>
    </div>
  );
}

function ReplySheet({ driver, replies, groups, filter, setFilter, onClose }: { driver: string; replies: ReplyItem[]; groups: { title: string; reply_ids: string[] }[]; filter: string | null; setFilter: (f: string | null) => void; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const group = groups.find((g) => g.title === filter);
  const shown = group ? replies.filter((r) => group.reply_ids.includes(r.id)) : replies;
  const name = driver === "none" ? "No area" : driverName(driver);
  useEffect(() => {
    const back = document.activeElement as HTMLElement | null;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
      back?.focus();
    };
  }, [onClose]);
  const send = async (path: string, body?: object) => {
    setError(null);
    try {
      await apiSend(path, "POST", body);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save. Try again.");
    }
  };
  return createPortal(
    <div className="sp-sheet-backdrop" onClick={onClose}>
      <aside className="sp-sheet" role="dialog" aria-modal="true" aria-label={`${name} replies`} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex flex-col gap-3 border-b px-5 py-4 sm:px-6" style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button type="button" autoFocus className="sp-link inline-flex items-center gap-1.5 text-[14px]" onClick={onClose}>
              <ArrowLeft size={16} aria-hidden="true" />
              Back to {name}
            </button>
            <Link href={`/replies?view=all&area=${driver}`} className="sp-link inline-flex items-center gap-1 text-[13px]">
              Open in Replies
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <div className="flex flex-col">
            <h2 className="m-0 text-[22px] font-bold leading-[28px]">{name}</h2>
            <span className="sp-meta">{driver === "none" ? "The whole check-in" : "Latest replies counted here, with the whole check-in"}</span>
          </div>
          {groups.length ? (
            <div role="group" aria-label="Show replies" className="sp-tabs self-start">
              <button type="button" className="sp-tab" aria-pressed={!filter} onClick={() => setFilter(null)}>
                All · {replies.length}
              </button>
              {groups.map((g) => (
                <button key={g.title} type="button" className="sp-tab" aria-pressed={filter === g.title} onClick={() => setFilter(g.title)}>
                  {g.title}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div key={filter ?? "all"} className="sp-stagger flex flex-col gap-4 px-5 py-5 sm:px-6">
          {error ? (
            <div role="alert" className="text-sm" style={{ color: "var(--serious)" }}>
              {error}
            </div>
          ) : null}
          {shown.length === 0 ? <span className="sp-muted">No replies counted here yet.</span> : null}
          {shown.map((r) => (
            <ReplyRow
              key={r.id}
              chat
              item={r}
              onConfirm={() => send(`/api/hr/replies/${r.id}/review`, {})}
              onChange={(change) => send(`/api/hr/replies/${r.id}/review`, change)}
              onRetry={() => send(`/api/hr/replies/${r.id}/retry`)}
            />
          ))}
        </div>
      </aside>
    </div>,
    document.body,
  );
}

function Label({ children }: { children: ReactNode }) {
  return <h4 className="m-0 text-[12px] font-bold uppercase leading-4 tracking-[0.06em] sp-muted">{children}</h4>;
}

function Tile3({ title, wide, children }: { title: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={`flex min-w-0 flex-col gap-4 rounded-xl p-5 ${wide ? "md:col-span-2" : ""}`} style={{ background: "var(--surface-sunken)" }}>
      <Label>{title}</Label>
      {children}
    </div>
  );
}

type LeadBrief = { id: string; manager_id: string; lead: string; team: string; sent_at: string; side: string | null; side_at: string | null; items: { driver: string; brief: string; hires: { name: string; share: "meet" | "tell" }[] }[] };

function HireBubble({ r }: { r: ReplyItem }) {
  const who = r.byline.split(" · ")[0];
  return (
    <div className="flex min-w-0 items-end gap-2.5">
      <Avatar name={who} waiting />
      <div className="sp-bubble flex min-w-0 flex-col gap-1.5 rounded-2xl rounded-bl-md px-4 py-3" style={{ background: "var(--problems-soft)" }}>
        <TranslatedQuote language={r.language} text={r.text ?? ""} evidence={r.evidence_quote} />
        <span className="text-[13px] leading-[18px] sp-muted">{who}</span>
      </div>
    </div>
  );
}

function LeadBubble({ b }: { b: LeadBrief }) {
  return (
    <div className="flex min-w-0 flex-row-reverse items-end gap-2.5">
      <Avatar name={b.lead} waiting={!b.side} />
      <div
        className="flex min-w-0 flex-col gap-1.5 rounded-2xl rounded-br-md px-4 py-3"
        style={b.side ? { background: "var(--fixes-soft)" } : { border: "1px dashed var(--line-strong)" }}
      >
        <span className={`text-[15px] leading-[23px] ${b.side ? "" : "sp-muted"}`}>{b.side ?? "No answer yet"}</span>
        <span className="text-[13px] leading-[18px] sp-muted">
          {b.lead} · {shortDate(b.side ? b.side_at : b.sent_at)}
        </span>
      </div>
    </div>
  );
}

function Round({ b, replies, only, max, onMore }: { b: LeadBrief; replies: ReplyItem[]; only?: string[]; max?: number; onMore?: () => void }) {
  const quotes = replies.filter((r) => r.lead?.id === b.id && b.items.some((item) => r.drivers.includes(item.driver)) && r.text && (!only || only.includes(r.id)));
  const shown = max ? quotes.slice(0, max) : quotes;
  const named = b.items.flatMap((item) => item.hires);
  return (
    <div className="grid min-w-0 gap-4 md:grid-cols-2 md:gap-8">
      <div className="flex min-w-0 flex-col gap-3">
        {shown.length
          ? shown.map((r) => <HireBubble key={r.id} r={r} />)
          : b.items.map((item) => (
              <div key={item.driver} className="rounded-2xl rounded-bl-md px-4 py-3 text-[15px] leading-[23px]" style={{ background: "var(--problems-soft)" }}>
                {item.brief}
              </div>
            ))}
        {quotes.length > shown.length ? (
          <button type="button" className="sp-link self-start pl-[38px] text-[14px] font-semibold" onClick={onMore}>
            +{quotes.length - shown.length} more
          </button>
        ) : null}
        {named.length ? (
          <div className="flex flex-wrap gap-1.5 pl-[38px]">
            {named.map((h) => (
              <span key={h.name} className="rounded-full px-2.5 py-0.5 text-[12px] font-semibold" style={{ background: "var(--surface-sunken)", color: "var(--problems)" }}>
                {h.share === "meet" ? `${h.name} · 1-on-1` : `${h.name} · named`}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col justify-end">
        <LeadBubble b={b} />
      </div>
    </div>
  );
}

type Thread = { rounds: LeadBrief[]; ids: string[]; teams: string[] };

function ThreadCard({ thread, replies, only, row, href, picked, onPick, onMore }: { thread: Thread; replies: ReplyItem[]; only?: string[]; row?: TeamRow; href: string; picked: boolean; onPick: () => void; onMore: () => void }) {
  const [all, setAll] = useState(false);
  const [latest, ...earlier] = thread.rounds;
  return (
    <li
      className="flex min-w-0 flex-col overflow-hidden rounded-xl"
      style={{ background: "var(--surface-raised)", border: `1px solid ${picked ? "var(--problems)" : "var(--line)"}`, boxShadow: picked ? "0 0 0 1px var(--problems)" : "0 1px 2px rgba(28, 34, 38, 0.06)" }}
    >
      <label className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1.5 px-5 py-3.5" style={{ background: "var(--surface-sunken)", borderBottom: "1px solid var(--line)", borderLeft: row ? "4px solid var(--problems)" : "4px solid transparent" }}>
        <input type="checkbox" checked={picked} onChange={onPick} className="h-[18px] w-[18px] flex-none cursor-pointer" style={{ accentColor: "var(--problems)" }} />
        <span className="text-[17px] font-bold leading-6">{latest.team}</span>
        {row ? (
          <span className="sp-num rounded-full px-2.5 py-0.5 text-[13px] font-bold" style={{ background: "var(--problems)", color: "var(--on-problems)" }}>
            {row.n} of {row.m}
          </span>
        ) : null}
        {row?.times ? (
          <span className="text-[13px] font-bold" style={{ color: "var(--problems)" }}>
            {ordinal(row.times)} time in 6 months
          </span>
        ) : null}
        <span className="ml-auto inline-flex items-center gap-1.5 text-[13px] font-semibold sp-muted" aria-label={`${thread.ids.length} replies`}>
          <MessageSquare size={14} aria-hidden="true" />
          {thread.ids.length}
        </span>
      </label>
      <div className="flex flex-col gap-5 px-5 py-5">
        <Round b={latest} replies={replies} only={only} max={3} onMore={onMore} />
        {all
          ? earlier.map((b) => (
              <div key={b.id} className="flex flex-col gap-3 border-t pt-5" style={{ borderColor: "var(--line-soft)" }}>
                <Label>{shortDate(b.sent_at)}</Label>
                <Round b={b} replies={replies} only={only} />
              </div>
            ))
          : null}
      </div>
      <div className="flex items-center gap-3 px-5 py-3" style={{ borderTop: "1px solid var(--line-soft)" }}>
        {earlier.length ? (
          <button type="button" className="sp-link text-[14px] font-semibold" aria-expanded={all} onClick={() => setAll(!all)}>
            {all ? "Hide earlier rounds" : `Earlier rounds (${earlier.length})`}
          </button>
        ) : null}
        <Button href={href} className="ml-auto flex-none">
          Draft fix
        </Button>
      </div>
    </li>
  );
}

function Problem({ driver, card, actions, waiting }: { driver: string; card: Card; actions: Action[]; waiting: number }) {
  const [filter, setFilter] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [meaning, setMeaning] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const overview = useApi<Overview>("/api/hr/themes/overview").data;
  const groups = useApi<Groups>(`/api/hr/themes/${driver}/groups`);
  const library = useApi<Entry[]>(`/api/hr/actions/library?driver=${driver}`);
  const replies = useApi<ReplyItem[]>("/api/hr/replies", 30000);
  const briefs = useApi<LeadBrief[]>(`/api/hr/lead-briefs?driver=${driver}`, 10000).data;
  const where = overview?.teams[driver];
  const fixes = actions.filter((a) => a.driver === driver && live(a));
  const name = driverName(driver);

  const d = overview?.details[driver];
  const g = groups.data;
  const grouped = g && g.status === "ok" && "groups" in g ? g.groups : [];
  const mine = (replies.data ?? [])
    .filter((r) => !r.escalate && r.drivers?.includes(driver) && counted(r))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const linked = (replies.data ?? []).filter((r) => r.drivers.includes(driver));
  const rowOf = (teams: string[]) => (where?.enough ? where.rows.find((r) => r.teams.some((team) => teams.includes(team))) : undefined);
  const threads = Object.values((briefs ?? []).reduce<Record<string, LeadBrief[]>>((by, b) => ({ ...by, [b.manager_id]: [...(by[b.manager_id] ?? []), b] }), {}))
    .map((rounds): Thread => ({ rounds, teams: rounds[0].team.split(", "), ids: linked.filter((r) => rounds.some((b) => b.id === r.lead?.id)).map((r) => r.id) }))
    .sort((a, b) => rate(rowOf(b.teams) ?? { n: 0, m: 0 }) - rate(rowOf(a.teams) ?? { n: 0, m: 0 }) || b.ids.length - a.ids.length);
  const only = grouped.find((group) => group.title === meaning)?.reply_ids;
  const shownThreads = only ? threads.filter((t) => t.ids.some((id) => only.includes(id))) : threads;
  const answered = shownThreads.filter((t) => t.rounds[0].side).length;
  const chosen = threads.filter((t) => picked.includes(t.rounds[0].manager_id));
  const pick = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const intakes = intakePoints(d);
  const days = (d?.by_day ?? []).flatMap((s) => (s.enough ? [{ label: dayLabel(s.touchpoint), n: s.n, m: s.m }] : []));
  const company = where?.enough ? rate(where.company) : 0;
  const read = (title: string | null) => {
    setFilter(title);
    setOpen(true);
  };
  const close = useCallback(() => setOpen(false), []);

  return (
    <section id="cur" aria-labelledby="cur-title" className="sp-card min-w-0 scroll-mt-4">
      <div key={driver} className="sp-enter flex min-w-0 flex-col gap-8 px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="cur-title" className="m-0 text-[28px] font-bold leading-[34px] tracking-[-0.01em]">
              {name}
            </h2>
            <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: fixes.length ? "var(--fixes-soft)" : "var(--problems-soft)", color: fixes.length ? "var(--fixes)" : "var(--problems)" }}>
              {fixes.length ? "Fix in progress" : "Needs a fix"}
            </span>
            {waiting > 0 ? (
              <Link href={`/replies?area=${driver}`} className="ml-auto inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-semibold no-underline hover:brightness-95" style={{ background: "var(--ai-soft)", color: "var(--ai)" }}>
                <MessageSquare size={14} aria-hidden="true" />
                {waiting} to check
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            ) : null}
          </div>
          {grouped[0] ? (
            <p className="m-0 text-[20px] font-semibold leading-[28px]" style={{ color: "var(--problems)" }}>
              {grouped[0].title}
            </p>
          ) : null}
        </div>

        {d ? (
          <div className="sp-stagger grid gap-4 md:grid-cols-2">
            <Tile3 title="New hires">
              {card.enough ? (
                <>
                  <span className="sp-num text-[32px] font-bold leading-[36px]">
                    {card.n}
                    <span className="text-[17px] font-semibold sp-muted"> of {card.m}</span>
                  </span>
                  <Waffle c={card} />
                </>
              ) : (
                <CountBar notEnough />
              )}
              <div className="flex flex-col gap-3 border-t pt-4" style={{ borderColor: "var(--line)" }}>
                {d.by_experience.map((s) =>
                  s.enough ? (
                    <HBar key={s.group} label={s.group} n={s.n} of={s.m} />
                  ) : (
                    <span key={s.group} className="flex flex-col gap-1.5 text-[13px]">
                      <span className="font-semibold">{s.group}</span>
                      <CountBar notEnough have={s.have} need={s.need} />
                    </span>
                  ),
                )}
              </div>
            </Tile3>
            <Tile3 title="Teams">
              <div className="flex flex-1 flex-col justify-center gap-5">
                {!where?.enough ? (
                  <CountBar notEnough />
                ) : where.verdict === "none" ? (
                  <span className="flex items-center gap-2 text-[15px] font-semibold">
                    <Building2 size={18} aria-hidden="true" />
                    Spread evenly
                  </span>
                ) : (
                  <>
                    {where.verdict === "most" ? <span className="text-[15px] font-semibold">Most teams</span> : null}
                    {where.rows.toSorted((a, b) => rate(b) - rate(a)).map((r) => (
                      <div key={r.name} className="flex flex-col gap-1">
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="min-w-0 text-[15px] font-semibold">{r.name}</span>
                          <span className="sp-num flex-none text-[22px] font-bold leading-7">
                            {pct(r)}
                            <span className="text-[13px] font-semibold sp-muted"> · {r.n} of {r.m}</span>
                          </span>
                        </span>
                        <RateBar row={r} company={company} />
                      </div>
                    ))}
                  </>
                )}
              </div>
            </Tile3>
            <Tile3 title="Trend" wide>
              <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                {intakes.length ? (
                  <div className="flex min-w-0 flex-col gap-3 rounded-lg p-4" style={{ background: "var(--surface-raised)" }}>
                    <Label>Start month</Label>
                    <Columns points={intakes} />
                  </div>
                ) : null}
                {days.length > 1 ? (
                  <div className="flex min-w-0 flex-col gap-3 rounded-lg p-4" style={{ background: "var(--surface-raised)" }}>
                    <Label>Check-in day</Label>
                    <Columns points={days} />
                  </div>
                ) : null}
              </div>
            </Tile3>
          </div>
        ) : (
          <div className="sp-skel h-40" />
        )}

        {grouped.length ? (
          <div className="flex flex-col gap-3">
            <Label>What they mean</Label>
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="What they mean">
              {grouped.map((group) => (
                <button
                  key={group.title}
                  type="button"
                  className="sp-chip cursor-pointer gap-2.5 py-1 pl-4 pr-1.5"
                  aria-pressed={meaning === group.title}
                  style={meaning === group.title ? { borderColor: "var(--problems)", background: "var(--problems-soft)", boxShadow: "0 0 0 1px var(--problems)" } : undefined}
                  onClick={() => setMeaning(meaning === group.title ? null : group.title)}
                >
                  {group.title}
                  <span className="sp-num grid h-6 min-w-6 place-items-center rounded-full px-2 text-[12px] font-bold" style={{ background: "var(--problems)", color: "var(--on-problems)" }}>
                    {group.n}
                  </span>
                </button>
              ))}
              {g && g.status === "ok" && "groups" in g && g.not_grouped > 0 ? <span className="text-[13px] sp-muted">+{g.not_grouped}</span> : null}
            </div>
          </div>
        ) : null}

        {threads.length ? (
          <section className="flex min-w-0 flex-col gap-4" aria-label="Both sides">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h3 className="m-0 text-[20px] font-bold leading-7">Both sides</h3>
              <span className="flex items-center gap-1" aria-hidden="true">
                {shownThreads.map((t) => (
                  <span key={t.rounds[0].id} className="h-2.5 w-2.5 rounded-full" style={t.rounds[0].side ? { background: "var(--fixes)" } : { border: "1.5px dashed var(--line-strong)" }} />
                ))}
              </span>
              <span className="text-[13px] font-semibold sp-muted">
                {answered} of {shownThreads.length} answered
              </span>
            </div>
            {shownThreads.length === 0 ? <span className="sp-muted">No team lead asked yet.</span> : null}
            <ol key={meaning ?? "all"} className="sp-stagger m-0 flex list-none flex-col gap-6 p-0">
              {shownThreads.map((t) => (
                <ThreadCard
                  key={t.rounds[0].manager_id}
                  thread={t}
                  replies={replies.data ?? []}
                  only={only}
                  row={rowOf(t.teams)}
                  href={fixHref(driver, library.data?.[0]?.id, t.teams)}
                  picked={picked.includes(t.rounds[0].manager_id)}
                  onPick={() => pick(t.rounds[0].manager_id)}
                  onMore={() => read(t.rounds[0].team)}
                />
              ))}
            </ol>
            {chosen.length ? (
              <div
                className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-xl px-5 py-3"
                style={{ background: "var(--ink)", color: "var(--surface-raised)", boxShadow: "0 10px 24px -12px rgba(28, 34, 38, 0.5)" }}
              >
                <span className="text-[15px] font-bold">
                  {chosen.length} {chosen.length === 1 ? "team" : "teams"}
                </span>
                <span className="min-w-0 truncate text-[13px] opacity-75">{chosen.map((t) => t.rounds[0].team).join(", ")}</span>
                <button type="button" className="ml-auto cursor-pointer border-0 bg-transparent text-[13px] font-semibold underline" style={{ color: "inherit" }} onClick={() => setPicked([])}>
                  Clear
                </button>
                <Button href={fixHref(driver, library.data?.[0]?.id, chosen.flatMap((t) => t.teams))} variant="primary" lane="problems">
                  Draft fix
                </Button>
              </div>
            ) : null}
          </section>
        ) : null}

        <button type="button" className="sp-link inline-flex items-center gap-1.5 self-start text-[14px] font-semibold" aria-haspopup="dialog" disabled={!replies.data} onClick={() => read(null)}>
          <MessageSquare size={15} aria-hidden="true" />
          Review the {mine.length} replies in full
        </button>
        {open ? (
          <ReplySheet
            driver={driver}
            replies={mine}
            groups={[...grouped, ...threads.map((t) => ({ title: t.rounds[0].team, reply_ids: t.ids }))]}
            filter={filter}
            setFilter={setFilter}
            onClose={close}
          />
        ) : null}
      </div>
    </section>
  );
}

function QuestionPanel({ g }: { g: Questions["groups"][number] }) {
  const known = inHandbook(g);
  return (
    <section id="cur" aria-labelledby="cur-title" className="sp-card flex min-w-0 scroll-mt-4 flex-col gap-5 px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-1">
        <span className="sp-caption font-semibold">Asked the bot · last 30 days</span>
        <h2 id="cur-title" className="m-0 text-[26px] font-bold leading-[32px]">
          {g.text}
        </h2>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-3 rounded-lg px-4 py-3" style={{ background: "var(--surface-sunken)" }}>
          <Users size={22} aria-hidden="true" style={{ color: "var(--problems)" }} />
          <span className="flex flex-col">
            <span className="sp-num text-[24px] font-bold leading-7">{g.askers}</span>
            <span className="sp-caption">new hires asked</span>
          </span>
        </div>
        <div className="flex items-center gap-3 rounded-lg px-4 py-3" style={{ background: known ? "var(--fixes-soft)" : "var(--waiting-soft)" }}>
          {known ? <BookCheck size={22} aria-hidden="true" style={{ color: "var(--fixes)" }} /> : <BookX size={22} aria-hidden="true" style={{ color: "var(--waiting)" }} />}
          <span className="flex flex-col">
            <span className="font-bold">{known ? "In the handbook" : "Not in the handbook"}</span>
            <span className="sp-caption">{known ? g.handbook_path : "The bot said \"I don't know yet\""}</span>
          </span>
        </div>
      </div>
      <span className="sp-muted">{known ? "Many still asked. Say it earlier in onboarding." : "Add it to onboarding so the next group of new hires knows."}</span>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button variant="primary" lane="problems" className="min-h-12 px-6 text-[15px]" href={`/fixes/new?driver=ONBOARDING&own=${encodeURIComponent(g.text)}`}>
          Draft an onboarding fix
          <ArrowRight size={17} aria-hidden="true" />
        </Button>
        <span className="sp-caption">You see the question only, never who asked.</span>
      </div>
    </section>
  );
}

function AllQuestionsPanel({ all }: { all: Questions["all"] }) {
  return (
    <section id="cur" aria-labelledby="cur-title" className="sp-card flex min-w-0 scroll-mt-4 flex-col gap-4 px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-1">
        <span className="sp-caption font-semibold">Asked the bot · last 30 days</span>
        <h2 id="cur-title" className="m-0 text-[26px] font-bold leading-[32px]">
          All questions
        </h2>
        <span className="sp-muted">Every question, in neutral words. You never see who asked or their own words.</span>
      </div>
      {all.length === 0 ? <span className="sp-muted">No questions yet.</span> : null}
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {all.map((q) => (
          <li key={q.id} className="flex items-center gap-3 rounded-lg px-4 py-3" style={{ background: "var(--surface-sunken)" }}>
            <MessageCircleQuestion size={16} aria-hidden="true" style={{ color: "var(--problems)" }} />
            <span className="flex-1">{q.text}</span>
            <span className="sp-caption sp-num">{q.askers} asked</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TeamGrid({ drivers }: { drivers: string[] }) {
  const lists: Record<string, Teams | undefined> = useApi<Overview>("/api/hr/themes/overview").data?.teams ?? {};
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
            A filled box means that team raised the problem at least 2 more times than the company rate predicts, from each new hire&apos;s latest check-in. Tap it to draft a fix for that team lead. Teams under 5 answers are pooled or hidden.
          </p>
        </div>
      )}
    </LaneSection>
  );
}

export function Problems({ driver }: { driver?: string }) {
  const themes = useApi<Themes>("/api/hr/themes");
  const actions = useApi<Action[]>("/api/hr/actions");
  const queue = useApi<ReplyItem[]>("/api/hr/queue");
  const questions = useApi<Questions>("/api/hr/questions");
  useApi<Overview>("/api/hr/themes/overview");
  if (!themes.data || !actions.data) return <Loading />;

  const cards = [...themes.data.cards].sort((a, b) => Number(a.driver === "WORKLOAD") - Number(b.driver === "WORKLOAD") || (b.n ?? -1) - (a.n ?? -1));
  const waitingOf = (d: string) => (queue.data ?? []).filter((r) => !r.escalate && r.status !== "reviewed" && r.drivers?.includes(d)).length;
  const groups = questions.data?.groups.toReversed() ?? [];
  const question = driver?.startsWith("q-") ? groups.find((g) => `q-${g.id}` === driver) : undefined;
  const current = question || driver === "questions" ? undefined : (cards.find((c) => c.driver === driver) ?? cards[0]);
  const answered = cards.find((c) => c.enough)?.m;
  const fixed = (d: string) => actions.data!.some((a) => a.driver === d && live(a));
  const start = cards.find((c) => c.enough && !fixed(c.driver))?.driver;
  const pick = () => {
    if (window.innerWidth < 1024) setTimeout(() => document.getElementById("cur")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="sp-page-title">Shared problems</h1>
        <span className="sp-muted">Latest check-in of each new hire{answered ? ` · ${answered} new hires answered` : ""}</span>
      </header>

      <nav aria-label="Problem areas" className="flex flex-col gap-3">
        <div className="sp-stagger grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {cards.map((c) => (
            <Tile key={c.driver} c={c} active={c.driver === current?.driver} start={c.driver === start} fix={fixed(c.driver)} waiting={waitingOf(c.driver)} onPick={pick} />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="sp-caption font-semibold">Asked the bot</span>
          {groups.map((g) => (
            <Link key={g.id} href={`/problems/q-${g.id}`} scroll={false} onClick={pick} className="sp-chip" aria-current={question?.id === g.id ? "true" : undefined}>
              <MessageCircleQuestion size={14} aria-hidden="true" />
              {g.text}
              <span className="sp-num font-bold">{g.askers}</span>
              {inHandbook(g) ? null : <BookX size={13} aria-label="Not in the handbook" style={{ color: "var(--waiting)" }} />}
            </Link>
          ))}
          {questions.data && !questions.data.other.text.startsWith("0 ") ? <span className="sp-caption">{questions.data.other.text}</span> : null}
          <Link href="/problems/questions" scroll={false} onClick={pick} className="sp-chip" aria-current={driver === "questions" ? "true" : undefined}>
            <MessageCircleQuestion size={14} aria-hidden="true" />
            All questions
            <span className="sp-num font-bold">{questions.data?.all.length ?? 0}</span>
          </Link>
        </div>
      </nav>

      {question ? (
        <QuestionPanel g={question} />
      ) : driver === "questions" ? (
        <AllQuestionsPanel all={questions.data?.all ?? []} />
      ) : current ? (
        <Problem driver={current.driver} card={current} actions={actions.data} waiting={waitingOf(current.driver)} />
      ) : null}

      <TeamGrid drivers={cards.some((c) => c.enough) ? cards.filter((c) => c.enough).map((c) => c.driver) : Object.keys(DRIVERS)} />
    </>
  );
}
