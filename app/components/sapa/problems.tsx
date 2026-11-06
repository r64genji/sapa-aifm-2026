"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, BookCheck, BookX, Building2, Check, ChevronDown, MessageCircleQuestion, MessageSquare, Users } from "lucide-react";
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
            <span className="sp-num relative px-0.5 text-[11px] font-semibold sp-muted" style={{ background: "var(--surface-sunken)" }}>{pct(p)}</span>
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
      <span className="flex items-baseline justify-between gap-3 text-[14px]">
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
    <button type="button" onClick={onClick} className="-mx-3 flex cursor-pointer flex-col gap-1.5 rounded-lg border-0 bg-transparent px-3 py-2 text-left font-[inherit] text-[color:var(--ink)] hover:bg-[color:var(--surface-raised)]">
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

function Tile3({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-4 rounded-xl p-5" style={{ background: "var(--surface-sunken)" }}>
      <Label>{title}</Label>
      {children}
    </div>
  );
}

function Fact({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2.5 rounded-xl px-4 py-3.5" style={{ background: "var(--surface-raised)" }}>
      <Label>{title}</Label>
      {children}
    </div>
  );
}

function MiniBar({ label, p, strong }: { label: string; p: { n: number; m: number }; strong?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-baseline justify-between gap-2 text-[13px]">
        <span className="font-semibold">{label}</span>
        <span className="sp-num font-bold" style={{ color: strong ? "var(--problems)" : undefined }}>
          {pct(p)}
        </span>
      </span>
      <span className="block h-1.5 overflow-hidden rounded-full" style={{ background: "var(--track-empty)" }}>
        <span className="block h-full rounded-full" style={{ width: `${rate(p) * 100}%`, background: strong ? "var(--problems)" : "var(--line-strong)" }} />
      </span>
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
      <div className="flex min-w-0 flex-col gap-1.5 rounded-2xl rounded-br-md px-4 py-3" style={b.side ? { background: "var(--fixes-soft)" } : { border: "1px dashed var(--line-strong)" }}>
        <span className={`text-[15px] leading-[23px] ${b.side ? "" : "sp-muted"}`}>{b.side ?? "No answer yet"}</span>
        <span className="text-[13px] leading-[18px] sp-muted">
          {b.lead} · {shortDate(b.side ? b.side_at : b.sent_at)}
        </span>
      </div>
    </div>
  );
}

