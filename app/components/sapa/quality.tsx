"use client";

import { ChevronDown } from "lucide-react";
import { useApi } from "./data";
import { LaneIcon, Waiting, driverName } from "./ui";

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
const pct = (part: number, whole: number) => Math.round((part / whole) * 100);

export function QualityWatch() {
  const quality = useApi<Quality[]>("/api/hr/quality").data;
  if (!quality) return null;
  const byLanguage = new Map<string, { checks: number; changed: number; evaluated: boolean }>();
  for (const q of quality) {
    const entry = byLanguage.get(q.language) ?? { checks: 0, changed: 0, evaluated: true };
    byLanguage.set(q.language, { checks: entry.checks + q.spot_checks, changed: entry.changed + q.changed, evaluated: entry.evaluated && q.evaluated });
  }
  const languages = [...byLanguage.entries()].sort(([a], [b]) => (a === "ms" ? -1 : b === "ms" ? 1 : a.localeCompare(b)));
  const checks = quality.reduce((sum, q) => sum + q.spot_checks, 0);
  const changed = quality.reduce((sum, q) => sum + q.changed, 0);
  const waiting = quality.filter((q) => q.evaluated && q.driver && q.state === "held");
  return (
    <details className="sp-card sp-fold overflow-hidden">
      <summary className="flex min-h-[52px] cursor-pointer flex-wrap items-center gap-3 px-[18px] py-1.5">
        <div className="sp-icontile sp-lane-ai">
          <LaneIcon lane="ai" />
        </div>
        <span className="grow text-[15px] font-bold leading-5">How well is the AI labelling?</span>
        <span className="sp-num text-[13px] font-bold" style={{ color: "var(--ai)" }}>
          {checks ? `${checks - changed} of ${checks} AI labels kept by HR · last 30 days` : "No spot checks in the last 30 days"}
        </span>
        <ChevronDown size={18} className="sp-chev sp-muted" aria-hidden="true" />
      </summary>
      <div className="sp-open flex flex-col gap-3.5 border-t px-[18px] pb-[18px] pt-3.5" style={{ borderColor: "var(--line)" }}>
        <div aria-hidden="true" className="flex flex-wrap gap-4 text-xs font-semibold sp-muted">
          <span className="flex-[1_1_180px]">Language</span>
          <span className="flex-[2_1_240px]">Random checks where HR agreed with the AI&apos;s label</span>
        </div>
        {languages.map(([language, q], i) => (
          <div key={language} className="flex flex-wrap items-center gap-4">
            <span className="flex-[1_1_180px] font-semibold">{LANGUAGES[language] ?? language}</span>
            <div className="flex flex-[2_1_240px] items-center gap-2.5">
              {q.evaluated && q.checks ? (
                <>
                  <div role="img" aria-label={`${q.checks - q.changed} of ${q.checks} kept`} data-tip={`${q.checks - q.changed} of ${q.checks} kept (${pct(q.checks - q.changed, q.checks)}%), ${q.changed} changed`} className="h-2.5 grow overflow-hidden rounded-[5px]" style={{ background: "var(--track-empty)" }}>
                    <div className="sp-grow-x h-full" style={{ width: `${pct(q.checks - q.changed, q.checks)}%`, background: "var(--ai)", animationDelay: `${i * 120}ms` }} />
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
                <Waiting>Held</Waiting>
                <span className="font-semibold">
                  {driverName(q.driver!)} · {LANGUAGES[q.language] ?? q.language}
                </span>
                <span className="sp-muted">{q.reason ?? "New labels wait for HR"}</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </details>
  );
}
