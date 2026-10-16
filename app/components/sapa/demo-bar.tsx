"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { ApiError, apiSend, useApi } from "./data";
import { Button, Dialog } from "./ui";

type Reach = { reachable: boolean; ms: number };
type Status = {
  live_hire: { day: number; next_check_in: { touchpoint: number; due_at: string } | null };
  main_ai: Reach;
  fallback_ai: Reach & { spend: number; cap: number };
  ai_checked_at: string;
  telegram: { reachable: boolean; webhook_set: boolean; pending_updates: number; last_error: string | null; last_update_at: string | null };
  phones: { live_hire_bound: boolean; demo_manager_bound: boolean };
};

function Light({ ok, label, title }: { ok: boolean; label: string; title: string }) {
  return (
    <span className="inline-flex items-center gap-1" title={title}>
      <span className="inline-block h-2 w-2" style={{ borderRadius: "var(--radius-round)", background: ok ? "var(--problems)" : "var(--serious)" }} aria-hidden="true" />
      {label}
      <span className="sr-only">{ok ? " OK" : " not OK"}</span>
    </span>
  );
}

export function DemoBar() {
  const status = useApi<Status>("/api/hr/demo/status", 10000);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [invite, setInvite] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setMessage(null);
    try {
      await action();
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : "Something went wrong");
    }
    setBusy(false);
  };
  const advance = (day: number) =>
    run(async () => {
      const result = await apiSend<{ sent: number }>("/api/hr/demo/advance", "POST", { day });
      setMessage(`Advanced to Day ${day}. ${result.sent} message${result.sent === 1 ? "" : "s"} sent.`);
    });
  const reset = () =>
    run(async () => {
      setConfirming(false);
      const result = await apiSend<{ join_link: string }>("/api/hr/demo/reset");
      setInvite(result.join_link);
      setMessage("Reset to seed.");
    });

  const s = status.data;
  return (
    <section aria-label="Demo controls" className="z-20 flex flex-col gap-1.5 px-4 py-2 text-[13px] md:sticky md:top-0 md:px-8" style={{ background: "var(--surface-raised)", borderBottom: "1px solid var(--line)" }}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="sp-num flex-auto text-[15px] font-bold md:flex-none">{s ? `Live hire: Day ${s.live_hire.day}` : "Live hire: …"}</span>
        <button type="button" className="sp-btn sp-btn-secondary sp-lane-ink md:hidden" aria-expanded={open} aria-controls="demo-controls" onClick={() => setOpen(!open)}>
          Demo controls
          <ChevronDown size={16} aria-hidden="true" className="sp-chev" style={{ transform: open ? "rotate(180deg)" : undefined }} />
        </button>
        <span id="demo-controls" className={`${open ? "flex" : "hidden"} w-full flex-wrap gap-2 md:flex md:w-auto`}>
          <Button variant="primary" disabled={busy} onClick={() => advance(14)}>Advance to Day 14</Button>
          <Button disabled={busy} onClick={() => advance(30)}>Advance to Day 30</Button>
          <Button disabled={busy} onClick={() => setConfirming(true)}>Reset to seed</Button>
        </span>
        {s ? (
          <span className={`${open ? "flex" : "hidden"} flex-wrap gap-3 md:ml-auto md:flex`}>
            <Light ok={s.main_ai.reachable} label="Main AI" title={s.main_ai.reachable ? `Reachable · ${(s.main_ai.ms / 1000).toFixed(1)} s` : "Not reachable"} />
            <Light ok={s.fallback_ai.reachable} label="Fallback AI" title={`$${s.fallback_ai.spend.toFixed(2)} of $${s.fallback_ai.cap.toFixed(2)} cap used`} />
            <Light ok={s.telegram.reachable && s.telegram.webhook_set} label="Telegram" title={s.telegram.last_error ?? (s.telegram.webhook_set ? "Webhook OK" : "Webhook not set")} />
            <Light ok={s.phones.live_hire_bound && s.phones.demo_manager_bound} label="Phones" title={`Live hire ${s.phones.live_hire_bound ? "bound" : "not bound"} · Manager ${s.phones.demo_manager_bound ? "bound" : "not bound"}`} />
          </span>
        ) : status.error ? <span className="sp-caption md:ml-auto">Status not available</span> : null}
      </div>
      {message || invite ? (
        <div className="flex flex-col gap-0.5" aria-live="polite">
          {message ? <span className="font-semibold">{message}</span> : null}
          {invite ? (
            <span>
              New join link for the intake: <a href={invite} className="break-all">{invite}</a>
            </span>
          ) : null}
        </div>
      ) : null}
      {confirming ? (
        <Dialog title="Reset to seed?" onClose={() => setConfirming(false)}>
          <p className="m-0 text-[14px] leading-[21px]">This erases everything done in the demo so far and loads the seed again. The intake gets a new join link.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={reset}>Reset to seed</Button>
            <Button onClick={() => setConfirming(false)}>Cancel</Button>
          </div>
        </Dialog>
      ) : null}
    </section>
  );
}
