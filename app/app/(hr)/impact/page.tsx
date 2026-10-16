"use client";

import { Check, ChevronDown, Info, TrendingDown, TrendingUp } from "lucide-react";
import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useApi } from "@/components/sapa/data";
import { driverName, Empty, LaneIcon, Loading, Waiting } from "@/components/sapa/ui";

type Retention = { enough: true; k: number; n: number; text: string; note: string } | { enough: false; message: string; note: string };
type Intake =
  | { intake: string; enough: false; message: string }
  | { intake: string; enough: true; response_rate: number; median_days_reply_to_done: number | null };
type Fix = {
  id: string;
  driver: string;
  title: string;
  used: number;
  difference: number | null;
  evidence: string;
  result: "worked" | "no_clear_change" | "too_early";
  with_fix: { n: number; before: number; after: number };
  others: { n: number; before: number; after: number };
};
type Impact = {
  retention: Retention;
  baseline: { kept: number; of: number } | null;
  target: number;
  intakes: Intake[];
  retention_by_intake: { intake: string; hired: number; employed: number }[];
  day14: { answered: number; of: number } | null;
  typical_days_reply_to_done: number | null;
  speed: { first_intake: string; change: number } | null;
  fixes: Fix[];
  fixes_note: string;
  fixes_line: string;
  milestone_steps: { done: number; of: number } | null;
  leavers:
    | { enough: false; message: string }
    | { enough: true; total: number; top_reasons: { driver: string; n: number }[]; top_themes: { driver: string; n: number; m: number }[] };
};
type Milestone = { intake: string; enough: boolean; share_done?: number };
type Quality = {
  driver: string | null;
  language: string;
  state: string | null;
  evaluated: boolean;
  reason: string | null;
  spot_checks: number;
  changed: number;
  changed_share: number | null;
};

const LANGUAGES: Record<string, string> = { ms: "Bahasa Malaysia", en: "English", zh: "Chinese" };
const monthYear = (intake: string) => new Date(`${intake}-01`).toLocaleString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
const month = (intake: string) => new Date(`${intake}-01`).toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
const pct = (part: number, whole: number) => Math.round((part / whole) * 100);
const ok = (n: number | null | undefined): n is number => typeof n === "number" && Number.isFinite(n);
const at = (value: number) => ((Math.min(Math.max(value, 1), 5) - 1) / 4) * 100;
const delay = (ms: number) => ({ animationDelay: `${ms}ms` }) as CSSProperties;

function useSeen<T extends Element>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen] as const;
}

function Reveal({ children, className, wait = 0 }: { children: ReactNode; className?: string; wait?: number }) {
  const [ref, seen] = useSeen<HTMLDivElement>();
  return (
    <div ref={ref} className={`sp-reveal${seen ? " is-in" : ""}${className ? ` ${className}` : ""}`} style={{ "--d": `${wait}ms` } as CSSProperties}>
      {children}
    </div>
  );
}

function Num({ value, decimals = 0, sign, after = "" }: { value: number; decimals?: number; sign?: boolean; after?: string }) {
  const [ref, seen] = useSeen<HTMLSpanElement>();
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!seen) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (t: number) => {
      const k = Math.min((t - start) / 1100, 1);
      setShown(value * (1 - Math.pow(1 - k, 3)));
      if (k < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [seen, value]);
  const text = Math.abs(shown).toFixed(decimals);
  return (
    <span ref={ref} className="sp-num">
      {sign ? (value < 0 ? "-" : "+") : value < 0 ? "-" : ""}
      {text}
      {after}
    </span>
  );
}

function Tip({ label, children, end }: { label: string; children: ReactNode; end?: boolean }) {
  return (
    <span className={`sp-tip${end ? " sp-tip-end" : ""}`}>
      <button type="button" className="sp-tip-btn" aria-label={label}>
        <Info size={16} strokeWidth={2} aria-hidden="true" />
      </button>
      <span role="tooltip" className="sp-tip-bubble">
        {children}
      </span>
    </span>
  );
}

function Panel({ title, tip, badge, children, className }: { title: string; tip?: ReactNode; badge?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`sp-card sp-lift flex w-full flex-col gap-3.5 px-[18px] pb-[18px] pt-4 ${className ?? ""}`} aria-label={title}>
      <div className="flex items-center gap-1">
        <h2 className="m-0 text-[15px] font-bold leading-5">{title}</h2>
        {tip ? (
          <Tip label={`About: ${title}`} end>
            {tip}
          </Tip>
        ) : null}
      </div>
      {badge}
      {children}
    </section>
  );
}

function Badge({ lane, icon, children }: { lane: "problems" | "fixes"; icon?: ReactNode; children: ReactNode }) {
  return (
    <span className="sp-badge sp-pop-in" style={{ background: `var(--${lane}-soft)`, color: `var(--${lane})`, ...delay(500) }}>
      {icon}
      {children}
    </span>
  );
}

