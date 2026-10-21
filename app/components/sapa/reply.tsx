"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import "./live.css";
import { Shield } from "lucide-react";
import { apiGet, apiSend } from "./data";
import { AiMark, Button, DRIVERS, Dialog, Quote, driverName, shortDate } from "./ui";

export type ReplyItem = {
  id: string;
  text: string | null;
  byline: string;
  created_at: string;
  status: "ok" | "awaiting_ai" | "needs_review" | "reviewed" | null;
  drivers: string[];
  context_tags: string[];
  evidence_quote: string | null;
  concern_level: string | null;
  escalate: boolean | null;
  changed_by_hr: boolean | null;
  counted?: boolean | null;
  note?: string | null;
  language?: string;
  serious?: boolean;
  confidence?: "low" | "medium" | "high" | null;
  log?: ChatEntry[];
};

export type ChatEntry = { from: "bot" | "new_hire"; kind: "fixed" | "ai" | "tap" | "text"; text: string; en?: string; echo?: string; score?: number };

export type ReplyChange = { drivers?: string[]; context_tags?: string[]; serious?: boolean };

export type ReplyRowProps = {
  fresh?: boolean;
  item: ReplyItem;
  onConfirm: () => Promise<unknown>;
  onChange: (change: ReplyChange) => Promise<unknown>;
  onRetry: () => Promise<unknown>;
  onUndo?: () => Promise<unknown>;
  chat?: boolean;
  whole?: boolean;
};

type Translated = { label: string; text: string };

const translations = new Map<string, Promise<Translated | null>>();

function translationOf(path: string) {
  let found = translations.get(path);
  if (!found) {
    found = apiGet<{ translation?: Translated | null }>(path)
      .then((data) => data.translation ?? null)
      .catch(() => null);
    translations.set(path, found);
    found.then((value) => value ?? translations.delete(path));
  }
  return found;
}

function useTranslated(path: string | null) {
  const [translated, setTranslated] = useState<Translated | null>(null);
  useEffect(() => {
    if (path) translationOf(path).then(setTranslated);
  }, [path]);
  return translated;
}

const textPath = (language: string | undefined, text: string) =>
  language && language !== "en" && text ? `/api/hr/translate?language=${language}&text=${encodeURIComponent(text)}` : null;

export function TranslatedQuote({ language, text, evidence, size }: { language?: string; text: string; evidence?: string | null; size?: "md" | "lg" }) {
  const [original, setOriginal] = useState(false);
  const translated = useTranslated(textPath(language, text));
  if (!translated) return <Quote text={text} evidence={evidence} size={size} />;
  return (
    <div className="flex flex-col gap-1.5">
      {original ? <Quote text={text} evidence={evidence} size={size} /> : <Quote text={translated.text} size={size} />}
      <button type="button" className="sp-link self-start text-[13px]" aria-pressed={original} onClick={() => setOriginal(!original)}>
        {original ? "Show translation" : "Show original"}
      </button>
    </div>
  );
}

function TranslatedText({ language, text, evidence }: { language?: string; text: string; evidence?: string | null }) {
  const [original, setOriginal] = useState(false);
  const translated = useTranslated(textPath(language, text));
  if (!translated) return <Marked text={text} evidence={evidence} />;
  return (
    <>
      {original ? <Marked text={text} evidence={evidence} /> : translated.text}
      <button type="button" className="sp-link sp-caption block pt-1" aria-pressed={original} onClick={() => setOriginal(!original)}>
        {original ? "Show translation" : "Show original"}
      </button>
    </>
  );
}

function Marked({ text, evidence }: { text: string; evidence?: string | null }) {
  const i = evidence ? text.indexOf(evidence) : -1;
  if (i < 0 || !evidence) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="sp-evidence">{evidence}</mark>
      {text.slice(i + evidence.length)}
    </>
  );
}

