"use client";

import Link from "next/link";
import { Clock, MessageSquare, Shield, SquareCheck, Users } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type Lane = "serious" | "problems" | "ai" | "fixes";

const cx = (...names: (string | false | null | undefined)[]) => names.filter(Boolean).join(" ");

export function LaneIcon({ lane, size = 17 }: { lane: Lane; size?: number }) {
  const Icon = { serious: Shield, problems: Users, ai: MessageSquare, fixes: SquareCheck }[lane];
  return <Icon size={size} strokeWidth={2} aria-hidden="true" />;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  lane?: Lane | "ink";
  why?: string | null;
  href?: string;
};

export function Button({ variant = "secondary", lane = "ink", why, href, className, children, ...rest }: ButtonProps) {
  const classes = cx("sp-btn", `sp-btn-${variant}`, `sp-lane-${lane}`, className);
  if (href && !rest.disabled) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  const button = (
    <button type="button" {...rest} className={classes}>
      {children}
    </button>
  );
  if (rest.disabled && why) {
    return (
      <div>
        {button}
        <div className="sp-btn-why">{why}</div>
      </div>
    );
  }
  return button;
}

export function LaneTile({ lane, count, label, hint, href }: { lane: Lane; count: ReactNode; label: string; hint?: ReactNode; href?: string }) {
  const body = (
    <>
      <div className="sp-tile-count">{count}</div>
      <div className="sp-tile-label">{label}</div>
      {hint ? <div className="sp-tile-hint">{hint}</div> : null}
    </>
  );
  return href ? (
    <Link href={href} className={cx("sp-tile", `sp-lane-${lane}`)}>
      {body}
    </Link>
  ) : (
    <div className={cx("sp-tile", `sp-lane-${lane}`)}>{body}</div>
  );
}

export function LaneSection({ lane, title, meta, id, children, action }: { lane: Lane; title: string; meta?: ReactNode; id?: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <section className={cx("sp-section", `sp-lane-${lane}`)} aria-label={title} id={id}>
      <div className="sp-section-head">
        <div className={cx("sp-icontile", `sp-lane-${lane}`)}>
          <LaneIcon lane={lane} />
        </div>
        <h2 className="sp-section-title">{title}</h2>
        {meta ? <div className="sp-section-meta">{meta}</div> : null}
        {action}
      </div>
      {children}
    </section>
  );
}

export function Card({ title, meta, children, className }: { title?: ReactNode; meta?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <section className={cx("sp-card", className)}>
      {title ? (
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b px-[18px] py-3" style={{ borderColor: "var(--line-soft)" }}>
          <h2 className="m-0 grow text-[15px] font-bold leading-5">{title}</h2>
          {meta ? <span className="sp-caption">{meta}</span> : null}
        </div>
      ) : null}
      <div className="flex flex-col gap-3 px-[18px] py-4">{children}</div>
    </section>
  );
}

export function Row({ title, meta, metric, action, muted, children }: { title?: ReactNode; meta?: ReactNode; metric?: ReactNode; action?: ReactNode; muted?: boolean; children?: ReactNode }) {
  return (
    <div className={cx("sp-row", muted && "sp-row-muted")}>
      <div className="sp-row-main">
        {title ? <div className="sp-row-title">{title}</div> : null}
        {children}
        {meta ? <div className="sp-row-meta">{meta}</div> : null}
      </div>
      <div className="sp-row-metric">{metric}</div>
      <div className="sp-row-action">{action}</div>
    </div>
  );
}

