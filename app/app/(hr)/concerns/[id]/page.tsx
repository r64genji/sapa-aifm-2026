"use client";

import Link from "next/link";
import { use, useState } from "react";
import { Check, ChevronLeft, Lock, PhoneCall, PhoneOff, Search, Shield, Users } from "lucide-react";
import { ClockChip, LEGAL, SOURCES, categoryName, contactedAt, type Concern } from "@/components/sapa/concerns";
import { ApiError, apiSend, useApi } from "@/components/sapa/data";
import { Button, Card, Loading, Quote, dayLabel } from "@/components/sapa/ui";

type Case = Concern & {
  team: string;
  code_name: string;
  role: string;
  start_date: string;
  contact_method: "call" | "meet" | null;
  phone: string | null;
  not_serious: boolean;
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

const started = (date: string) =>
  new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kuala_Lumpur" });

const time = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kuala_Lumpur" });

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: c, error } = useApi<Case>(`/api/hr/escalations/${id}`, 0);
  const [kind, setKind] = useState("acted");
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
  const steps = ["Read", "Acknowledge", "Contact", "Close"];
  const done = [true, !!c.acknowledged_at, contacted, !!c.closed_at];
  const reach = c.dont_contact
    ? { Icon: PhoneOff, head: "Do not contact", sub: "Their choice" }
    : c.contact_method === "call"
      ? { Icon: PhoneCall, head: c.phone ?? "Wants a call", sub: c.phone ? "Call them" : "No number shared yet" }
      : c.contact_method === "meet"
        ? { Icon: Users, head: "Meet in person", sub: "Their choice" }
        : { Icon: Search, head: c.code_name, sub: "No choice yet. Find them in your records." };
  const notSerious = kind === "not_serious";
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
        <p className="m-0 text-[15px]">
          <span className="font-semibold">{c.code_name}</span>
          <span className="sp-muted"> · {c.role} · started {started(c.start_date)}</span>
        </p>
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
            <ol className="m-0 flex list-none items-start p-0">
              {steps.map((label, i) => (
                <li key={label} className="flex flex-1 flex-col items-center gap-1.5 text-[13px]" style={{ fontWeight: i === current ? 700 : 500, color: i === current ? "var(--serious-ink)" : done[i] ? "var(--ink-muted)" : "var(--ink)" }}>
                  <span className="flex w-full items-center">
                    <span className="h-[3px] flex-1" style={{ background: i === 0 ? "transparent" : done[i] || i === current ? "var(--ink)" : "var(--track-empty)" }} />
                    <span
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-[13px] font-bold"
                      style={{ borderRadius: "var(--radius-round)", background: done[i] ? "var(--ink)" : i === current ? "var(--serious)" : "var(--track-empty)", color: done[i] || i === current ? "#fff" : "var(--ink)", boxShadow: i === current ? "0 0 0 4px var(--serious-soft)" : undefined }}
                    >
                      {done[i] ? <Check size={16} strokeWidth={3.5} aria-hidden="true" /> : i + 1}
                    </span>
                    <span className="h-[3px] flex-1" style={{ background: i === steps.length - 1 ? "transparent" : done[i + 1] || i + 1 === current ? "var(--ink)" : "var(--track-empty)" }} />
                  </span>
                  {label}
                </li>
              ))}
            </ol>

            {!c.closed_at ? (
              <div className="flex items-center gap-3 p-3" style={{ borderRadius: "var(--radius-control)", background: contacted ? "var(--surface-sunken)" : "var(--serious-soft)", border: `1px solid ${contacted ? "var(--line-soft)" : "var(--serious-line)"}` }}>
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center" style={{ borderRadius: "var(--radius-round)", background: contacted ? "var(--ink-muted)" : "var(--serious)", color: "#fff" }}>
                  <reach.Icon size={20} strokeWidth={2} aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-[17px] font-bold">{reach.head}</span>
                  <span className="text-[13px] sp-muted">{reach.sub}</span>
                </span>
              </div>
            ) : null}

            {!c.acknowledged_at ? (
              <div>
                <p className="m-0 mb-3 text-[13px] sp-muted">Tells the team HR is on it.</p>
                <Button variant="primary" lane="serious" onClick={() => act("acknowledge")}>
                  Acknowledge
                </Button>
              </div>
            ) : null}

            {c.acknowledged_at && !contacted ? (
              <div>
                <p className="m-0 mb-3 text-[13px] sp-muted">Reach them outside Sapa. Sapa does not pass messages.</p>
                <Button variant="primary" lane="serious" onClick={() => act("contact")}>
                  I contacted them
                </Button>
              </div>
            ) : null}

            {c.dont_contact && !c.closed_at ? (
              <p className="m-0 text-[13px] sp-muted">Some matters may still need HR to follow up.</p>
            ) : null}

            {contacted && !c.closed_at ? (
              <div className="flex flex-col gap-3">
                <fieldset className="m-0 flex flex-wrap gap-3 border-0 p-0">
                  <legend className="mb-2 p-0 font-semibold">What was it?</legend>
                  {[
                    ["acted", "Real concern", "You took action"],
                    ["not_serious", "False alarm", "Nothing to act on"],
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
                {c.can_send_closure ? (
                  <>
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
                      <Button variant="primary" lane="serious" onClick={() => act("close", { send_closure: true, not_serious: notSerious })}>
                        Close and send
                      </Button>
                      <Button onClick={() => act("close", { send_closure: false, not_serious: notSerious })}>Close without message</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="font-semibold">No closing message</div>
                      <div className="sp-muted">{REASON}</div>
                    </div>
                    <div>
                      <Button variant="primary" lane="serious" onClick={() => act("close", { send_closure: false, not_serious: notSerious })}>
                        Close
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : null}

            {c.closed_at ? (
              <div className="flex items-start gap-3">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center text-white" style={{ borderRadius: "var(--radius-round)", background: "var(--ink)" }}>
                  <Check size={16} strokeWidth={3} aria-hidden="true" />
                </span>
                <div className="flex flex-col">
                  <span className="font-bold">Case closed · {c.not_serious ? "False alarm" : "Real concern"}</span>
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