function RetentionChart({ points, base, target }: { points: { label: string; value: number }[]; base: number | null; target: number }) {
  const [ref, seen] = useSeen<HTMLDivElement>();
  const low = Math.min(60, Math.floor((Math.min(...points.map((p) => p.value), base ?? 100) - 5) / 10) * 10);
  const y = (v: number) => 20 + ((100 - v) / (100 - low)) * 170;
  const x = (i: number) => 60 + (i * 490) / Math.max(points.length - 1, 1);
  const line = points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ");
  const area = `M${x(0)} 190 L${line.replaceAll(" ", " L")} L${x(points.length - 1)} 190 Z`;
  const ticks = [100, (100 + low) / 2, low];
  return (
    <figure ref={ref} className={`sp-live m-0 flex min-w-0 flex-[2_1_420px] flex-col gap-1.5${seen ? " is-in" : ""}`}>
      <figcaption className="flex flex-wrap gap-3.5 text-xs font-semibold sp-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-[3px] w-3.5" style={{ background: "var(--fixes)" }} />
          Each intake
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3.5 border-t-2 border-dashed" style={{ borderColor: "var(--ink)" }} />
          Target {target}%
        </span>
        {base !== null ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3.5 border-t-2 border-dashed" style={{ borderColor: "var(--line-strong)" }} />
            Before Sapa {base}%
          </span>
        ) : null}
      </figcaption>
      <svg viewBox="0 0 580 220" width="100%" role="img" aria-label={`Month-6 retention by intake: ${points.map((p) => `${p.label} ${p.value}%`).join(", ")}.${base !== null ? ` Before Sapa ${base}%.` : ""} Target ${target}%.`}>
        <defs>
          <linearGradient id="sp-ret-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--fixes)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--fixes)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1="50" x2="560" y1={y(t)} y2={y(t)} style={{ stroke: t === low ? "var(--line)" : "var(--line-soft)" }} />
            <text x="40" y={y(t) + 4} textAnchor="end" style={{ fontSize: 11, fill: "var(--ink-muted)" }}>
              {t}%
            </text>
          </g>
        ))}
        <line className="sp-fade-in" x1="50" x2="560" y1={y(target)} y2={y(target)} style={{ stroke: "var(--ink)", strokeWidth: 1.5, strokeDasharray: "6 4", ...delay(200) }} />
        {base !== null ? <line className="sp-fade-in" x1="50" x2="560" y1={y(base)} y2={y(base)} style={{ stroke: "var(--line-strong)", strokeWidth: 1.5, strokeDasharray: "6 4", ...delay(300) }} /> : null}
        <path className="sp-fade-in" d={area} fill="url(#sp-ret-fill)" style={delay(900)} />
        <polyline className="sp-draw" pathLength={1} points={line} style={{ fill: "none", stroke: "var(--fixes)", strokeWidth: 3, strokeLinejoin: "round", strokeLinecap: "round" }} />
        {points.map((p, i) => {
          const last = i === points.length - 1;
          return (
            <g key={p.label} className="sp-dot" style={{ ...delay(150 + i * 140), transformOrigin: `${x(i)}px ${y(p.value)}px` }}>
              <circle cx={x(i)} cy={y(p.value)} r={last ? 5.5 : 4.5} style={last ? { fill: "var(--fixes)" } : { fill: "var(--surface-raised)", stroke: "var(--fixes)", strokeWidth: 2.5 }} />
              <text x={x(i)} y={y(p.value) - 11} textAnchor="middle" style={{ fontSize: 11, fontWeight: 700, fill: "var(--ink)" }}>
                {p.value}
              </text>
              <text x={x(i)} y="210" textAnchor="middle" style={{ fontSize: 11, fontWeight: 600, fill: "var(--ink-muted)" }}>
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

function Hero({ impact }: { impact: Impact }) {
  const { retention, baseline, target } = impact;
  const [ref, seen] = useSeen<HTMLDivElement>();
  if (!retention.enough) {
    return (
      <section className="sp-card flex flex-col gap-2 px-[22px] py-5" aria-label="Still employed at Month 6">
        <h2 className="m-0 text-[15px] font-bold">Still employed at Month 6</h2>
        <span className="text-[22px] font-bold">{retention.message}</span>
        <span className="sp-meta">{retention.note}.</span>
      </section>
    );
  }
  const kept = pct(retention.k, retention.n);
  const base = baseline ? pct(baseline.kept, baseline.of) : null;
  const gain = base === null ? null : kept - base;
  const points = impact.retention_by_intake.map((r) => ({ label: month(r.intake), value: pct(r.employed, r.hired) }));
  return (
    <section className="sp-card sp-hero flex flex-wrap gap-7 px-[22px] py-5" aria-label="Still employed at Month 6">
      <div ref={ref} className={`sp-live flex min-w-0 flex-[1_1_300px] flex-col gap-3.5${seen ? " is-in" : ""}`}>
        <div className="flex items-center gap-1">
          <h2 className="m-0 text-[15px] font-bold leading-5">Still employed at Month 6</h2>
          <Tip label="How retention is counted">
            From HR&apos;s own hire and exit records. Everyone hired counts, whether or not they joined Sapa.
            {baseline ? ` Before Sapa: ${baseline.kept} of ${baseline.of}.` : ""} Target: {target}%.
          </Tip>
        </div>
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-[64px] font-bold leading-[60px] tracking-[-0.03em]">
            <Num value={kept} after="%" />
          </span>
          {gain !== null ? (
            <span className="sp-num sp-pop-in inline-flex items-center gap-1 rounded px-2 py-0.5 text-[13px] font-bold" style={{ background: gain >= 0 ? "var(--fixes)" : "var(--ink-muted)", color: "var(--on-fixes)", ...delay(900) }}>
              {gain >= 0 ? <TrendingUp size={14} aria-hidden="true" /> : <TrendingDown size={14} aria-hidden="true" />}
              {gain >= 0 ? "+" : "-"}
              {Math.abs(gain)} pts vs before Sapa
            </span>
          ) : null}
        </div>
        <span className="sp-num sp-meta">
          <b style={{ color: "var(--ink)" }}>
            {retention.k} of {retention.n}
          </b>{" "}
          new hires still here after six months
        </span>
        <div role="img" aria-label={`${kept}% now.${base !== null ? ` ${base}% before Sapa.` : ""} Target ${target}%.`} className="flex flex-col gap-1.5 pt-1.5">
          <div className="relative h-3.5 rounded-[7px]" style={{ background: "var(--track-empty)" }}>
            <div className="sp-grow-x absolute inset-y-0 left-0 rounded-[7px]" style={{ width: `${kept}%`, background: "linear-gradient(90deg, var(--fixes-soft), var(--fixes) 40%)", ...delay(150) }} />
            {base !== null ? <div className="sp-fade-in absolute -inset-y-[5px] w-0.5" style={{ left: `${base}%`, background: "var(--line-strong)", ...delay(800) }} /> : null}
            <div className="sp-fade-in absolute -inset-y-[5px] w-0.5" style={{ left: `${target}%`, background: "var(--ink)", ...delay(900) }} />
          </div>
          <div className="sp-num relative h-4 text-xs font-semibold">
            {base !== null ? (
              <span className="absolute whitespace-nowrap sp-muted" style={{ left: `${base}%`, transform: "translateX(-90%)" }}>
                Before {base}%
              </span>
            ) : null}
            <span className="absolute whitespace-nowrap" style={{ left: `${target}%`, transform: "translateX(-10%)" }}>
              Target {target}%
            </span>
          </div>
        </div>
        <span className="sp-caption mt-auto inline-flex items-center gap-1.5 font-semibold">
          <Info size={13} aria-hidden="true" />
          {retention.note}.
        </span>
      </div>
      {points.length > 1 ? <RetentionChart points={points} base={base} target={target} /> : null}
    </section>
  );
}

function Spark({ values, label }: { values: number[]; label: string }) {
  const top = Math.max(...values);
  const low = Math.min(...values);
  const xy = values.map((v, i) => [4 + (i * 72) / Math.max(values.length - 1, 1), 32 - ((v - low) / Math.max(top - low, 0.01)) * 24]);
  const end = xy[xy.length - 1];
  return (
    <svg viewBox="0 0 80 36" width="80" height="36" role="img" aria-label={label}>
      <polyline className="sp-draw" pathLength={1} points={xy.map(([a, b]) => `${a},${b}`).join(" ")} style={{ fill: "none", stroke: "var(--problems)", strokeWidth: 2.5, strokeLinejoin: "round", strokeLinecap: "round" }} />
      <circle className="sp-dot" cx={end[0]} cy={end[1]} r="3.5" style={{ fill: "var(--problems)", transformOrigin: `${end[0]}px ${end[1]}px`, ...delay(900) }} />
    </svg>
  );
}

function MiniBars({ values, label }: { values: number[]; label: string }) {
  const top = Math.max(...values, 1);
  return (
    <div role="img" aria-label={label} className="flex h-9 items-end gap-[3px]">
      {values.map((v, i) => (
        <span key={i} className="sp-grow-y w-2 rounded-t-sm" style={{ height: `${Math.max((v / top) * 100, 8)}%`, background: i === values.length - 1 ? "var(--fixes)" : "var(--fixes-soft)", ...delay(i * 70) }} />
      ))}
    </div>
  );
}

function Ring({ share, label }: { share: number; label: string }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" role="img" aria-label={label} style={{ transform: "rotate(-90deg)" }}>
      <circle cx="20" cy="20" r="15" style={{ fill: "none", stroke: "var(--track-empty)", strokeWidth: 6 }} />
      <circle className="sp-ring" pathLength={1} cx="20" cy="20" r="15" style={{ fill: "none", stroke: "var(--problems)", strokeWidth: 6, strokeDasharray: `${share} 1`, strokeLinecap: "round" }} />
    </svg>
  );
}

function Tile({ label, value, viz, base, i }: { label: string; value: ReactNode; viz?: ReactNode; base: ReactNode; i: number }) {
  const [ref, seen] = useSeen<HTMLElement>();
  return (
    <section ref={ref} aria-label={label} className={`sp-card sp-lift sp-live sp-reveal flex flex-col gap-2 px-[18px] py-4${seen ? " is-in" : ""}`} style={{ "--d": `${i * 80}ms` } as CSSProperties}>
      <h2 className="m-0 text-[13px] font-semibold leading-[18px] sp-muted">{label}</h2>
      <div className="flex items-end justify-between gap-2.5">
        <span className="whitespace-nowrap text-[34px] font-bold leading-[34px] tracking-[-0.01em]">{value}</span>
        {viz}
      </div>
      <span className="sp-num sp-caption">{base}</span>
    </section>
  );
}

function Result({ fix }: { fix: Fix }) {
  if (fix.result === "too_early") return <Waiting>Too early</Waiting>;
  if (fix.result === "worked")
    return (
      <span className="inline-flex items-center gap-1 rounded px-2 py-[3px] text-xs font-bold" style={{ background: "var(--fixes)", color: "var(--on-fixes)" }}>
        <Check size={13} strokeWidth={3} aria-hidden="true" />
        Worked
      </span>
    );
  return (
    <span className="inline-flex items-center rounded border px-2 py-0.5 text-xs font-bold" style={{ borderColor: "var(--line-strong)" }}>
      No clear change
    </span>
  );
}

function Dumbbell({ before, after, tone, big }: { before: number; after: number | null; tone: string; big?: boolean }) {
  const s = big ? 12 : 10;
  const from = at(before);
  const to = after === null ? null : at(after);
  return (
    <div className="relative" style={{ height: s }}>
      <div className="absolute inset-x-0 h-0.5" style={{ top: s / 2 - 1, background: "var(--line-soft)" }} />
      {to === null ? (
        <div className="sp-bar-hatch sp-grow-x absolute h-1.5 rounded-[3px]" style={{ left: `${from}%`, width: "30%", top: s / 2 - 3 }} />
      ) : (
        <div className="sp-grow-x absolute h-1" style={{ left: `${Math.min(from, to)}%`, width: `${Math.abs(to - from)}%`, top: s / 2 - 2, background: tone, ...delay(250) }} />
      )}
      <div className="absolute box-border rounded-full border-2" style={{ left: `${from}%`, width: s, height: s, marginLeft: -s / 2, borderColor: tone, background: "var(--surface-raised)" }} />
      {to !== null ? <div className="sp-slide absolute rounded-full" style={{ "--from": `${from}%`, left: `${to}%`, width: s, height: s, marginLeft: -s / 2, background: tone, ...delay(250) } as CSSProperties} /> : null}
    </div>
  );
}

function FixRow({ fix }: { fix: Fix }) {
  const [ref, seen] = useSeen<HTMLDetailsElement>();
  const measured = fix.result !== "too_early" && ok(fix.with_fix.after);
  const hasBefore = ok(fix.with_fix.before);
  const times = `${fix.used} ${fix.used === 1 ? "time" : "times"}`;
  return (
    <details ref={ref} className={`sp-fixrow sp-live${seen ? " is-in" : ""}`}>
      <summary className="flex flex-wrap items-center gap-4 px-[18px] py-3.5">
        <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-0.5">
          <span className="font-semibold">{fix.title}</span>
          <span className="sp-caption">{driverName(fix.driver)}</span>
        </div>
        <div
          className="flex flex-[2_1_280px] flex-col gap-2.5"
          role="img"
          aria-label={measured ? `Team ${fix.with_fix.before.toFixed(1)} to ${fix.with_fix.after.toFixed(1)}. Other teams ${fix.others.before.toFixed(1)} to ${fix.others.after.toFixed(1)}.` : hasBefore ? `Team ${fix.with_fix.before.toFixed(1)} before. No after score yet.` : "No score yet."}
        >
          {hasBefore ? <Dumbbell before={fix.with_fix.before} after={measured ? fix.with_fix.after : null} tone="var(--fixes)" big /> : <div className="h-3" />}
          {measured && ok(fix.others.before) && ok(fix.others.after) ? <Dumbbell before={fix.others.before} after={fix.others.after} tone="var(--line-strong)" /> : <div className="h-2.5" />}
        </div>
        <span className="flex-[0_0_64px] text-right text-[18px] font-bold leading-[22px]" style={{ color: fix.result === "worked" ? "var(--fixes)" : "var(--ink-muted)" }}>
          {fix.difference === null ? "–" : <Num value={fix.difference} decimals={1} sign />}
        </span>
        <span className="flex-[0_0_132px]">
          <Result fix={fix} />
        </span>
        <ChevronDown size={18} className="sp-chev sp-muted flex-[0_0_20px]" aria-hidden="true" />
      </summary>
      <div className="sp-num sp-open flex flex-wrap gap-x-7 gap-y-2 px-[18px] pb-4 pt-1 text-[13px] leading-[18px] sp-muted">
        {measured ? (
          <>
            <span>
              <b style={{ color: "var(--ink)" }}>
                {fix.with_fix.before.toFixed(1)} → {fix.with_fix.after.toFixed(1)}
              </b>{" "}
              teams with the fix
            </span>
            <span>
              <b style={{ color: "var(--ink)" }}>
                {fix.others.before.toFixed(1)} → {fix.others.after.toFixed(1)}
              </b>{" "}
              other teams
            </span>
            <span>
              {fix.with_fix.n} people with the fix, {fix.others.n} outside
            </span>
            <span>Used {times}</span>
          </>
        ) : (
          <>
            {hasBefore ? (
              <span>
                <b style={{ color: "var(--ink)" }}>{fix.with_fix.before.toFixed(1)}</b> before
              </span>
            ) : null}
            <span>The after score comes with the next check-in</span>
            <span>{fix.evidence}</span>
          </>
        )}
      </div>
    </details>
  );
}

function Fixes({ impact }: { impact: Impact }) {
  const { fixes } = impact;
  return (
    <section className="sp-section" aria-label="Did each fix work?">
      <div className="sp-section-head">
        <div className="sp-icontile sp-lane-fixes">
          <LaneIcon lane="fixes" />
        </div>
        <h2 className="m-0 text-[15px] font-bold leading-5">Did each fix work?</h2>
        <Tip label="How a fix is judged">
          Same 1–5 check-in question before the fix and after the manager&apos;s note. The team that got the fix is compared with other teams in the same weeks, because teams often improve anyway.
        </Tip>
        <div className="grow" />
        <div className="flex flex-wrap gap-3.5 text-xs font-semibold sp-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="box-border h-2.5 w-2.5 rounded-full border-2" style={{ borderColor: "var(--fixes)" }} />
            Before
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--fixes)" }} />
            After · team with the fix
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--line-strong)" }} />
            Other teams
          </span>
        </div>
      </div>
      {fixes.length ? (
        <>
          <div aria-hidden="true" className="hidden flex-wrap gap-4 px-[18px] py-2 text-xs font-semibold sp-muted sm:flex" style={{ background: "var(--surface-sunken)" }}>
            <span className="flex-[1_1_220px]">Fix</span>
            <div className="sp-num flex flex-[2_1_280px] justify-between">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
            <span className="flex-[0_0_64px] text-right">Gain</span>
            <span className="flex-[0_0_132px]">Result</span>
            <span className="flex-[0_0_20px]" />
          </div>
          {fixes.map((fix) => (
            <FixRow key={fix.id} fix={fix} />
          ))}
          <div className="sp-caption px-[18px] py-3" style={{ borderTop: "1px solid var(--line-soft)" }}>
            {impact.fixes_line} {impact.fixes_note}.
          </div>
        </>
      ) : (
        <div className="sp-muted px-[18px] py-4">No fix has been marked done yet.</div>
      )}
    </section>
  );
}

function Reasons({ leavers }: { leavers: Impact["leavers"] }) {
  const [ref, seen] = useSeen<HTMLDivElement>();
  if (!leavers.enough)
    return (
      <Panel title="Did Sapa spot the real reasons early?">
        <span className="sp-muted">{leavers.message}</span>
        <div className="sp-bar sp-bar-hatch" />
      </Panel>
    );
  const day14Base = leavers.top_themes[0]?.m ?? 0;
  const drivers = [...new Set([...leavers.top_reasons.map((r) => r.driver), ...leavers.top_themes.map((t) => t.driver)])];
  const rows = drivers.map((driver) => {
    const t = leavers.top_themes.find((x) => x.driver === driver);
    const r = leavers.top_reasons.find((x) => x.driver === driver);
    return { driver, left: t ? pct(t.n, t.m) : 0, right: r ? pct(r.n, leavers.total) : 0, t, r };
  });
  const top = Math.max(...rows.flatMap((row) => [row.left, row.right]), 1);
  const width = (v: number) => `${(v / top) * 85}%`;
  const match = leavers.top_reasons[0] && leavers.top_themes[0] && leavers.top_reasons[0].driver === leavers.top_themes[0].driver;
  return (
    <Panel
      title="Did Sapa spot the real reasons early?"
      tip={`Left: share of the ${day14Base} new hires who answered at Day 14 and raised each area. Right: reasons from the ${leavers.total} leavers who answered the exit question. Leavers' answers never count in check-in themes.`}
      badge={
        match ? (
          <Badge lane="problems" icon={<Check size={14} strokeWidth={3} aria-hidden="true" />}>
            Top reason people left ({driverName(leavers.top_reasons[0].driver)}) was the top Day 14 signal
          </Badge>
        ) : null
      }
    >
      <div
        ref={ref}
        role="img"
        aria-label={rows.map((row) => `${driverName(row.driver)}: ${row.left}% at Day 14, ${row.right}% of leavers`).join(". ")}
        className={`sp-live grid items-center gap-x-3 gap-y-2.5${seen ? " is-in" : ""}`}
        style={{ gridTemplateColumns: "minmax(0,1fr) auto minmax(0,1fr)" }}
      >
        <span className="text-right text-xs font-semibold" style={{ color: "var(--problems)" }}>
          Raised at Day 14 <span className="sp-num font-normal sp-muted">of {day14Base}</span>
        </span>
        <span />
        <span className="text-xs font-semibold">
          Leavers&apos; reason <span className="sp-num font-normal sp-muted">of {leavers.total}</span>
        </span>
        {rows.map((row, i) => (
          <Fragment key={row.driver}>
            <div className="flex items-center justify-end gap-1.5" title={row.t ? `${row.t.n} of ${row.t.m}` : undefined}>
              <span className="sp-num text-xs font-bold">{row.t ? `${row.left}%` : "–"}</span>
              <span className="sp-grow-x-r h-[18px] rounded-l-[3px]" style={{ width: width(row.left), background: "var(--problems)", ...delay(i * 90) }} />
            </div>
            <span className={`min-w-[96px] text-center text-[13px] ${i === 0 ? "font-bold" : "font-semibold"}`}>{driverName(row.driver)}</span>
            <div className="flex items-center gap-1.5" title={row.r ? `${row.r.n} of ${leavers.total}` : undefined}>
              <span className="sp-grow-x h-[18px] rounded-r-[3px]" style={{ width: width(row.right), background: "var(--ink)", ...delay(120 + i * 90) }} />
              <span className="sp-num text-xs font-bold">{row.r ? `${row.right}%` : "–"}</span>
            </div>
          </Fragment>
        ))}
      </div>
    </Panel>
  );
}

function Speed({ timed }: { timed: { intake: string; days: number }[] }) {
  const [ref, seen] = useSeen<HTMLDivElement>();
  if (!timed.length)
    return (
      <Panel title="Is the loop getting faster?">
        <span className="sp-muted">Not enough fixes done yet.</span>
        <div className="sp-bar sp-bar-hatch" />
      </Panel>
    );
  const top = Math.max(...timed.map((t) => t.days), 1);
  const first = timed[0].days;
  const last = timed.at(-1)!.days;
  const fmt = (d: number) => (Number.isInteger(d) ? `${d}` : d.toFixed(1));
  return (
    <Panel
      title="Is the loop getting faster?"
      tip="Typical (median) days from a new hire's reply to the manager marking the fix done, per intake."
      badge={
        <Badge lane="fixes" icon={last < first ? <TrendingDown size={14} aria-hidden="true" /> : undefined}>
          {last === first ? `Steady at ${fmt(last)} days` : `${fmt(first)} → ${fmt(last)} days`}
        </Badge>
      }
    >
      <div ref={ref} className={`sp-live flex flex-col gap-1.5${seen ? " is-in" : ""}`}>
        <div role="img" aria-label={`Days from reply to fix done: ${timed.map((t) => `${month(t.intake)} ${fmt(t.days)}`).join(", ")}`} className="flex h-[150px] items-end gap-2.5 border-b pt-1.5" style={{ borderColor: "var(--line)" }}>
          {timed.map((t, i) => {
            const end = i === timed.length - 1;
            return (
              <div key={t.intake} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className="sp-num sp-fade-in text-xs font-bold" style={{ color: end ? "var(--fixes)" : undefined, ...delay(400 + i * 80) }}>
                  {fmt(t.days)}
                </span>
                <span className="sp-grow-y w-full max-w-10 rounded-t" style={{ height: `${(t.days / top) * 120}px`, background: end ? "var(--fixes)" : "var(--fixes-soft)", ...delay(i * 80) }} />
              </div>
            );
          })}
        </div>
        <div aria-hidden="true" className="flex gap-2.5 text-xs font-semibold sp-muted">
          {timed.map((t) => (
            <span key={t.intake} className="flex-1 text-center">
              {month(t.intake)}
            </span>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function Intakes({ impact, shareDone }: { impact: Impact; shareDone: Map<string, number | undefined> }) {
  const outcome = new Map(impact.retention_by_intake.map((r) => [r.intake, r]));
  const { retention, milestone_steps: steps, typical_days_reply_to_done: typical } = impact;
  return (
    <details className="sp-card sp-fold overflow-hidden">
      <summary className="flex min-h-[52px] cursor-pointer items-center gap-3 px-[18px]">
        <div className="sp-icontile sp-lane-problems">
          <LaneIcon lane="problems" />
        </div>
        <span className="grow text-[15px] font-bold leading-5">Every intake, side by side</span>
        <span className="sp-caption font-semibold">{impact.intakes.length} rows</span>
        <ChevronDown size={18} className="sp-chev sp-muted" aria-hidden="true" />
      </summary>
      <div className="sp-open overflow-x-auto border-t" style={{ borderColor: "var(--line)" }}>
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold sp-muted" style={{ background: "var(--surface-sunken)" }}>
              <th scope="col" className="px-[18px] py-2.5 font-semibold">Intake</th>
              <th scope="col" className="px-3 py-2.5 font-semibold">Still employed Month 6</th>
              <th scope="col" className="px-3 py-2.5 font-semibold">Replied to check-ins</th>
              <th scope="col" className="px-3 py-2.5 font-semibold">Days to fix done</th>
              <th scope="col" className="py-2.5 pl-3 pr-[18px] font-semibold">Manager steps done</th>
            </tr>
          </thead>
          <tbody className="sp-num">
            {impact.intakes.map((i) => {
              const share = shareDone.get(i.intake);
              const row = outcome.get(i.intake);
              return (
                <tr key={i.intake} className="sp-trow" style={{ borderTop: "1px solid var(--line-soft)" }}>
                  <th scope="row" className="px-[18px] py-[11px] text-left font-semibold">
                    {monthYear(i.intake)}
                    {row ? ` · ${row.hired}` : ""}
                  </th>
                  {i.enough ? (
                    <>
                      <td className="px-3 py-[11px]">{row ? `${row.employed} of ${row.hired}` : "Not at Month 6 yet"}</td>
                      <td className="px-3 py-[11px]">{pct(i.response_rate, 1)}%</td>
                      <td className="px-3 py-[11px]">{i.median_days_reply_to_done ?? "–"}</td>
                      <td className="py-[11px] pl-3 pr-[18px]">{share === undefined ? "–" : `${pct(share, 1)}%`}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-[11px]">{row ? `${row.employed} of ${row.hired}` : "–"}</td>
                      <td colSpan={3} className="px-3 py-[11px] sp-muted">
                        {i.message}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
            {retention.enough ? (
              <tr style={{ borderTop: "1px solid var(--line)", background: "var(--surface-sunken)" }}>
                <th scope="row" className="px-[18px] py-[11px] text-left font-bold">
                  All · {retention.n}
                </th>
                <td className="px-3 py-[11px] font-bold">
                  {retention.k} of {retention.n}
                </td>
                <td className="px-3 py-[11px] font-bold">{impact.day14 ? `${pct(impact.day14.answered, impact.day14.of)}% at Day 14` : "–"}</td>
                <td className="px-3 py-[11px] font-bold">{typical ?? "–"}</td>
                <td className="py-[11px] pl-3 pr-[18px] font-bold">{steps ? `${steps.done} of ${steps.of}` : "–"}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function Quality({ quality }: { quality: Quality[] }) {
  const [ref, seen] = useSeen<HTMLDivElement>();
  const byLanguage = new Map<string, { checks: number; changed: number; evaluated: boolean }>();
  for (const q of quality) {
    const entry = byLanguage.get(q.language) ?? { checks: 0, changed: 0, evaluated: true };
    byLanguage.set(q.language, { checks: entry.checks + q.spot_checks, changed: entry.changed + q.changed, evaluated: entry.evaluated && q.evaluated });
  }
  const languages = [...byLanguage.entries()].sort(([a], [b]) => (a === "ms" ? -1 : b === "ms" ? 1 : a.localeCompare(b)));
  const checks = quality.reduce((sum, q) => sum + q.spot_checks, 0);
  const changed = quality.reduce((sum, q) => sum + q.changed, 0);
  const waiting = quality.filter((q) => q.evaluated && q.driver && (q.state === "held" || q.state === "calibrating"));
  return (
    <details className="sp-card sp-fold overflow-hidden" open>
      <summary className="flex min-h-[52px] cursor-pointer flex-wrap items-center gap-3 px-[18px] py-1.5">
        <div className="sp-icontile sp-lane-ai">
          <LaneIcon lane="ai" />
        </div>
        <span className="grow text-[15px] font-bold leading-5">AI quality watch</span>
        <span className="sp-num text-[13px] font-bold" style={{ color: "var(--ai)" }}>
          {checks ? `${checks - changed} of ${checks} AI labels kept by HR · last 30 days` : "No spot checks in the last 30 days"}
        </span>
        <ChevronDown size={18} className="sp-chev sp-muted" aria-hidden="true" />
      </summary>
      <div ref={ref} className={`sp-open sp-live flex flex-col gap-3.5 border-t px-[18px] pb-[18px] pt-3.5${seen ? " is-in" : ""}`} style={{ borderColor: "var(--line)" }}>
        <div aria-hidden="true" className="flex flex-wrap gap-4 text-xs font-semibold sp-muted">
          <span className="flex-[1_1_180px]">Language</span>
          <span className="flex-[2_1_240px]">Random spot checks where HR kept the AI&apos;s label</span>
        </div>
        {languages.map(([language, q], i) => (
          <div key={language} className="flex flex-wrap items-center gap-4">
            <span className="flex-[1_1_180px] font-semibold">{LANGUAGES[language] ?? language}</span>
            <div className="flex flex-[2_1_240px] items-center gap-2.5">
              {q.evaluated && q.checks ? (
                <>
                  <div role="img" aria-label={`${q.checks - q.changed} of ${q.checks} kept`} className="h-2.5 grow overflow-hidden rounded-[5px]" style={{ background: "var(--track-empty)" }}>
                    <div className="sp-grow-x h-full" style={{ width: `${pct(q.checks - q.changed, q.checks)}%`, background: "var(--ai)", ...delay(i * 120) }} />
                  </div>
                  <span className="sp-num flex-[0_0_64px] font-bold">
                    {q.checks - q.changed} of {q.checks}
                  </span>
                </>
              ) : (
                <>
                  <div className="sp-bar-hatch h-2.5 grow rounded-[5px]" />
                  <span className="flex-[0_0_auto] text-[13px] font-semibold sp-muted">{q.evaluated ? "No spot checks yet" : "Not evaluated: labels wait for HR"}</span>
                </>
              )}
            </div>
          </div>
        ))}
        {waiting.length ? (
          <div className="flex flex-col gap-1.5 border-t pt-3 text-[13px]" style={{ borderColor: "var(--line-soft)" }}>
            {waiting.map((q) => (
              <span key={`${q.driver}|${q.language}`} className="flex flex-wrap items-center gap-x-2">
                <Waiting>{q.state === "held" ? "Held" : "Calibrating"}</Waiting>
                <span className="font-semibold">
                  {driverName(q.driver!)} · {LANGUAGES[q.language] ?? q.language}
                </span>
                <span className="sp-muted">{q.reason ?? (q.state === "held" ? "New labels wait for HR" : "New labels wait for HR until 20 spot checks show at most 10% changed")}</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </details>
  );
}

export default function Page() {
  const impact = useApi<Impact>("/api/hr/impact");
  const milestones = useApi<Milestone[]>("/api/hr/milestones");
  const quality = useApi<Quality[]>("/api/hr/quality");
  if (!impact.data || !milestones.data || !quality.data) return impact.error || milestones.error || quality.error ? <Empty title="Could not load Impact" sub="Try again in a moment." /> : <Loading />;
  const { retention, intakes, day14, speed, fixes, typical_days_reply_to_done: typical } = impact.data;
  const shareDone = new Map(milestones.data.map((m) => [m.intake, m.share_done]));
  const enough = intakes.filter((i): i is Extract<Intake, { enough: true }> => i.enough);
  const timed = enough.flatMap((i) => (i.median_days_reply_to_done !== null ? [{ intake: i.intake, days: i.median_days_reply_to_done }] : []));
  const measured = fixes.filter((f) => f.result !== "too_early");
  const worked = measured.filter((f) => f.result === "worked").length;
  const tooEarly = fixes.length - measured.length;
  const steps = impact.data.milestone_steps;
  const period = intakes.length ? `${monthYear(intakes[0].intake)} – ${monthYear(intakes.at(-1)!.intake)} · ${intakes.length} intakes${retention.enough ? ` · ${retention.n} hired` : ""}` : null;
  const rates = enough.map((i) => i.response_rate);

  return (
    <div className="flex flex-col gap-5">
      <Reveal>
        <header className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="sp-page-title">Impact</h1>
            {period ? (
              <span className="sp-num inline-flex min-h-7 items-center rounded-lg border px-2.5 text-xs font-semibold sp-muted" style={{ borderColor: "var(--line)", background: "var(--surface-raised)" }}>
                {period}
              </span>
            ) : null}
            <Tip label="What these numbers count">Groups of 5 or more only, so no one can be picked out. Serious concerns are never counted. No team or manager is ranked against another.</Tip>
          </div>
          <p className="m-0 text-[15px] leading-[22px] sp-muted">Do more new hires stay? Do the fixes work? Is HR getting faster?</p>
        </header>
      </Reveal>

      <Reveal wait={80}>
        <Hero impact={impact.data} />
      </Reveal>

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <Tile
          i={0}
          label="Answered Day 14"
          value={day14 ? <Num value={pct(day14.answered, day14.of)} after="%" /> : "–"}
          viz={rates.length > 1 ? <Spark values={rates} label={`Reply rate by intake: ${rates.map((r) => `${pct(r, 1)}%`).join(", ")}`} /> : null}
          base={day14 ? `${day14.answered} of ${day14.of} new hires` : "Not enough people yet"}
        />
        <Tile
          i={1}
          label={timed.length ? `Reply to fix done · ${month(timed.at(-1)!.intake)} intake` : "Reply to fix done"}
          value={timed.length ? <Num value={timed.at(-1)!.days} after=" days" /> : typical !== null ? <Num value={typical} after=" days" /> : "–"}
          viz={timed.length > 1 ? <MiniBars values={timed.map((t) => t.days)} label={`Typical days by intake: ${timed.map((t) => t.days).join(", ")}`} /> : null}
          base={
            !speed || typical === null ? (
              "Not enough fixes yet"
            ) : speed.change === 0 ? (
              "Same as the first intake"
            ) : (
              <>
                <b style={{ color: speed.change > 0 ? "var(--fixes)" : undefined }}>
                  {Math.abs(speed.change)} days {speed.change > 0 ? "faster" : "slower"}
                </b>{" "}
                than {month(speed.first_intake)}
              </>
            )
          }
        />
        <Tile
          i={2}
          label="Manager onboarding steps"
          value={steps ? <Num value={pct(steps.done, steps.of)} after="%" /> : "–"}
          viz={steps ? <Ring share={steps.done / steps.of} label={`${steps.done} of ${steps.of} done`} /> : null}
          base={steps ? `${steps.done} of ${steps.of} done` : "Not enough people yet"}
        />
        <Tile
          i={3}
          label="Fixes that worked"
          value={measured.length ? `${worked} of ${measured.length}` : "–"}
          viz={
            fixes.length ? (
              <div role="img" aria-label={`${worked} worked, ${measured.length - worked} no clear change, ${tooEarly} too early`} className="flex gap-1 pb-1.5">
                {[...measured.filter((f) => f.result === "worked"), ...measured.filter((f) => f.result !== "worked"), ...fixes.filter((f) => f.result === "too_early")].map((f, i) => (
                  <span
                    key={f.id}
                    className={`sp-dot box-border h-4 w-4 rounded-[3px]${f.result === "too_early" ? " sp-bar-hatch" : ""}`}
                    style={{ ...(f.result === "worked" ? { background: "var(--fixes)" } : f.result === "no_clear_change" ? { border: "2px solid var(--line-strong)" } : {}), ...delay(300 + i * 120) }}
                  />
                ))}
              </div>
            ) : null
          }
          base={measured.length ? `measured${tooEarly ? ` · ${tooEarly} too early to tell` : ""}` : "No fix measured yet"}
        />
      </div>

      <Reveal>
        <Fixes impact={impact.data} />
      </Reveal>

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(360px, 100%), 1fr))" }}>
        <Reveal className="flex">
          <Reasons leavers={impact.data.leavers} />
        </Reveal>
        <Reveal className="flex" wait={100}>
          <Speed timed={timed} />
        </Reveal>
      </div>

      <Reveal>
        <Intakes impact={impact.data} shareDone={shareDone} />
      </Reveal>

      <Reveal>
        <Quality quality={quality.data} />
      </Reveal>
    </div>
  );
}