export function CountBar({ count, of, label = "who answered", lane = "problems", notEnough, have, need }: { count?: number; of?: number; label?: string; lane?: "problems" | "serious" | "fixes"; notEnough?: boolean; have?: number; need?: number }) {
  if (notEnough) {
    return (
      <div>
        <div className="sp-count-muted" style={{ fontWeight: 500 }}>
          Not enough people yet{have !== undefined && need ? ` (${have} of ${need} needed)` : ""}
        </div>
        <div className="sp-bar sp-bar-hatch" />
      </div>
    );
  }
  const pct = of ? Math.round(((count ?? 0) / of) * 100) : 0;
  return (
    <div>
      <div>
        <span className="sp-num" style={{ fontWeight: 700 }}>
          {count} of {of}
        </span>{" "}
        <span className="sp-count-muted">{label}</span>
      </div>
      <div className="sp-bar" role="img" aria-label={`${count} of ${of} ${label}`}>
        <div className={cx("sp-bar-fill", `sp-lane-${lane}`)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export type AiState = "suggested" | "unsure" | "confirmed" | "corrected";

export function AiMark({ state = "suggested", label, reviewer }: { state?: AiState; label: string; reviewer?: string | null }) {
  const reviewed = state === "confirmed" || state === "corrected";
  const tag = reviewed ? `✓ ${reviewer || "HR"}` : "AI";
  const text = state === "unsure" ? `${label}? Not sure` : state === "corrected" ? `${label} (changed by ${reviewer || "HR"})` : label;
  return (
    <span className={cx("sp-ai", reviewed && "sp-ai-reviewed")}>
      <span className="sp-ai-tag">{tag}</span>
      <span className="sp-ai-text">{text}</span>
    </span>
  );
}

export function Quote({ text, evidence, by, size }: { text: string; evidence?: string | null; by?: ReactNode; size?: "md" | "lg" }) {
  const i = evidence ? text.indexOf(evidence) : -1;
  const body =
    i < 0 || !evidence ? (
      text
    ) : (
      <>
        {text.slice(0, i)}
        <mark className="sp-evidence">{evidence}</mark>
        {text.slice(i + evidence.length)}
      </>
    );
  return (
    <figure style={{ margin: 0 }}>
      <blockquote className={cx("sp-quote", size === "lg" && "sp-quote-lg")}>
        “{body}”
      </blockquote>
      {by ? <figcaption className="sp-quote-by">{by}</figcaption> : null}
    </figure>
  );
}

const STEPS = ["Draft", "Assigned", "Accepted", "Done", "Note sent"];

export function FixTrack({ step, detail, status }: { step: number; detail?: ReactNode; status?: ReactNode }) {
  const at = Math.min(Math.max(step, 1), 5);
  return (
    <div>
      {status ?? (
        <div>
          <span style={{ fontWeight: 600 }}>{STEPS[at - 1]}</span>
          {detail ? <span className="sp-count-muted"> · {detail}</span> : null}
        </div>
      )}
      <div className="sp-track" role="img" aria-label={`Step ${at} of 5: ${STEPS[at - 1]}`}>
        {STEPS.map((_, i) => (
          <div key={i} className={cx("sp-track-seg", i < at && "sp-on")} />
        ))}
      </div>
    </div>
  );
}

export function Waiting({ children }: { children: ReactNode }) {
  return (
    <span className="sp-waiting">
      <Clock size={14} strokeWidth={2.2} aria-hidden="true" />
      {children}
    </span>
  );
}

export function Tabs<T extends string>({ value, onChange, items, label }: { value: T; onChange: (v: T) => void; items: [T, string][]; label: string }) {
  return (
    <div role="group" aria-label={label} className="sp-tabs">
      {items.map(([key, text]) => (
        <button key={key} type="button" className="sp-tab" aria-pressed={value === key} onClick={() => onChange(key)}>
          {text}
        </button>
      ))}
    </div>
  );
}

export function PageHeader({ title, sub, right }: { title: string; sub?: ReactNode; right?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1.5">
        <h1 className="sp-page-title">{title}</h1>
        {sub ? <p className="m-0 text-[15px] leading-[22px] sp-muted">{sub}</p> : null}
      </div>
      {right}
    </header>
  );
}

export function Empty({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="sp-card flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span className="text-[17px] font-bold">{title}</span>
      {sub ? <span className="sp-muted">{sub}</span> : null}
    </div>
  );
}

export function Loading() {
  return <div className="sp-muted px-1 py-6">Loading…</div>;
}

export function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="sp-dialog-backdrop" onClick={onClose}>
      <div className="sp-dialog" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h2 className="m-0 text-[17px] font-bold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export const DRIVERS: Record<string, string> = {
  ROLE_CLARITY: "Role clarity",
  ONBOARDING_TRAINING: "Onboarding and training",
  MANAGER_SUPPORT: "Manager support",
  BELONGING: "Belonging",
  WORKLOAD: "Workload",
};

export const driverName = (d: string) => DRIVERS[d] ?? d.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());

export const dayLabel = (touchpoint: number) => (touchpoint >= 180 ? "Month 6" : `Day ${touchpoint}`);

export function shortDate(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kuala_Lumpur" });
}

export function fixScope(a: { hiring_side: boolean; scope_type: string | null; scope_team: string | null; scope_intake: string | null; scope_person: string | null }) {
  if (a.hiring_side) return "Hiring";
  if (a.scope_type === "team") return `${a.scope_team} team`;
  if (a.scope_type === "person") return a.scope_person ?? "One new hire";
  if (a.scope_type === "intake") return `${new Date(a.scope_intake!).toLocaleDateString("en-GB", { month: "long", timeZone: "UTC" })} intake`;
  return "No scope yet";
}
