"use client";

import { useApi } from "@/components/sapa/data";
import { Card, CountBar, driverName, Empty, LaneSection, Loading, PageHeader, Row, Waiting } from "@/components/sapa/ui";

type Retention = { enough: true; k: number; n: number; note: string } | { enough: false; message: string; note: string };
type Intake =
  | { intake: string; enough: false; message: string }
  | { intake: string; enough: true; hired: number | null; employed: number | null; response_rate: number; median_days_reply_to_done: number | null };
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
  day14: { answered: number; of: number } | null;
  speed: { median: number; first_intake: string; change: number } | null;
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
const STATES: Record<string, string> = {
  calibrating: "Calibrating: new labels wait for HR",
  trusted: "Counts without review",
  held: "Held: labels wait for HR",
};
const monthYear = (intake: string) => new Date(`${intake}-01`).toLocaleString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
const month = (intake: string) => new Date(`${intake}-01`).toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
const pct = (part: number, whole: number) => Math.round((part / whole) * 100);
const signed = (value: number) => `${value < 0 ? "-" : "+"}${Math.abs(value).toFixed(1)}`;
const RESULTS = { worked: "Worked", no_clear_change: "No clear change", too_early: "Too early" };

function Stat({ label, value, base }: { label: string; value: string; base: string }) {
  return (
    <Card>
      <h2 className="m-0 text-[13px] font-semibold leading-[18px] sp-muted">{label}</h2>
      <span className="sp-num text-[34px] font-bold leading-[34px]">{value}</span>
      <span className="sp-num sp-caption">{base}</span>
    </Card>
  );
}

function Scale({ before, after, tone }: { before: number; after: number; tone: string }) {
  const at = (value: number) => `${((Math.min(Math.max(value, 1), 5) - 1) / 4) * 100}%`;
  return (
    <div className="relative h-3 rounded-full" style={{ background: "var(--track-empty)" }} aria-hidden="true">
      <span className="absolute top-0 h-3 w-3 -translate-x-1/2 rounded-full border-2 box-border" style={{ left: at(before), borderColor: tone, background: "var(--surface-raised)" }} />
      <span className="absolute top-0 h-3 w-3 -translate-x-1/2 rounded-full" style={{ left: at(after), background: tone }} />
    </div>
  );
}

function FixRow({ fix }: { fix: Fix }) {
  const measured = fix.result !== "too_early";
  return (
    <Row
      title={fix.title}
      meta={measured ? `${driverName(fix.driver)} · Used ${fix.used} ${fix.used === 1 ? "time" : "times"}` : `${driverName(fix.driver)} · ${fix.evidence}`}
      metric={
        measured ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <Scale before={fix.with_fix.before} after={fix.with_fix.after} tone="var(--fixes)" />
              <Scale before={fix.others.before} after={fix.others.after} tone="var(--line-strong)" />
            </div>
            <div className="sp-num sp-caption">
              {fix.with_fix.before.toFixed(1)} → {fix.with_fix.after.toFixed(1)} teams with the fix ({fix.with_fix.n} people)
              <br />
              {fix.others.before.toFixed(1)} → {fix.others.after.toFixed(1)} other teams ({fix.others.n} people)
            </div>
          </div>
        ) : null
      }
      action={
        <div className="flex flex-col items-end gap-1 text-right">
          <span className="sp-num text-[17px] font-bold">{fix.difference === null ? "–" : signed(fix.difference)}</span>
          {fix.result === "too_early" ? <Waiting>Too early</Waiting> : <span className="text-[13px] font-semibold" style={{ color: fix.result === "worked" ? "var(--fixes)" : undefined }}>{RESULTS[fix.result]}</span>}
        </div>
      }
    />
  );
}

