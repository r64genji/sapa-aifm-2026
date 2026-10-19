"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { ApiError, apiSend, useApi } from "./data";
import { Button, Dialog } from "./ui";

type Reach = { reachable: boolean; ms: number };
type Status = {
  live_hire: { next_check_in: { touchpoint: number; due_at: string } | null; scheduled: number[] };
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
  const [confirming, setConfirming] = useState<"seed" | "full" | null>(null);
  const [invite, setInvite] = useState<{ team: string; link: string }[]>([]);
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
  const outreach = () =>
    run(async () => {
      const result = await apiSend<{ sent: number }>("/api/hr/demo/outreach", "POST", { touchpoint: next?.touchpoint });
      setMessage(`${result.sent} message${result.sent === 1 ? "" : "s"} sent.`);
    });
  const reset = (full: boolean) =>
    run(async () => {
      setConfirming(null);
      const result = await apiSend<{ team_links: { team: string; link: string }[] }>("/api/hr/demo/reset", "POST", { full });
      setInvite(result.team_links);
      setMessage(full ? "Full reset done. All phones are unlinked." : "Reset to seed.");
    });

  const s = status.data;
  const next = s?.live_hire.next_check_in;
  return (
    <section aria-label="Demo controls" className="z-20 flex flex-col gap-1.5 px-4 py-2 text-[13px] md:sticky md:top-0 md:px-8" style={{ background: "var(--surface-raised)", borderBottom: "1px solid var(--line)" }}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="flex flex-auto flex-col md:flex-none">
          <span className="sp-num text-[15px] font-bold">{next ? `Next: Day ${next.touchpoint} check-in` : s && !s.phones.live_hire_bound ? "No hire has joined yet" : "No check-in left"}</span>
        </span>
        <button type="button" className="sp-btn sp-btn-secondary sp-lane-ink md:hidden" aria-expanded={open} aria-controls="demo-controls" onClick={() => setOpen(!open)}>
          Demo controls
          <ChevronDown size={16} aria-hidden="true" className="sp-chev" style={{ transform: open ? "rotate(180deg)" : undefined }} />
        </button>
        <span id="demo-controls" className={`${open ? "flex" : "hidden"} w-full flex-wrap gap-2 md:flex md:w-auto`}>
          <Button variant="primary" disabled={busy || !next} onClick={outreach}>Outreach now</Button>
          <Button disabled={busy} onClick={() => setConfirming("seed")}>Reset to seed</Button>
          <Button disabled={busy} onClick={() => setConfirming("full")}>Full reset</Button>
        </span>
        {s ? (
          <span className={`${open ? "flex" : "hidden"} flex-wrap gap-3 md:ml-auto md:flex`}>
            <Light ok={s.main_ai.reachable} label="AI (main)" title={s.main_ai.reachable ? `Reachable · ${(s.main_ai.ms / 1000).toFixed(1)} s` : "Not reachable"} />
            <Light ok={s.fallback_ai.reachable} label="AI (backup)" title={`$${s.fallback_ai.spend.toFixed(2)} of $${s.fallback_ai.cap.toFixed(2)} spending limit used`} />
            <Light ok={s.telegram.reachable && s.telegram.webhook_set} label="Telegram" title={s.telegram.last_error ?? (s.telegram.webhook_set ? "Telegram link OK" : "Telegram link not set up")} />
            <Light ok={s.phones.live_hire_bound && s.phones.demo_manager_bound} label="Linked phones" title={`Live hire ${s.phones.live_hire_bound ? "bound" : "not bound"} · Manager ${s.phones.demo_manager_bound ? "bound" : "not bound"}`} />
          </span>
        ) : status.error ? <span className="sp-caption md:ml-auto">Status not available</span> : null}
      </div>
      {message || invite.length ? (
        <div className="flex flex-col gap-0.5" aria-live="polite">
          <span className="flex items-center gap-2">
            {message ? <span className="font-semibold">{message}</span> : null}
            <button type="button" className="sp-btn sp-btn-secondary" onClick={() => { setMessage(null); setInvite([]); }}>Dismiss</button>
          </span>
          {invite.map((row) => (
            <span key={row.team}>
              {row.team}: <a href={row.link} className="break-all">{row.link}</a>
            </span>
          ))}
        </div>
      ) : null}
      {confirming ? (
        <Dialog title={confirming === "full" ? "Full reset?" : "Reset to seed?"} onClose={() => setConfirming(null)}>
          <p className="m-0 text-[14px] leading-[21px]">
            {confirming === "full"
              ? "This erases everything done in the demo so far and loads the seed again. It also unlinks every phone: the live hire and the team leads must join again with the new links."
              : "This erases everything done in the demo so far and loads the seed again. Linked phones stay linked: the live hire is back at the start, and team leads keep their link."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => reset(confirming === "full")}>{confirming === "full" ? "Full reset" : "Reset to seed"}</Button>
            <Button onClick={() => setConfirming(null)}>Cancel</Button>
          </div>
        </Dialog>
      ) : null}
    </section>
  );
}
