"use client";

import { useState } from "react";
import { Shield } from "lucide-react";
import { useApi } from "./data";
import { AiMark, Button, DRIVERS, Dialog, Quote, dayLabel, driverName, shortDate } from "./ui";

export type ReplyItem = {
  id: string;
  text: string | null;
  touchpoint: number | null;
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
};

export type ReplyChange = { drivers?: string[]; context_tags?: string[]; serious?: boolean };

export type ReplyRowProps = {
  item: ReplyItem;
  onConfirm: () => Promise<unknown>;
  onChange: (change: ReplyChange) => Promise<unknown>;
  onRetry: () => Promise<unknown>;
  onFollowUp: (value: boolean) => Promise<unknown>;
  onUndo?: () => Promise<unknown>;
};

export function Translation({ id, language }: { id: string; language?: string }) {
  const { data } = useApi<{ translation?: { label: string; text: string } | null }>(language === "zh" ? `/api/hr/replies/${id}/translation` : null, 0);
  if (!data?.translation) return null;
  return (
    <p className="m-0 sp-ai-voice sp-muted">
      <AiMark label={data.translation.label} /> {data.translation.text}
    </p>
  );
}

export const labelOf = (item: Pick<ReplyItem, "drivers" | "context_tags">) => {
  const names = [...item.drivers.map(driverName), ...item.context_tags.map(driverName)];
  return names.length ? names.join(", ") : "Nothing to act on";
};

const whyHere = (item: ReplyItem) =>
  item.note ??
  (item.status === "awaiting_ai"
    ? "AI could not read it"
    : item.status === "needs_review"
      ? "AI not sure"
      : item.escalate
        ? "Flagged as a serious concern"
        : item.concern_level === "needs_follow_up"
          ? "Needs follow-up"
          : null);

function ChangeDialog({ item, onPick, onClose }: { item: ReplyItem; onPick: (change: ReplyChange) => void; onClose: () => void }) {
  const only = item.drivers.length === 1 ? item.drivers[0] : null;
  return (
    <Dialog title="Pick the right label" onClose={onClose}>
      <div className="rounded-lg p-3" style={{ background: "var(--surface-sunken)" }}>
        <Quote text={item.text ?? ""} />
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

export function ReplyRow({ item, onConfirm, onChange, onRetry, onFollowUp, onUndo }: ReplyRowProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };
  const why = whyHere(item);
  const tagged = item.status !== null;
  const reviewed = item.status === "reviewed";
  const awaiting = item.status === "awaiting_ai";
  const pending = item.status === "needs_review" || (item.status === "ok" && (!!item.note || item.counted === false));
  const followUp = item.concern_level === "needs_follow_up";
  const caption = item.serious ? "Your label" : reviewed ? "Your label" : awaiting ? "AI label" : pending ? "AI label" : "Counted automatically";
  const state = reviewed ? (item.changed_by_hr ? "corrected" : "confirmed") : item.status === "needs_review" ? "unsure" : "suggested";

  return (
    <article className="sp-card flex flex-wrap overflow-hidden">
      <div className="flex min-w-0 flex-[999_1_360px] flex-col gap-3 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {why && !reviewed ? (
            <span
              className="inline-flex min-h-6 items-center px-2 text-xs font-semibold"
              style={{ borderRadius: "var(--radius-tag)", background: awaiting || item.note ? "var(--waiting-soft)" : "var(--surface-sunken)", color: awaiting || item.note ? "var(--waiting-ink)" : "var(--ink)" }}
            >
              {why}
            </span>
          ) : null}
          <span className="sp-caption">
            {item.touchpoint !== null ? `${dayLabel(item.touchpoint)} · ` : ""}{shortDate(item.created_at)}
          </span>
        </div>
        <Quote text={item.text ?? ""} evidence={item.evidence_quote} />
        <Translation id={item.id} language={item.language} />
      </div>
      <div
        className="box-border flex min-w-0 flex-[1_1_260px] flex-col justify-between gap-4 border-l px-5 py-5 sm:px-6"
        style={{ background: "var(--surface-sunken)", borderColor: "var(--line-soft)" }}
      >
        <div className="flex flex-col gap-1.5">
          {tagged ? <span className="sp-caption" style={{ fontWeight: 600 }}>{caption}</span> : null}
          {!tagged ? (
            <span className="sp-muted">No label</span>
          ) : item.serious ? (
            <AiMark state="confirmed" label="Sent to serious concerns" reviewer="HR" />
          ) : awaiting ? (
            <span className="text-[15px] font-semibold">Awaiting AI</span>
          ) : (
            <AiMark state={state} label={labelOf(item)} reviewer="HR" />
          )}
          {item.status === "needs_review" ? <span className="sp-caption">AI is not sure</span> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {pending ? (
            <Button variant="primary" disabled={busy} onClick={() => run(onConfirm)}>
              Correct
            </Button>
          ) : null}
          {awaiting ? (
            <Button variant="primary" disabled={busy} onClick={() => setOpen(true)}>
              Pick label
            </Button>
          ) : tagged && !item.serious ? (
            <Button disabled={busy} onClick={() => setOpen(true)}>
              Change
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
          {tagged ? (
            <button type="button" className="sp-btn sp-btn-secondary sp-lane-ink" aria-pressed={followUp} disabled={busy} onClick={() => run(() => onFollowUp(!followUp))} style={followUp ? { background: "var(--waiting-soft)", color: "var(--waiting-ink)", borderColor: "var(--waiting)" } : undefined}>
              Needs follow-up{followUp ? ": on" : ""}
            </button>
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