function Reasons({ leavers }: { leavers: Extract<Impact["leavers"], { enough: true }> }) {
  const drivers = [...new Set([...leavers.top_themes.map((t) => t.driver), ...leavers.top_reasons.map((r) => r.driver)])];
  const theme = (driver: string) => leavers.top_themes.find((t) => t.driver === driver);
  const reason = (driver: string) => leavers.top_reasons.find((r) => r.driver === driver);
  const topMatches = leavers.top_reasons[0] && leavers.top_themes[0] && leavers.top_reasons[0].driver === leavers.top_themes[0].driver;
  return (
    <div className="flex flex-col gap-3">
      {topMatches ? <span className="text-[13px] font-semibold" style={{ color: "var(--fixes)" }}>Top exit reason is also the top Day 14 theme: {driverName(leavers.top_reasons[0].driver)}</span> : null}
      {drivers.map((driver) => {
        const t = theme(driver);
        const r = reason(driver);
        return (
          <div key={driver} className="flex flex-col gap-1">
            <span className="text-[14px] font-semibold">{driverName(driver)}</span>
            <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
              {t ? <CountBar count={t.n} of={t.m} label="raised at Day 14" lane="problems" /> : <span className="sp-caption">Not raised at Day 14</span>}
              {r ? <CountBar count={r.n} of={leavers.total} label="leavers' reason" lane="fixes" /> : <span className="sp-caption">Not a leaver&apos;s reason</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Page() {
  const impact = useApi<Impact>("/api/hr/impact");
  const milestones = useApi<Milestone[]>("/api/hr/milestones");
  const quality = useApi<Quality[]>("/api/hr/quality");
  if (!impact.data || !milestones.data || !quality.data) return impact.error || milestones.error || quality.error ? <Empty title="Could not load Impact" sub="Try again in a moment." /> : <Loading />;
  const { retention, baseline, target, intakes, day14, speed, fixes, leavers } = impact.data;
  const shareDone = new Map(milestones.data.map((m) => [m.intake, m.share_done]));
  const timed = intakes.flatMap((i) => (i.enough && i.median_days_reply_to_done !== null ? [{ intake: i.intake, days: i.median_days_reply_to_done }] : []));
  const slowest = Math.max(...timed.map((t) => t.days), 1);
  const measured = fixes.filter((f) => f.result !== "too_early");
  const worked = measured.filter((f) => f.result === "worked").length;
  const tooEarly = fixes.length - measured.length;
  const steps = impact.data.milestone_steps;
  const period = intakes.length ? `${monthYear(intakes[0].intake)} – ${monthYear(intakes.at(-1)!.intake)} · ${intakes.length} intakes${retention.enough ? ` · ${retention.n} hired` : ""}` : null;
  const checks = quality.data.reduce((sum, q) => sum + q.spot_checks, 0);
  const changed = quality.data.reduce((sum, q) => sum + q.changed, 0);
  const untested = quality.data.filter((q) => !q.evaluated).map((q) => q.language);
  const watched = quality.data.filter((q) => q.evaluated && q.driver);
  const keptPct = retention.enough ? pct(retention.k, retention.n) : 0;
  const basePct = baseline ? pct(baseline.kept, baseline.of) : null;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Impact"
        sub="Groups of 5 or more only, so no one can be picked out. Serious concerns are never counted. No team or manager is ranked against another."
        right={period ? <span className="sp-num sp-caption rounded-lg border px-3 py-1.5 font-semibold" style={{ borderColor: "var(--line)", background: "var(--surface-raised)" }}>{period}</span> : undefined}
      />

      <Card title="Still employed at Month 6" meta="From HR's own hire and exit records. Everyone hired counts, whether or not they joined Sapa.">
        {retention.enough ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="sp-num text-[56px] font-bold leading-[56px]">{keptPct}%</span>
              {basePct !== null ? (
                <span className="sp-num rounded px-2 py-0.5 text-[13px] font-bold" style={{ background: "var(--fixes)", color: "var(--on-fixes)" }}>
                  {keptPct - basePct >= 0 ? "+" : "-"}{Math.abs(keptPct - basePct)} pts vs before
                </span>
              ) : null}
            </div>
            <span className="sp-num sp-meta">
              {retention.k} of {retention.n} new hires{baseline ? ` · before Sapa: ${baseline.kept} of ${baseline.of}` : ""} · target {target}%
            </span>
            <div role="img" aria-label={`${keptPct}% now${basePct !== null ? `. ${basePct}% before Sapa` : ""}. Target ${target}%.`} className="relative h-3.5 rounded-[7px]" style={{ background: "var(--track-empty)" }}>
              <div className="absolute inset-y-0 left-0 rounded-[7px]" style={{ width: `${keptPct}%`, background: "var(--fixes)" }} />
              {basePct !== null ? <div className="absolute -inset-y-1 w-0.5" style={{ left: `${basePct}%`, background: "var(--line-strong)" }} /> : null}
              <div className="absolute -inset-y-1 w-0.5" style={{ left: `${target}%`, background: "var(--ink)" }} />
            </div>
            <div className="sp-num relative h-4 text-xs font-semibold">
              {basePct !== null ? <span className="absolute sp-muted" style={{ left: `${basePct}%`, transform: "translateX(-90%)" }}>Before {basePct}%</span> : null}
              <span className="absolute" style={{ left: `${target}%`, transform: "translateX(-10%)" }}>Target {target}%</span>
            </div>
            <span className="text-[13px] font-semibold">{retention.note}</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <span className="text-[17px] font-bold">{retention.message}</span>
            <span className="text-[13px] font-semibold">{retention.note}</span>
          </div>
        )}
      </Card>

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <Stat label="Answered Day 14" value={day14 ? `${pct(day14.answered, day14.of)}%` : "–"} base={day14 ? `${day14.answered} of ${day14.of}` : "Not enough people yet"} />
        <Stat
          label="Reply to fix done"
          value={speed ? `${speed.median} days` : "–"}
          base={!speed ? "Not enough fixes yet" : speed.change === 0 ? "No change" : `${Math.abs(speed.change)} days ${speed.change > 0 ? "faster" : "slower"} than ${month(speed.first_intake)}`}
        />
        <Stat label="Manager onboarding steps" value={steps ? `${pct(steps.done, steps.of)}%` : "–"} base={steps ? `${steps.done} of ${steps.of} done` : "Not enough people yet"} />
        <Stat label="Fixes that worked" value={measured.length ? `${worked} of ${measured.length}` : "–"} base={measured.length ? `measured${tooEarly ? ` · ${tooEarly} too early` : ""}` : "No fix measured yet"} />
      </div>

      <LaneSection lane="fixes" title="Did each fix work?" meta="Same 1–5 check-in question before the fix and after the manager's note.">
        {fixes.length ? (
          <>
            {fixes.map((fix) => (
              <FixRow key={fix.id} fix={fix} />
            ))}
            <div className="sp-caption px-[18px] py-3" style={{ borderTop: "1px solid var(--line-soft)" }}>
              {impact.data.fixes_line} {impact.data.fixes_note}.
            </div>
          </>
        ) : (
          <div className="sp-muted px-[18px] py-4">No fix has been marked done yet.</div>
        )}
      </LaneSection>

      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        <Card title="Did Sapa spot the real reasons early?" meta="Leavers' answers never count in check-in themes.">
          {leavers.enough ? <Reasons leavers={leavers} /> : <CountBar notEnough />}
          {!leavers.enough ? <span className="sp-muted text-[13px]">{leavers.message}</span> : null}
        </Card>
        <Card title="Is the loop getting faster?" meta="Typical (median) days from a new hire's reply to the fix marked done, per intake.">
          {timed.length ? (
            <div className="flex flex-col gap-2" role="img" aria-label={`Days from reply to fix done: ${timed.map((t) => `${month(t.intake)} ${t.days}`).join(", ")}`}>
              {timed.map((t) => (
                <div key={t.intake} className="flex items-center gap-3">
                  <span className="sp-num w-10 text-xs font-semibold sp-muted">{month(t.intake)}</span>
                  <div className="h-3.5 flex-1 rounded-sm" style={{ background: "var(--track-empty)" }}>
                    <div className="h-full rounded-sm" style={{ width: `${(t.days / slowest) * 100}%`, background: "var(--fixes)" }} />
                  </div>
                  <span className="sp-num w-14 text-right text-[13px] font-bold">{t.days} days</span>
                </div>
              ))}
            </div>
          ) : (
            <CountBar notEnough />
          )}
        </Card>
      </div>

      <details className="sp-card">
        <summary className="flex cursor-pointer flex-wrap items-center gap-3 px-[18px] py-3 text-[15px] font-bold">
          Every intake, side by side
          <span className="sp-caption font-normal">{intakes.length} rows</span>
        </summary>
        <div className="overflow-x-auto px-[18px] pb-4">
          <table className="sp-num w-full min-w-[560px] border-collapse text-[13px]">
            <thead>
              <tr className="text-left sp-muted">
                <th scope="col" className="py-2 pr-3">Intake</th>
                <th scope="col" className="py-2 pr-3">Still employed Month 6</th>
                <th scope="col" className="py-2 pr-3">Replied to check-ins</th>
                <th scope="col" className="py-2 pr-3">Days to fix done</th>
                <th scope="col" className="py-2">Manager steps done</th>
              </tr>
            </thead>
            <tbody>
              {intakes.map((i) => {
                const share = shareDone.get(i.intake);
                return (
                  <tr key={i.intake} style={{ borderTop: "1px solid var(--line-soft)" }}>
                    <th scope="row" className="py-2 pr-3 text-left font-semibold">{monthYear(i.intake)}</th>
                    {i.enough ? (
                      <>
                        <td className="py-2 pr-3">{i.hired !== null ? `${i.employed} of ${i.hired}` : "Not entered yet"}</td>
                        <td className="py-2 pr-3">{pct(i.response_rate, 1)}%</td>
                        <td className="py-2 pr-3">{i.median_days_reply_to_done ?? "–"}</td>
                        <td className="py-2">{share === undefined ? "–" : `${pct(share, 1)}%`}</td>
                      </>
                    ) : (
                      <td colSpan={4} className="py-2 sp-muted">{i.message}</td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>

      <LaneSection lane="ai" title="AI quality watch" meta={checks ? `Last 30 days · HR changed ${changed} of ${checks} spot checks` : "Last 30 days · no spot checks yet"}>
        {untested.map((language) => (
          <Row key={language} muted title={LANGUAGES[language] ?? language} meta="Its test has not passed yet, so every label in this language waits for HR." metric={<span className="font-semibold">Not evaluated</span>} />
        ))}
        {watched.map((q) => (
          <Row
            key={`${q.driver}|${q.language}`}
            title={`${driverName(q.driver!)} · ${LANGUAGES[q.language] ?? q.language}`}
            meta={q.reason}
            metric={
              q.spot_checks ? (
                <CountBar count={q.changed} of={q.spot_checks} label="spot checks changed by HR" lane="problems" />
              ) : (
                <span className="sp-count-muted">No spot checks yet</span>
              )
            }
            action={q.state ? <span className="text-[13px] font-semibold">{q.state === "held" ? <Waiting>{STATES.held}</Waiting> : STATES[q.state]}</span> : null}
          />
        ))}
        {!untested.length && !watched.length ? <div className="sp-muted px-[18px] py-4">Nothing to watch yet.</div> : null}
      </LaneSection>
    </div>
  );
}
