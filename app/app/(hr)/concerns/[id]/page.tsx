"use client";

import Link from "next/link";
import { use, useState } from "react";
import { Check, ChevronLeft, Lock, Shield } from "lucide-react";
import { ClockChip, LEGAL, SOURCES, categoryName, contactedAt, type Concern } from "@/components/sapa/concerns";
import { ApiError, apiSend, useApi } from "@/components/sapa/data";
import { Button, Card, Loading, Quote, dayLabel } from "@/components/sapa/ui";

type Case = Concern & {
  text: string | null;
  language: string;
  closure_sent_at: string | null;
  can_send_closure: boolean;
  sent_by_bot: string[];
  closure: Record<string, string>;
  history: { text: string; at: string }[];
};

const LANGUAGES: Record<string, string> = { ms: "Bahasa Malaysia", en: "English", zh: "Chinese" };
const REASON = "This person is not receiving messages from Sapa now";

const time = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kuala_Lumpur" });

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: c, error } = useApi<Case>(`/api/hr/escalations/${id}`, 0);
  const [outcome, setOutcome] = useState<{ kind: string; note: string } | null>(null);
  const [kind, setKind] = useState("acted");
  const [note, setNote] = useState("");
  const [failed, setFailed] = useState<string | null>(null);

  if (error instanceof ApiError && error.status === 404) return <p className="sp-muted">This concern was not found.</p>;
  if (!c) return <Loading />;

  const act = async (path: string, body?: unknown) => {
    setFailed(null);
    try {
      await apiSend(`/api/hr/escalations/${id}/${path}`, "POST", body);
    } catch (e) {
      setFailed(e instanceof Error ? e.message : "Something went wrong");
    }
  };

  const contacted = !!contactedAt(c);
  const steps = ["Read", "Acknowledge", "Contact", "Outcome", "Close"];
  const done = [true, !!c.acknowledged_at, contacted, !!outcome || !!c.closed_at, !!c.closed_at];
  const current = done.findIndex((d) => !d);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link href="/concerns" className="inline-flex items-center gap-1 text-[13px] font-semibold no-underline" style={{ color: "var(--ink-muted)" }}>
          <ChevronLeft size={14} strokeWidth={2} aria-hidden="true" />
          All serious concerns
        </Link>
        <div className="inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: "var(--serious-ink)" }}>
          <Shield size={15} strokeWidth={2} aria-hidden="true" />
          Serious concern
        </div>
        <h1 className="sp-page-title">{categoryName(c.category)}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {c.closed_at ? (
            <span className="text-[13px] sp-muted">Closed {time(c.closed_at)}</span>
          ) : (
            <ClockChip c={c} />
          )}
          {c.category === "sexual_harassment" ? (
            <span className="inline-flex min-h-[22px] items-center px-2 text-xs font-semibold" style={{ borderRadius: "var(--radius-tag)", background: "var(--serious-soft)", color: "var(--serious-ink)" }}>
              {LEGAL}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5 text-[13px] sp-muted">
            <Lock size={14} strokeWidth={2} aria-hidden="true" />
            HR only
          </span>
        </div>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-col gap-6 lg:flex-[2_1_0]">
          <Card title="What they wrote">
            {c.text ? <Quote size="lg" text={c.text} /> : <p className="m-0 sp-muted">No text stored.</p>}
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

          <Card title="What to do">
            <ol className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0">
              {steps.map((label, i) => (
                <li key={label} className="flex items-center gap-2 text-[13px]" style={{ fontWeight: i === current ? 700 : 500, color: done[i] ? "var(--ink-muted)" : "var(--ink)" }}>
                  <span
                    className="inline-flex h-5 w-5 items-center justify-center text-[11px] font-bold"
                    style={{ borderRadius: "var(--radius-round)", background: done[i] ? "var(--ink)" : i === current ? "var(--serious)" : "var(--track-empty)", color: done[i] || i === current ? "#fff" : "var(--ink)" }}
                  >
                    {done[i] ? <Check size={12} strokeWidth={3.5} aria-hidden="true" /> : i + 1}
                  </span>
                  {label}
                </li>
              ))}
            </ol>

            {!c.acknowledged_at ? (
              <div>
                <p className="m-0 mb-3 sp-muted">You have read this. Acknowledging tells the team HR is on it.</p>
                <Button variant="primary" lane="serious" onClick={() => act("acknowledge")}>
                  Acknowledge
                </Button>
              </div>
            ) : null}

            {c.acknowledged_at && !contacted ? (
              <div>
                <p className="m-0 mb-1 font-semibold">Contact them outside Sapa</p>
                <p className="m-0 mb-3 sp-muted">Sapa does not pass messages between you and them. Call or meet them, then record it here.</p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" lane="serious" onClick={() => act("contact")}>
                    I contacted them
                  </Button>
                  <Button onClick={() => act("dont-contact")}>They asked not to be contacted</Button>
                </div>
              </div>
            ) : null}

            {c.dont_contact && !c.closed_at ? (
              <p className="m-0 sp-muted">Asked not to be contacted. For some matters HR may still need to follow up.</p>
            ) : null}

            {contacted && !outcome && !c.closed_at ? (
              <div className="flex flex-col gap-3">
                <fieldset className="m-0 flex flex-wrap gap-3 border-0 p-0">
                  <legend className="mb-2 p-0 font-semibold">What was it?</legend>
                  {[
                    ["acted", "A real concern", "You took action"],
                    ["not_serious", "Not serious", "A false alarm"],
                  ].map(([value, title, sub]) => (
                    <label key={value} className="flex flex-1 basis-[200px] cursor-pointer items-start gap-2.5 border p-3" style={{ borderRadius: "var(--radius-control)", borderColor: kind === value ? "var(--ink)" : "var(--line)" }}>
                      <input type="radio" name="kind" value={value} checked={kind === value} onChange={() => setKind(value)} className="mt-1" />
                      <span className="flex flex-col">
                        <span className="font-semibold">{title}</span>
                        <span className="text-[13px] sp-muted">{sub}</span>
                      </span>
                    </label>
                  ))}
                </fieldset>
                <label htmlFor="outcome" className="font-semibold">
                  What happened
                </label>
                <textarea id="outcome" rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What you found and what was done" className="sp-input" />
                <div>
                  <Button variant="primary" lane="serious" disabled={!note.trim()} why={!note.trim() ? "Write what happened first." : null} onClick={() => setOutcome({ kind, note })}>
                    Save outcome
                  </Button>
                </div>
              </div>
            ) : null}

            {outcome && !c.closed_at ? (
              c.can_send_closure ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2 p-3" style={{ borderRadius: "var(--radius-control)", background: "var(--surface-sunken)" }}>
                    <span className="text-[13px] font-semibold sp-muted">Message they get when you close</span>
                    <span style={{ whiteSpace: "pre-line" }}>{c.closure[c.language] ?? c.closure.en}</span>
                    {c.language !== "en" ? (
                      <details>
                        <summary className="cursor-pointer text-[13px] font-semibold">English</summary>
                        <div className="mt-1" style={{ whiteSpace: "pre-line" }}>{c.closure.en}</div>
                      </details>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary" lane="serious" onClick={() => act("close", { send_closure: true, not_serious: outcome?.kind === "not_serious" })}>
                      Close and send
                    </Button>
                    <Button onClick={() => act("close", { send_closure: false, not_serious: outcome?.kind === "not_serious" })}>Close without message</Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div>
                    <div className="font-semibold">No closing message</div>
                    <div className="sp-muted">{REASON}</div>
                  </div>
                  <div>
                    <Button variant="primary" lane="serious" onClick={() => act("close", { send_closure: false, not_serious: outcome?.kind === "not_serious" })}>
                      Close without message
                    </Button>
                  </div>
                </div>
              )
            ) : null}

            {c.closed_at ? (
              <div className="flex items-start gap-3">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center text-white" style={{ borderRadius: "var(--radius-round)", background: "var(--ink)" }}>
                  <Check size={16} strokeWidth={3} aria-hidden="true" />
                </span>
                <div className="flex flex-col">
                  <span className="font-bold">Case closed</span>
                  <span className="sp-muted">
                    {c.closure_sent_at ? "Closing message sent" : "No closing message"}
                  </span>
                </div>
              </div>
            ) : null}
            {failed ? <p className="m-0 text-[13px]" style={{ color: "var(--serious-ink)" }}>{failed}</p> : null}
          </Card>
        </div>

        <aside aria-label="Case details" className="flex min-w-0 flex-col gap-4 lg:flex-[1_1_0]">
          <Card title="Sapa already did">
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {["Sent them a safe reply with help lines", "Alerted HR", "Paused check-in messages", "Hid it from their manager", "Left it out of reports and exports"].map((t) => (
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
          <Card title="History">
            <ol className="m-0 flex list-none flex-col gap-2 p-0">
              {[...c.history].reverse().map((h, i) => (
                <li key={i} className="flex justify-between gap-3 text-[13px]">
                  <span>{h.text}</span>
                  <span className="sp-muted">{time(h.at)}</span>
                </li>
              ))}
            </ol>
          </Card>
        </aside>
      </div>
    </div>
  );
}