function Score({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={`${value} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className="h-1.5 w-1.5 rounded-full" style={{ background: n <= value ? (value <= 2 ? "var(--serious)" : "var(--problems)") : "var(--line)" }} />
      ))}
      <span className="ml-1 text-xs font-semibold tabular-nums">{value}/5</span>
    </span>
  );
}

function TapChip({ entry }: { entry: ChatEntry }) {
  return (
    <span
      className="inline-flex min-h-7 flex-none items-center gap-2 border px-2.5 text-[13px] font-semibold"
      style={{ borderRadius: "var(--radius-round)", borderColor: "var(--problems)", color: "var(--problems)", background: "var(--surface-raised)" }}
    >
      {entry.text}
      <Score value={entry.score ?? 0} />
    </span>
  );
}

export function ChatLog({ log, evidence, language }: { log: ChatEntry[]; evidence?: string | null; language?: string }) {
  const taps = log.flatMap((entry, i) => (entry.kind === "tap" && log[i - 1]?.from === "bot" ? [{ asked: log[i - 1], tap: entry }] : []));
  const chat = log.filter((entry, i) => entry.kind !== "tap" && log[i + 1]?.kind !== "tap");
  return (
    <div className="flex flex-col gap-3">
      {taps.length ? (
        <ol className="m-0 flex list-none flex-col p-0" aria-label="Taps" style={{ borderRadius: "var(--radius-control)", border: "1px solid var(--line-soft)" }}>
          {taps.map(({ asked, tap }, i) => (
            <li key={i} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2" style={i ? { borderTop: "1px solid var(--line-soft)" } : undefined}>
              <span className="min-w-0 flex-[1_1_220px] text-sm leading-5">
                {asked.text}
                {asked.en ? <span className="sp-caption block">{asked.en}</span> : null}
              </span>
              <span className="flex flex-col items-end">
                <TapChip entry={tap} />
                {tap.en ? <span className="sp-caption">{tap.en}</span> : null}
              </span>
            </li>
          ))}
        </ol>
      ) : null}
      <ol className="m-0 flex list-none flex-col gap-2 p-0" aria-label="Check-in chat">
        {chat.map((entry, i) => {
          const bot = entry.from === "bot";
          return (
            <li key={i} className={`flex max-w-[85%] flex-col gap-1 ${bot ? "self-start items-start" : "self-end items-end"}`}>
              {bot ? (
                <span className="sp-caption inline-flex items-center gap-1.5">
                  {entry.kind === "ai" ? <span className="sp-ai-tag">AI</span> : null}
                  {entry.kind === "ai" ? "AI follow-up question" : "Fixed question"}
                </span>
              ) : null}
              <span
                className="block whitespace-pre-wrap px-3.5 py-2.5 text-[15px] leading-[22px]"
                style={{
                  overflowWrap: "anywhere",
                  borderRadius: bot ? "14px 14px 14px 4px" : "14px 14px 4px 14px",
                  background: bot ? (entry.kind === "ai" ? "var(--ai-soft)" : "var(--surface-sunken)") : "var(--problems-soft)",
                }}
              >
                {entry.echo ? <span className="sp-caption block pb-1">{entry.echo}</span> : null}
                {bot && entry.kind !== "ai" ? entry.text : <TranslatedText language={language} text={entry.text} evidence={bot ? null : evidence} />}
                {entry.en ? <span className="sp-caption block pt-1">English: {entry.en}</span> : null}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export const labelOf = (item: Pick<ReplyItem, "drivers" | "context_tags">) => {
  const names = [...item.drivers.map(driverName), ...item.context_tags.map(driverName)];
  return names.length ? names.join(", ") : "Nothing to act on";
};

function ChangeDialog({ item, onPick, onClose }: { item: ReplyItem; onPick: (change: ReplyChange) => void; onClose: () => void }) {
  const only = item.drivers.length === 1 ? item.drivers[0] : null;
  return (
    <Dialog title="Pick the right label" onClose={onClose}>
      <div className="rounded-lg p-3" style={{ background: "var(--surface-sunken)" }}>
        <TranslatedQuote language={item.language} text={item.text ?? ""} />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {Object.entries(DRIVERS)
          .filter(([key]) => key !== only)
          .map(([key, name]) => (
            <Button key={key} className="justify-start" onClick={() => onPick({ drivers: [key] })}>
              {name}
            </Button>
          ))}
        <Button className="justify-start" onClick={() => onPick({ drivers: [], context_tags: [] })}>
          Nothing to act on
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t pt-3" style={{ borderColor: "var(--line-soft)" }}>
        <Button lane="serious" onClick={() => onPick({ serious: true, ...(item.status === "awaiting_ai" && { drivers: [] }) })}>
          <Shield size={15} strokeWidth={2} aria-hidden="true" />
          It is a serious concern
        </Button>
        <Button className="ml-auto" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Dialog>
  );
}

export function ReplyRow({ item, onConfirm, onChange, onRetry, onUndo, chat, fresh, whole: full }: ReplyRowProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const [whole, setWhole] = useState(!!full || !item.text);
  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };
  const tagged = item.status !== null;
  const reviewed = item.status === "reviewed";
  const awaiting = item.status === "awaiting_ai";
  const pending = item.status === "needs_review" || (item.status === "ok" && (!!item.note || item.counted === false));
  const caption = item.serious || reviewed ? "Your label" : awaiting || pending ? null : "Counted automatically";
  const confidence = reviewed || awaiting || item.serious || !tagged ? null : item.confidence ?? (item.status === "needs_review" ? "low" : null);
  const state = reviewed ? (item.changed_by_hr ? "corrected" : "confirmed") : item.status === "needs_review" ? "unsure" : "suggested";

  return (
    <article className={`sp-card flex flex-wrap overflow-hidden${fresh ? " sp-swipe-in" : ""}`}>
      <div className="flex min-w-0 flex-[999_1_360px] flex-col gap-3 px-5 py-5 sm:px-6">
        <span className="sp-caption">
          {item.byline} · {shortDate(item.created_at)}
        </span>
        {chat && item.log && whole ? <ChatLog log={item.log} evidence={item.evidence_quote} language={item.language} /> : <TranslatedQuote language={item.language} text={item.text ?? ""} evidence={item.evidence_quote} />}
        {chat && item.log ? (
          <button type="button" className="sp-link self-start text-[13px]" aria-expanded={whole} onClick={() => setWhole(!whole)}>
            {whole ? "Show only their words" : "Show the whole check-in"}
          </button>
        ) : null}
      </div>
      <div
        className="box-border flex min-w-0 flex-[1_1_260px] flex-col justify-between gap-4 border-l px-5 py-5 sm:px-6"
        style={{ background: "var(--surface-sunken)", borderColor: "var(--line-soft)" }}
      >
        <div className="flex flex-col gap-1.5">
          {tagged && caption ? <span className="sp-caption" style={{ fontWeight: 600 }}>{caption}</span> : null}
          {!tagged ? (
            <span className="sp-muted">No label</span>
          ) : item.serious ? (
            <AiMark state="confirmed" label="Sent to serious concerns" reviewer="HR" />
          ) : awaiting ? (
            <span className="text-[15px] font-semibold">Awaiting AI</span>
          ) : (
            <AiMark state={state} label={labelOf(item)} reviewer="HR" />
          )}
          {confidence ? (
            <span className={`sp-confidence sp-confidence-${confidence}`}>
              {{ low: "AI not sure", medium: "AI fairly sure", high: "AI sure" }[confidence]}
            </span>
          ) : null}
          {chat && item.evidence_quote ? (
            <div className="flex flex-col gap-1 pt-2">
              <span className="sp-caption" style={{ fontWeight: 600 }}>Original quote</span>
              <TranslatedQuote language={item.language} text={item.evidence_quote} evidence={item.evidence_quote} />
            </div>
          ) : null}
        </div>
        <div className="flex gap-2">
          {pending ? (
            <Button variant="primary" disabled={busy} onClick={() => run(onConfirm)}>
              Confirm label
            </Button>
          ) : null}
          {awaiting ? (
            <Button variant="primary" disabled={busy} onClick={() => setOpen(true)}>
              Pick label
            </Button>
          ) : tagged && !item.serious && !item.escalate ? (
            <Button disabled={busy} onClick={() => setOpen(true)}>
              Change
            </Button>
          ) : null}
          {item.drivers.length && !item.serious && !item.escalate ? (
            <Button
              disabled={busy}
              onClick={() =>
                run(async () => {
                  const { id } = await apiSend<{ id: string }>("/api/hr/actions", "POST", { driver: item.drivers[0], response_id: item.id });
                  router.push(`/fixes/new?id=${id}`);
                })
              }
            >
              Send to their manager
            </Button>
          ) : null}
          {awaiting ? (
            <Button disabled={busy} onClick={() => run(onRetry)}>
              Try AI again
            </Button>
          ) : null}
          {onUndo ? (
            <Button disabled={busy || item.serious} why={item.serious ? "Already sent to Serious concerns" : null} onClick={() => run(onUndo)}>
              Undo
            </Button>
          ) : null}
        </div>
      </div>
      {open ? (
        <ChangeDialog
          item={item}
          onClose={() => setOpen(false)}
          onPick={(change) => {
            setOpen(false);
            run(() => onChange(change));
          }}
        />
      ) : null}
    </article>
  );
}