function Round({ b, replies, max, onMore }: { b: LeadBrief; replies: ReplyItem[]; max?: number; onMore?: () => void }) {
  const quotes = replies.filter((r) => r.lead?.id === b.id && b.items.some((item) => r.drivers.includes(item.driver)) && r.text);
  const shown = max ? quotes.slice(0, max) : quotes;
  const named = b.items.flatMap((item) => item.hires);
  return (
    <div className="grid min-w-0 gap-4 md:grid-cols-2 md:gap-8">
      <div className="flex min-w-0 flex-col gap-3 md:pb-8">
        {shown.length
          ? shown.map((r) => <HireBubble key={r.id} r={r} />)
          : b.items.map((item) => (
              <div key={item.driver} className="rounded-2xl rounded-bl-md px-4 py-3 text-[15px] leading-[23px]" style={{ background: "var(--problems-soft)" }}>
                {item.brief}
              </div>
            ))}
        {quotes.length > shown.length || named.length ? (
          <div className="flex flex-wrap items-center gap-1.5 pl-[38px]">
            {quotes.length > shown.length ? (
              <button type="button" className="sp-link mr-1.5 text-[14px] font-semibold" onClick={onMore}>
                +{quotes.length - shown.length} more
              </button>
            ) : null}
            {named.map((h) => (
              <span key={h.name} className="rounded-full px-2.5 py-0.5 text-[12px] font-semibold" style={{ background: "var(--surface-sunken)", color: "var(--problems)" }}>
                {h.share === "meet" ? `${h.name} · 1-on-1` : `${h.name} · named`}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col justify-end md:pt-8">
        <LeadBubble b={b} />
      </div>
    </div>
  );
}

type Thread = { rounds: LeadBrief[]; ids: string[]; teams: string[] };

function ThreadCard({ thread, replies, row, href, picked, onPick, onMore }: { thread: Thread; replies: ReplyItem[]; row?: TeamRow; href: string; picked: boolean; onPick: () => void; onMore: () => void }) {
  const [all, setAll] = useState(false);
  const [latest, ...earlier] = thread.rounds;
  return (
    <li
      className="flex min-w-0 flex-col overflow-hidden rounded-2xl"
      style={{ background: "var(--surface-raised)", border: `1px solid ${picked ? "var(--problems)" : "var(--line)"}`, boxShadow: picked ? "0 0 0 1px var(--problems)" : "0 1px 3px rgba(28, 34, 38, 0.06)" }}
    >
      <label className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-2 px-5 py-4" style={{ background: row ? "var(--problems-soft)" : "var(--surface-sunken)" }}>
        <input type="checkbox" checked={picked} onChange={onPick} className="h-5 w-5 flex-none cursor-pointer" style={{ accentColor: "var(--problems)" }} />
        <span className="text-[17px] font-bold leading-6">{latest.team}</span>
        {row ? (
          <span className="sp-num rounded-full px-2.5 py-0.5 text-[13px] font-bold" style={{ background: "var(--problems)", color: "var(--on-problems)" }}>
            {pct(row)} · {row.n} of {row.m}
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
        <span
          className="inline-flex min-h-6 items-center px-2.5 text-[12px] font-bold"
          style={{ borderRadius: "var(--radius-round)", background: latest.side ? "var(--fixes-soft)" : "var(--waiting-soft)", color: latest.side ? "var(--fixes)" : "var(--waiting-ink)" }}
        >
          {latest.side ? "Answered" : "Waiting"}
        </span>
      </label>
      <div className="flex flex-col gap-5 px-5 py-5">
        <Round b={latest} replies={replies} max={2} onMore={onMore} />
        {all
          ? earlier.map((b) => (
              <div key={b.id} className="flex flex-col gap-3 border-t pt-5" style={{ borderColor: "var(--line-soft)" }}>
                <Label>{shortDate(b.sent_at)}</Label>
                <Round b={b} replies={replies} />
              </div>
            ))
          : null}
      </div>
      <div className="flex flex-wrap items-center gap-3 px-5 py-4" style={{ borderTop: "1px solid var(--line-soft)" }}>
        {earlier.length ? (
          <button type="button" className="sp-link text-[14px] font-semibold" aria-expanded={all} onClick={() => setAll(!all)}>
            {all ? "Hide earlier rounds" : `Earlier rounds (${earlier.length})`}
          </button>
        ) : null}
        <Button href={href} variant="primary" lane="problems" className="ml-auto min-h-11 flex-none px-5 text-[15px]">
          Draft fix for {latest.lead}
          <ArrowRight size={17} aria-hidden="true" />
        </Button>
      </div>
    </li>
  );
}

function TeamCount({ team, driver, strong }: { team: string; driver: string; strong: boolean }) {
  const c = useApi<Themes>(`/api/hr/themes?team=${encodeURIComponent(team)}`).data?.cards.find((x) => x.driver === driver);
  if (!c) return <span className="sp-skel h-5 w-12 rounded-full" />;
  return (
    <span
      className="sp-num flex-none rounded-full px-2 py-0.5 text-[12px] font-bold"
      style={strong ? { background: "var(--problems)", color: "var(--on-problems)" } : { background: "var(--surface-sunken)", color: "var(--ink-muted)" }}
      title={c.enough ? undefined : c.message}
    >
      {c.enough ? `${c.n} of ${c.m}` : "Under 5"}
    </span>
  );
}

function TeamPicker({ driver, threads, isPicked, flip, rowOf }: { driver: string; threads: Thread[]; isPicked: (t: Thread) => boolean; flip: (id: string) => void; rowOf: (teams: string[]) => TeamRow | undefined }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  const chosen = threads.filter(isPicked);
  return (
    <div ref={root} className="flex flex-col gap-2">
      <div className="relative">
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="true"
          onClick={() => setOpen(!open)}
          className="flex min-h-12 w-full cursor-pointer items-center gap-2.5 rounded-xl px-3.5 py-2 text-left font-[inherit] text-[color:var(--ink)]"
          style={{ background: "var(--surface-raised)", border: `1.5px solid ${open ? "var(--problems)" : "var(--line-strong)"}` }}
        >
          <Users size={17} aria-hidden="true" style={{ color: "var(--problems)" }} />
          <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">
            {chosen.length === 0 ? "Company-wide" : chosen.length === 1 ? chosen[0].rounds[0].team : `${chosen.length} teams`}
          </span>
          <ChevronDown size={18} aria-hidden="true" className="flex-none sp-muted" style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform 0.15s" }} />
        </button>
        {open ? (
          <div
            role="group"
            aria-label="Who gets it"
            className="absolute inset-x-0 top-[calc(100%+6px)] z-30 flex max-h-[360px] flex-col overflow-y-auto rounded-xl p-1.5"
            style={{ background: "var(--surface-raised)", border: "1px solid var(--line-strong)", boxShadow: "var(--shadow-pop)" }}
          >
            {threads.map((t) => {
              const on = isPicked(t);
              return (
                <label key={t.rounds[0].manager_id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-[color:var(--surface-sunken)]" style={on ? { background: "var(--problems-soft)" } : undefined}>
                  <input type="checkbox" className="sr-only" checked={on} onChange={() => flip(t.rounds[0].manager_id)} />
                  <span
                    aria-hidden="true"
                    className="grid h-5 w-5 flex-none place-items-center rounded-md"
                    style={on ? { background: "var(--problems)", color: "var(--on-problems)" } : { border: "1.5px solid var(--line-strong)" }}
                  >
                    {on ? <Check size={14} strokeWidth={3} /> : null}
                  </span>
                  <span className="min-w-0 flex-1 text-[14px] font-semibold leading-5">{t.rounds[0].team}</span>
                  {t.teams.map((team) => (
                    <TeamCount key={team} team={team} driver={driver} strong={!!rowOf([team])} />
                  ))}
                </label>
              );
            })}
          </div>
        ) : null}
      </div>
      {chosen.length > 1 ? (
        <div className="flex flex-wrap gap-1.5">
          {chosen.map((t) => (
            <button
              key={t.rounds[0].manager_id}
              type="button"
              onClick={() => flip(t.rounds[0].manager_id)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border-0 px-2.5 py-1 text-[12px] font-semibold"
              style={{ background: "var(--problems-soft)", color: "var(--problems)" }}
            >
              {t.rounds[0].team}
              <span aria-hidden="true">×</span>
              <span className="sr-only">Remove</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FixChoice({ driver, entries, chosen, onChoose }: { driver: string; entries: Entry[]; chosen: string; onChoose: (id: string) => void }) {
  return (
    <div role="radiogroup" aria-label="Which fix" className="flex flex-col gap-2">
      {[...entries, null].map((f) => {
        const id = f?.id ?? "own";
        const on = chosen === id;
        const good = (f?.difference ?? 0) > 0;
        const best = good && id === entries[0].id;
        return (
          <label
            key={id}
            className="flex cursor-pointer items-start gap-3 rounded-xl px-3.5 py-3"
            style={{ border: `${on ? 2 : 1}px solid ${on ? "var(--problems)" : "var(--line)"}`, background: on ? "var(--problems-soft)" : "var(--surface-raised)", margin: on ? 0 : 1 }}
          >
            <input type="radio" name={`fix-${driver}`} className="mt-0.5 h-5 w-5 flex-none" style={{ accentColor: "var(--problems)" }} checked={on} onChange={() => onChoose(id)} />
            <span className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="text-[14px] font-semibold leading-5">{f ? f.title : "Write my own"}</span>
              {f ? (
                <span className="self-start rounded-full px-2.5 py-0.5 text-[12px] font-bold" title={f.evidence} style={good ? { background: "var(--fixes-soft)", color: "var(--fixes)" } : { background: "var(--surface-sunken)", color: "var(--ink-muted)" }}>
                  {best ? `Best fit · score +${f.difference!.toFixed(1)}` : good ? `Also worked · score +${f.difference!.toFixed(1)}` : f.used ? `Used ${f.used}×` : "Not tried here"}
                </span>
              ) : null}
              {on && f ? <span className="text-[13px] leading-[19px] sp-muted">{f.text}</span> : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}

function Problem({ driver, card, actions, waiting }: { driver: string; card: Card; actions: Action[]; waiting: number }) {
  const [filter, setFilter] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [choice, setChoice] = useState<string | null>(null);
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
  const answered = threads.filter((t) => t.rounds[0].side).length;
  const isPicked = (t: Thread) => !!rowOf(t.teams) !== flipped.includes(t.rounds[0].manager_id);
  const chosen = threads.filter(isPicked);
  const flip = (id: string) => setFlipped((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const entries = (library.data ?? []).filter((f) => !fixes.some((a) => a.status !== "draft" && a.library_entry_id === f.id));
  const fixId = choice ?? entries[0]?.id ?? "own";
  const entry = entries.find((f) => f.id === fixId);
  const hrefFor = (teams: string[]) => fixHref(driver, entry?.id, teams);
  const target = chosen.length === 1 ? `Draft fix for ${chosen[0].rounds[0].lead}` : chosen.length ? `Draft fix for ${chosen.length} teams` : "Draft a company-wide fix";
  const intakes = intakePoints(d);
  const days = (d?.by_day ?? []).flatMap((s) => (s.enough ? [{ label: dayLabel(s.touchpoint), n: s.n, m: s.m }] : []));
  const company = where?.enough ? rate(where.company) : 0;
  const top = where?.enough ? where.rows.toSorted((a, b) => rate(b) - rate(a))[0] : undefined;
  const [first, other] = ["First job", "Experienced"].map((grp) => d?.by_experience.find((s) => s.group === grp));
  const read = (title: string | null) => {
    setFilter(title);
    setOpen(true);
  };
  const close = useCallback(() => setOpen(false), []);

  return (
    <section id="cur" aria-labelledby="cur-title" className="sp-card min-w-0 scroll-mt-4">
      <div key={driver} className="sp-enter grid items-start gap-6 p-4 sm:p-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
        <div className="flex min-w-0 flex-col gap-10">
          <div className="flex flex-col gap-6 rounded-2xl p-5 sm:p-7" style={{ background: "var(--problems-soft)" }}>
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="cur-title" className="m-0 text-[28px] font-bold leading-[34px] tracking-[-0.01em]">
                {name}
              </h2>
              <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: fixes.length ? "var(--fixes-soft)" : "var(--surface-raised)", color: fixes.length ? "var(--fixes)" : "var(--problems)" }}>
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

            <div className="grid items-center gap-x-10 gap-y-6 md:grid-cols-[minmax(0,1fr)_auto]">
              <div className="flex min-w-0 flex-col gap-3">
                {card.enough ? (
                  <span className="sp-num text-[56px] font-bold leading-[56px] tracking-[-0.02em]" style={{ color: "var(--problems)" }}>
                    {card.n}
                    <span className="text-[22px] font-semibold sp-muted"> of {card.m} new hires</span>
                  </span>
                ) : (
                  <CountBar notEnough />
                )}
                {grouped[0] ? <p className="m-0 text-[22px] font-semibold leading-[30px]">{grouped[0].title}</p> : null}
              </div>
              {card.enough ? <Waffle c={card} /> : null}
            </div>

            {d ? (
              <div className="sp-stagger grid gap-3 md:grid-cols-3">
                <Fact title="Where">
                  {!where?.enough ? (
                    <CountBar notEnough />
                  ) : !top ? (
                    <span className="flex items-center gap-2 text-[15px] font-semibold">
                      <Building2 size={18} aria-hidden="true" />
                      Spread evenly
                    </span>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="min-w-0 text-[15px] font-semibold">{top.name}</span>
                        <span className="sp-num text-[20px] font-bold" style={{ color: "var(--problems)" }}>
                          {pct(top)}
                        </span>
                      </span>
                      <RateBar row={top} company={company} />
                      {top.times ? (
                        <span className="text-[13px] font-bold" style={{ color: "var(--problems)" }}>
                          {ordinal(top.times)} time in 6 months
                        </span>
                      ) : null}
                    </div>
                  )}
                </Fact>
                <Fact title="Who">
                  {first?.enough && other?.enough ? (
                    <div className="flex flex-col gap-2.5">
                      <MiniBar label="First job" p={first} strong={rate(first) >= rate(other)} />
                      <MiniBar label="Experienced" p={other} strong={rate(other) > rate(first)} />
                    </div>
                  ) : (
                    <CountBar notEnough />
                  )}
                </Fact>
                <Fact title="Trend">
                  {intakes.length > 1 ? (
                    <div className="flex flex-col gap-1">
                      <Spark points={intakes} label={`${name} by start month: ${intakes.map((p) => `${p.label} ${pct(p)}`).join(", ")}`} />
                      <span className="flex justify-between text-[12px] sp-muted">
                        <span>{intakes[0].label}</span>
                        <span className="font-bold" style={{ color: "var(--problems)" }}>
                          {intakes[intakes.length - 1].label} {pct(intakes[intakes.length - 1])}
                        </span>
                      </span>
                    </div>
                  ) : (
                    <CountBar notEnough />
                  )}
                </Fact>
              </div>
            ) : (
              <div className="sp-skel h-28" />
            )}
          </div>

          {intakes.length || days.length > 1 ? (
            <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              {intakes.length ? (
                <Tile3 title="By start month">
                  <Columns points={intakes} />
                </Tile3>
              ) : null}
              {days.length > 1 ? (
                <Tile3 title="By check-in day">
                  <Columns points={days} />
                </Tile3>
              ) : null}
            </div>
          ) : null}

          {threads.length ? (
            <section className="flex min-w-0 flex-col gap-5" aria-label="Both sides">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h3 className="m-0 text-[22px] font-bold leading-7">Both sides</h3>
                <span className="flex items-center gap-1" aria-hidden="true">
                  {threads.map((t) => (
                    <span key={t.rounds[0].id} className="h-2.5 w-2.5 rounded-full" style={t.rounds[0].side ? { background: "var(--fixes)" } : { border: "1.5px dashed var(--line-strong)" }} />
                  ))}
                </span>
                <span className="text-[13px] font-semibold sp-muted">
                  {answered} of {threads.length} answered
                </span>
              </div>
              <ol className="sp-stagger m-0 flex list-none flex-col gap-5 p-0">
                {threads.map((t) => (
                  <ThreadCard
                    key={t.rounds[0].manager_id}
                    thread={t}
                    replies={replies.data ?? []}
                    row={rowOf(t.teams)}
                    href={hrefFor(t.teams)}
                    picked={isPicked(t)}
                    onPick={() => flip(t.rounds[0].manager_id)}
                    onMore={() => read(t.rounds[0].team)}
                  />
                ))}
              </ol>
            </section>
          ) : null}

          <section className="flex min-w-0 flex-col gap-4 rounded-xl p-5" style={{ background: "var(--surface-sunken)" }} aria-label="What they mean">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="m-0 text-[22px] font-bold leading-7">What they mean</h3>
              <Button className="ml-auto" disabled={!replies.data} aria-haspopup="dialog" onClick={() => read(null)}>
                <MessageSquare size={15} aria-hidden="true" />
                All {mine.length} replies
              </Button>
            </div>
            {grouped.length ? (
              <div className="grid gap-x-10 gap-y-1 md:grid-cols-2">
                {grouped.map((group) => (
                  <HBar key={group.title} label={group.title} n={group.n} of={card.n ?? group.n} onClick={() => read(group.title)} />
                ))}
                {g && g.status === "ok" && "groups" in g && g.not_grouped > 0 ? <span className="self-center text-[13px] sp-muted">+{g.not_grouped} not grouped</span> : null}
              </div>
            ) : null}
          </section>
        </div>

        <aside className="flex min-w-0 flex-col gap-5 rounded-2xl p-5 xl:sticky xl:top-[calc(var(--sp-demo-bar,0px)+16px)]" style={{ border: "2px solid var(--problems)" }} aria-label="Send a fix">
          <h3 className="m-0 text-[20px] font-bold leading-7">Send a fix</h3>
          {fixes.map((a) => (
            <Link key={a.id} href={`/fixes/${a.id}`} className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 no-underline" style={{ background: "var(--fixes-soft)", color: "var(--ink)" }}>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color: "var(--fixes)" }}>
                  In progress
                </span>
                <span className="text-[14px] font-semibold leading-5">{a.title}</span>
              </span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          ))}
          <div className="flex flex-col gap-2.5">
            <Label>Who gets it</Label>
            <TeamPicker driver={driver} threads={threads} isPicked={isPicked} flip={flip} rowOf={rowOf} />
          </div>
          <div className="flex flex-col gap-2.5">
            <Label>Which fix</Label>
            {library.data ? <FixChoice driver={driver} entries={entries} chosen={fixId} onChoose={setChoice} /> : <div className="sp-skel h-20" />}
          </div>
          <Button href={hrefFor(chosen.flatMap((t) => t.teams))} variant="primary" lane="problems" className="min-h-14 w-full justify-center px-6 text-[16px]">
            {target}
            <ArrowRight size={18} aria-hidden="true" />
          </Button>
        </aside>

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
