"use client";

import Link from "next/link";
import { use } from "react";
import { Check, ChevronLeft, Lock } from "lucide-react";
import { SENT_TO_COMPLAINTS, SOURCES, categoryName, type Concern } from "@/components/sapa/concerns";
import { ApiError, useApi } from "@/components/sapa/data";
import { TranslatedQuote } from "@/components/sapa/reply";
import { Card, Loading, dayLabel } from "@/components/sapa/ui";

type Case = Concern & {
  team: string;
  text: string | null;
  language: string;
  sent_by_bot: string[];
};

const LANGUAGES: Record<string, string> = { ms: "Bahasa Malaysia", en: "English", zh: "Chinese" };

const time = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kuala_Lumpur" });

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: c, error } = useApi<Case>(`/api/hr/escalations/${id}`, 0);

  if (error instanceof ApiError && error.status === 404) return <p className="sp-muted">This concern was not found.</p>;
  if (!c) return <Loading />;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link href="/concerns" className="inline-flex items-center gap-1 text-[13px] font-semibold no-underline" style={{ color: "var(--ink-muted)" }}>
          <ChevronLeft size={14} strokeWidth={2} aria-hidden="true" />
          Sent to Speak Up
        </Link>
        <h1 className="sp-page-title">{categoryName(c.category)}</h1>
        <p className="m-0 text-[15px]">
          <span className="font-semibold">A new hire</span>
          <span className="sp-muted"> · {c.team}{c.touchpoint !== null ? ` · ${dayLabel(c.touchpoint)}` : ""}</span>
        </p>
        <span className="inline-flex items-center gap-1.5 text-[13px] sp-muted">
          <Lock size={14} strokeWidth={2} aria-hidden="true" />
          HR only
        </span>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-col gap-6 lg:flex-[2_1_0]">
          <Card title="What they wrote">
            {c.text ? <TranslatedQuote language={c.language} text={c.text} size="lg" /> : <p className="m-0 sp-muted">No text stored.</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] sp-muted">
              <span>
                {c.team}
                {c.touchpoint !== null ? ` · ${dayLabel(c.touchpoint)} check-in` : ""}
              </span>
              <span>Sent {time(c.created_at)}</span>
              <span>Flagged by {SOURCES[c.source] ?? c.source}</span>
              <span>Written in {LANGUAGES[c.language] ?? c.language}</span>
            </div>
          </Card>
          <p className="m-0 sp-muted">{SENT_TO_COMPLAINTS}</p>
        </div>

        <aside aria-label="Case details" className="flex min-w-0 flex-col gap-4 lg:flex-[1_1_0]">
          <Card title="Sapa already did">
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {["Told them to report it through Contoh Speak Up", "Hid it from their manager", "Left it out of reports and exports"].map((t) => (
                <li key={t} className="flex items-start gap-2 text-[13px]">
                  <Check size={14} strokeWidth={3} aria-hidden="true" className="mt-0.5 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
            <details>
              <summary className="cursor-pointer text-[13px] font-semibold">What the bot sent them</summary>
              <div className="mt-2 flex flex-col gap-1 text-[13px]" style={{ whiteSpace: "pre-line" }}>
                {c.sent_by_bot.map((line, i) => (
                  <span key={i}>{line}</span>
                ))}
                <span className="sp-muted">Shown as the stored text, in {LANGUAGES[c.language] ?? c.language}.</span>
              </div>
            </details>
          </Card>
        </aside>
      </div>
    </div>
  );
}
