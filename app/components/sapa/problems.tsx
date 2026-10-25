"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, BookCheck, BookX, Building2, Info, MessageCircleQuestion, MessageSquare, Users } from "lucide-react";
import { ApiError, apiSend, useApi } from "./data";
import { ReplyRow, TranslatedQuote, type ReplyItem } from "./reply";
import { Button, CountBar, DRIVERS, FixTrack, LaneSection, Loading, Row, dayLabel, delay, driverName, month } from "./ui";

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

const STEP: Record<string, number> = { draft: 1, assigned: 2, accepted: 3 };
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

function Num({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span aria-hidden="true" className="sp-step">
        {n}
      </span>
      <h3 className="m-0 text-[15px] font-bold">{title}</h3>
    </div>
  );
}

function SendFix({ driver, where, entries, fixes }: { driver: string; where: Teams | undefined; entries: Entry[] | undefined; fixes: Action[] }) {
  const [off, setOff] = useState<string[]>([]);
  const [pick, setPick] = useState<string | null>(null);
  const shown = (entries ?? []).filter((f) => !fixes.some((a) => a.status !== "draft" && a.library_entry_id === f.id));
  const chosen = pick ?? shown[0]?.id ?? "own";
  const entry = shown.find((f) => f.id === chosen);
  const rows = where?.enough ? where.rows : [];
  const ticked = rows.filter((r) => !off.includes(r.name));
  const teams = ticked.flatMap((r) => r.teams);
  const lead = ticked.length === 1 && ticked[0].kind === "team" && ticked[0].leads.length === 1 ? ticked[0].leads[0].name : null;
  const label = !teams.length ? "Draft a company-wide fix" : lead ? `Draft fix for ${lead}` : `Draft fix for ${teams.length} teams`;
  const company = where?.enough ? rate(where.company) : 0;
  const listed = rows.filter((r) => r.kind === "team").length;

  return (
    <div className="flex flex-col gap-5 rounded-xl px-4 py-4 sm:px-5" style={{ border: "2px solid var(--problems)", background: "var(--surface-raised)" }}>
      {fixes.map((a) => (
        <Link key={a.id} href={`/fixes/${a.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg px-3 py-2.5 no-underline" style={{ background: "var(--fixes-soft)", color: "var(--ink)" }}>
          <span className="flex min-w-0 flex-[1_1_180px] flex-col">
            <span className="text-xs font-bold" style={{ color: "var(--fixes)" }}>
              Fix in progress
            </span>
            <span className="font-semibold">{a.title}</span>
          </span>
          <span className="w-[160px] flex-none text-[12px]">
            <FixTrack step={STEP[a.status] ?? 1} detail={a.owner ?? "HR"} />
          </span>
        </Link>
      ))}

      <div className="flex flex-col gap-5">
        <div className="flex min-w-0 flex-col gap-3">
          <Num n={1} title="Who gets it" />
          {!where ? (
            <div className="sp-skel h-16" />
          ) : !where.enough ? (
            <span className="sp-meta">Teams show once 5 people answer a check-in.</span>
          ) : rows.length === 0 ? (
            <div className="flex items-center gap-3 rounded-lg px-3 py-3" style={{ background: "var(--surface-sunken)" }}>
              <Building2 size={20} aria-hidden="true" style={{ color: "var(--problems)" }} />
              <span className="flex flex-col">
                <span className="font-semibold">Everyone</span>
                <span className="sp-caption">No team is above the company rate ({Math.round(company * 100)}%).</span>
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {rows.map((r) => (
                <label key={r.name} className="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-3" style={{ background: off.includes(r.name) ? "transparent" : "var(--problems-soft)" }}>
                  <input type="checkbox" className="mt-1 h-4 w-4 flex-none accent-[color:var(--problems)]" checked={!off.includes(r.name)} onChange={() => setOff((o) => (o.includes(r.name) ? o.filter((x) => x !== r.name) : [...o, r.name]))} />
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span className="font-semibold">{r.kind === "tower" ? `${r.name} tower` : r.name}</span>
                      <span className="sp-num text-[13px] font-bold">
                        {r.n} of {r.m}
                        <span style={{ color: "var(--problems)" }}> · +{Math.round((rate(r) - company) * 100)} more in every 100 than the company overall</span>
                      </span>
                    </span>
                    <span className="sp-caption">
                      {r.leads.map((l) => l.name).join(", ") || "No team lead"}
                      {r.avg !== null ? ` · avg ${r.avg} (company ${where.company.avg ?? "–"})` : ""}
                    </span>
                    <RateBar row={r} company={company} />
                  </span>
                </label>
              ))}
              {where.verdict === "most" ? <span className="sp-caption">In most teams. Untick all for one company-wide fix.</span> : null}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <Num n={2} title="Which fix" />
          {!entries ? (
            <div className="sp-skel h-16" />
          ) : (
            <div role="radiogroup" aria-label="Which fix" className="flex flex-col gap-2">
              {[...shown, null].map((f) => {
                const id = f?.id ?? "own";
                const on = chosen === id;
                const good = (f?.difference ?? 0) > 0;
                const best = good && id === shown[0].id;
                return (
                  <label key={id} className="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5" style={{ border: `1px solid ${on ? "var(--problems)" : "var(--line)"}`, background: on ? "var(--problems-soft)" : "transparent" }}>
                    <input type="radio" name={`fix-${driver}`} className="mt-1 h-4 w-4 flex-none accent-[color:var(--problems)]" checked={on} onChange={() => setPick(id)} />
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold">{f ? f.title : "Write my own"}</span>
                        {f ? (
                          <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" title={f.evidence} style={good ? { background: "var(--fixes-soft)", color: "var(--fixes)" } : { background: "var(--surface-sunken)", color: "var(--ink-muted)" }}>
                            {best ? `Best fit · score +${f.difference!.toFixed(1)}` : good ? `Also worked · score +${f.difference!.toFixed(1)}` : f.used ? `Used ${f.used}×` : "Not tried here"}
                          </span>
                        ) : null}
                      </span>
                      {best && f ? <span className="sp-meta">Why: {f.evidence}</span> : null}
                      {on && f ? <span className="sp-meta">{f.text}</span> : null}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button variant="primary" lane="problems" className="min-h-12 px-6 text-[15px]" href={fixHref(driver, entry?.id, teams)}>
          {label}
          <ArrowRight size={17} aria-hidden="true" />
        </Button>
        <span className="sp-caption">Nothing is sent until you approve it.</span>
      </div>

      {where?.enough ? (
        <span className="border-t pt-3 sp-caption" style={{ borderColor: "var(--line-soft)" }}>
          {listed} of {where.eligible} teams with 5+ answers listed{rows.length > listed ? `, plus ${rows.length - listed} pooled ${rows.length - listed === 1 ? "tower" : "towers"}` : ""}. A to Z, never ranked.
          {where.small ? ` ${where.small} under 5: no number.` : ""}
          {where.safety ? ` ${where.safety} more hidden so others cannot be worked out.` : ""} Live count.
        </span>
      ) : null}
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
              whole
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

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-lg px-4 py-3.5" style={{ background: "var(--surface-sunken)" }}>
      <h4 className="m-0 text-[13px] font-bold">{title}</h4>
      {children}
    </div>
  );
}

function RootCause({ name, top, experience, where }: { name: string; top?: { title: string; n: number }; experience?: Detail["by_experience"]; where?: Teams }) {
  const [first, other] = ["First job", "Experienced"].map((g) => experience?.find((s) => s.group === g));
  const who =
    first?.enough && other?.enough
      ? rate(first) >= rate(other) * 1.5
        ? `First-job hires more: ${pct(first)} vs ${pct(other)}`
        : rate(other) >= rate(first) * 1.5
          ? `Experienced hires more: ${pct(other)} vs ${pct(first)}`
          : `First job and experienced alike: ${pct(first)} vs ${pct(other)}`
      : "Not enough people yet to split";
  const facts: { label: string; value: ReactNode }[] = [
    { label: "What", value: top ? `${top.title} (${top.n} people)` : "No shared idea yet" },
    { label: "Who", value: who },
    {
      label: "Where",
      value: !where?.enough
        ? "Not enough people yet"
        : where.verdict === "none"
          ? "Spread evenly across teams"
          : where.verdict === "most"
            ? "Most teams: a company-wide cause"
            : where.rows.map((r) => (
                <span key={r.name} className="block">
                  {r.name}
                  {r.times ? (
                    <span className="font-bold" style={{ color: "var(--problems)" }}>
                      {" "}
                      · {ordinal(r.times)} time in 6 months
                    </span>
                  ) : null}
                </span>
              )),
    },
  ];
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-lg px-5 py-4" style={{ background: "var(--problems-soft)" }}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <h3 className="m-0 text-[17px] font-bold" style={{ color: "var(--problems)" }}>
          Root cause
        </h3>
        <span className="sp-caption">Why new hires name {name.toLowerCase()}, from counts only</span>
      </div>
      <dl className="m-0 grid gap-x-6 gap-y-3 text-[15px] md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
        {facts.map((f) => (
          <div key={f.label} className="flex min-w-0 flex-col gap-0.5">
            <dt className="sp-caption font-bold uppercase tracking-[0.06em]">{f.label}</dt>
            <dd className="m-0 font-semibold">{f.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Problem({ driver, card, actions, waiting }: { driver: string; card: Card; actions: Action[]; waiting: number }) {
  const [filter, setFilter] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const overview = useApi<Overview>("/api/hr/themes/overview").data;
  const groups = useApi<Groups>(`/api/hr/themes/${driver}/groups`);
  const library = useApi<Entry[]>(`/api/hr/actions/library?driver=${driver}`);
  const replies = useApi<ReplyItem[]>("/api/hr/replies", 30000);
  const where = { data: overview?.teams[driver] };
  const fixes = actions.filter((a) => a.driver === driver && live(a));
  const name = driverName(driver);

  const d = overview?.details[driver];
  const g = groups.data;
  const grouped = g && g.status === "ok" && "groups" in g ? g.groups : [];
  const mine = (replies.data ?? [])
    .filter((r) => !r.escalate && r.drivers?.includes(driver) && counted(r))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const byId = new Map(mine.map((r) => [r.id, r]));
  const intakes = intakePoints(d);
  const days = (d?.by_day ?? []).flatMap((s) => (s.enough ? [{ label: dayLabel(s.touchpoint), n: s.n, m: s.m }] : []));
  const read = (title: string | null) => {
    setFilter(title);
    setOpen(true);
  };
  const close = useCallback(() => setOpen(false), []);

  return (
    <section id="cur" aria-labelledby="cur-title" className="sp-card min-w-0 scroll-mt-4 overflow-clip">
      <div key={driver} className="sp-enter grid items-start gap-6 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 id="cur-title" className="m-0 text-[28px] font-bold leading-[34px] tracking-[-0.01em]">
              {name}
            </h2>
            <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: fixes.length ? "var(--fixes-soft)" : "var(--problems-soft)", color: fixes.length ? "var(--fixes)" : "var(--problems)" }}>
              {fixes.length ? "Fix in progress" : "Needs a fix"}
            </span>
            {waiting > 0 ? (
              <Link href={`/replies?area=${driver}`} className="ml-auto inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-semibold no-underline hover:brightness-95" style={{ background: "var(--ai-soft)", color: "var(--ai)" }}>
                <MessageSquare size={14} aria-hidden="true" />
                {waiting} new {waiting === 1 ? "reply" : "replies"} to check
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            ) : null}
          </div>
          <div className="grid items-end gap-x-8 gap-y-5 sm:grid-cols-[auto_minmax(0,1fr)]">
            {card.enough ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col">
                  <span className="sp-num text-[44px] font-bold leading-[46px]">
                    {card.n}
                    <span className="text-[20px] font-semibold sp-muted"> of {card.m}</span>
                  </span>
                  <span className="sp-meta">who answered</span>
                  {card.avg != null ? <span className="sp-meta">Company average {card.avg} of 5</span> : null}
                </div>
                <Waffle c={card} />
              </div>
            ) : (
              <CountBar notEnough />
            )}
            {intakes.length ? (
              <div className="flex min-w-0 flex-col gap-2">
                <div className="flex items-center gap-0.5">
                  <h3 className="m-0 text-[13px] font-bold">Share of hires, by start month</h3>
                  <span className="sp-tip sp-tip-below">
                    <button type="button" className="sp-tip-btn" aria-label="What this chart shows">
                      <Info size={16} strokeWidth={2} aria-hidden="true" />
                    </button>
                    <span role="tooltip" className="sp-tip-bubble">
                      Each bar is the share of that month&apos;s new hires who named this problem in their latest check-in. Hover a bar for the exact count. The dashed line is the share across all months together, so months with more hires count for more.
                    </span>
                  </span>
                </div>
                <Columns points={intakes} />
              </div>
            ) : null}
          </div>

          <RootCause name={name} top={grouped[0]} experience={d?.by_experience} where={where.data} />

          <h3 className="m-0 text-[15px] font-bold">Evidence behind the root cause</h3>
          {d ? (
            <div className="sp-stagger -mt-2 grid gap-3 sm:grid-cols-2">
              <div className="grid min-w-0 sm:col-span-2">
                <Panel title="What they mean">
                  {grouped.length ? (
                    <div className="gap-x-6 md:columns-2">
                      {grouped.map((group) => {
                        const sample = group.reply_ids.map((id) => byId.get(id)).find((r) => r?.text);
                        return (
                          <div key={group.title} className="mb-4 flex min-w-0 break-inside-avoid flex-col gap-2 last:mb-0">
                            <HBar label={group.title} n={group.n} of={card.n ?? group.n} onClick={() => read(group.title)} />
                            {sample ? <TranslatedQuote language={sample.language} text={sample.text!} evidence={sample.evidence_quote} /> : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="sp-caption">No shared idea yet: each came from fewer than 5 people.</span>
                  )}
                  {g && g.status === "ok" && "groups" in g && g.not_grouped > 0 && grouped.length ? <span className="sp-caption">+{g.not_grouped} not grouped</span> : null}
                </Panel>
              </div>
              {d.by_experience.length ? (
                <Panel title="First job or experienced">
                  {d.by_experience.map((s) =>
                    s.enough ? (
                      <HBar key={s.group} label={s.group} n={s.n} of={s.m} sub={`${Math.round((s.n / Math.max(s.m, 1)) * 100)}% named ${name.toLowerCase()}`} />
                    ) : (
                      <span key={s.group} className="flex flex-col gap-1.5 text-[13px]">
                        <span className="font-semibold">{s.group}</span>
                        <CountBar notEnough have={s.have} need={s.need} />
                      </span>
                    ),
                  )}
                </Panel>
              ) : null}
              {days.length > 1 ? (
                <Panel title="Each check-in">
                  <Columns points={days} />
                </Panel>
              ) : null}
            </div>
          ) : (
            <div className="sp-skel h-40" />
          )}
          <button type="button" className="sp-link inline-flex items-center gap-1.5 self-start text-[14px]" aria-haspopup="dialog" disabled={!replies.data} onClick={() => read(null)}>
            <MessageSquare size={15} aria-hidden="true" />
            Review the {mine.length} replies in full
          </button>
          {open ? <ReplySheet driver={driver} replies={mine} groups={grouped} filter={filter} setFilter={setFilter} onClose={close} /> : null}
        </div>

        <div className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-[calc(var(--sp-demo-bar,0px)+16px)]">
          <h3 className="m-0 text-[15px] font-bold">Send a fix</h3>
          <SendFix key={driver} driver={driver} where={where.data} entries={library.data} fixes={fixes} />
        </div>
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
