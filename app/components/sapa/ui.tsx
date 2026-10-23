"use client";

import Link from "next/link";
import { Check, ChevronDown, Clock, MessageSquare, Shield, SquareCheck, Users } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from "react";

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

export function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = performance.now();
    const a = from.current;
    let frame = 0;
    const tick = (t: number) => {
      const k = Math.min((t - start) / 800, 1);
      const v = Math.round(a + (value - a) * (1 - Math.pow(1 - k, 3)));
      from.current = v;
      setShown(v);
      if (k < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <span className="sp-num">{shown}</span>;
}

export function LaneTile({ lane, count, label, hint, href }: { lane: Lane; count: ReactNode; label: string; hint?: ReactNode; href?: string }) {
  const body = (
    <>
      <div className="sp-tile-label">{label}</div>
      <div className="sp-tile-count">{typeof count === "number" ? <CountUp value={count} /> : count}</div>
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
          <CountUp value={count ?? 0} /> of <CountUp value={of ?? 0} />
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
  const text = state === "corrected" ? `${label} (changed by ${reviewer || "HR"})` : label;
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

export function Tabs<T extends string>({ value, onChange, items, label }: { value: T; onChange: (v: T) => void; items: [T, ReactNode][]; label: string }) {
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
    <div className="sp-card sp-pop-in flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span className="text-[17px] font-bold">{title}</span>
      {sub ? <span className="sp-muted">{sub}</span> : null}
    </div>
  );
}

export function Loading() {
  return (
    <div role="status" aria-label="Loading" className="sp-fade-in flex flex-col gap-4 py-2">
      <div className="sp-skel h-9 w-72 max-w-full" />
      <div className="sp-skel h-4 w-96 max-w-full" />
      <div className="sp-skel h-32" />
      <div className="sp-skel h-32" />
    </div>
  );
}

export function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return createPortal(
    <div className="sp-dialog-backdrop" onClick={onClose}>
      <div className="sp-dialog" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h2 className="m-0 text-[17px] font-bold">{title}</h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export const DRIVERS: Record<string, string> = {
  ROLE_CLARITY: "Role clarity",
  ONBOARDING: "Onboarding / Environment",
  TRAINING: "Training",
  MANAGER_SUPPORT: "Manager support",
  BELONGING: "Team integration",
  WORKLOAD: "Workload",
};

export const driverName = (d: string) => DRIVERS[d] ?? d.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());

export const pct = (part: number, whole: number) => Math.round((part / Math.max(whole, 1)) * 100);
export const month = (intake: string) => new Date(`${intake}-01T00:00:00Z`).toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
export const delay = (ms: number) => ({ animationDelay: `${ms}ms` }) as CSSProperties;
export const dayLabel = (touchpoint: number) => (touchpoint >= 180 ? `Month ${Math.round(touchpoint / 30.4)}` : `Day ${touchpoint}`);

export function shortDate(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kuala_Lumpur" });
}

export function fixScope(a: { scope_type: string | null; scope_team: string | null; scope_intake: string | null; scope_name?: string | null }) {
  if (a.scope_type === "person") return a.scope_name ?? "One new hire";
  if (a.scope_type === "team") return `${a.scope_team} team`;
  if (a.scope_type === "intake") return `${new Date(a.scope_intake!).toLocaleDateString("en-GB", { month: "long", timeZone: "UTC" })} starters`;
  return "No scope yet";
}

export type SelectOption = { value: string; label: string; hint?: string; flag?: string; disabled?: boolean };

export function Select({ id, label, value, onChange, options, auto }: { id?: string; label: string; value: string; onChange: (v: string) => void; options: SelectOption[]; auto?: boolean }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0];
  const move = (from: number, step: number) => {
    for (let i = from + step; i >= 0 && i < options.length; i += step) if (!options[i].disabled) return i;
    return from;
  };
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);
  const show = () => {
    setActive(Math.max(options.findIndex((o) => o.value === value), 0));
    setOpen(true);
  };
  const choose = (o: SelectOption) => {
    if (o.disabled) return;
    onChange(o.value);
    setOpen(false);
  };
  const key = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return setOpen(false);
    if (!["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) return;
    e.preventDefault();
    if (!open) return show();
    if (e.key === "ArrowDown") setActive(move(active, 1));
    else if (e.key === "ArrowUp") setActive(move(active, -1));
    else choose(options[active]);
  };
  return (
    <div ref={root} className={cx("sp-select", auto && "sp-select-auto")} onKeyDown={key}>
      <button type="button" id={id} className="sp-input sp-select-btn" aria-label={label} aria-haspopup="listbox" aria-expanded={open} onClick={() => (open ? setOpen(false) : show())}>
        <span className="sp-select-value">{current?.label}</span>
        <ChevronDown size={16} aria-hidden="true" className="sp-select-chev" />
      </button>
      {open ? (
        <ul role="listbox" aria-label={label} className="sp-select-list">
          {options.map((o, i) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              aria-disabled={o.disabled || undefined}
              className={cx("sp-select-opt", i === active && "is-active", o.disabled && "is-disabled")}
              onPointerEnter={() => !o.disabled && setActive(i)}
              onClick={() => choose(o)}
            >
              <span className="sp-select-main">
                <span className="sp-select-text">{o.label}</span>
                {o.hint ? <span className="sp-caption">{o.hint}</span> : null}
              </span>
              {o.flag ? <span className="sp-select-flag">{o.flag}</span> : null}
              {o.value === value ? <Check size={16} strokeWidth={2.5} aria-hidden="true" /> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
