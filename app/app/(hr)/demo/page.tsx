"use client";

import { useState } from "react";
import { ApiError, apiSend, useApi } from "@/components/sapa/data";
import { DEMO_SCRIPT, DEMO_SCRIPT_CAPTION, IF_SOMETHING_FAILS } from "@/components/sapa/demo-script";
import { Button, Card, Dialog, Empty, Loading, PageHeader, dayLabel } from "@/components/sapa/ui";

type Me = { role: string; demo_mode: boolean };
type Reach = { reachable: boolean; ms: number };
type Status = {
  live_hire: { day: number; next_check_in: { touchpoint: number; due_at: string } | null };
  main_ai: Reach;
  fallback_ai: Reach & { spend: number; cap: number };
  ai_checked_at: string;
  telegram: { reachable: boolean; webhook_set: boolean; pending_updates: number; last_error: string | null; last_update_at: string | null };
  phones: { live_hire_bound: boolean; demo_manager_bound: boolean };
};

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;
const ago = (iso: string | null) => {
  if (!iso) return "no update yet";
  const s = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000));
  return s < 60 ? `${s} s ago` : s < 3600 ? `${Math.round(s / 60)} min ago` : `${Math.round(s / 3600)} h ago`;
};

function StatusCard({ title, line, note }: { title: string; line: string; note?: string }) {
  return (
    <Card>
      <div className="flex flex-col gap-1">
        <span className="font-semibold">{title}</span>
        <p className="m-0 text-[14px] leading-[21px]">{line}</p>
        {note ? <span className="sp-caption">{note}</span> : null}
      </div>
    </Card>
  );
}

export default function Page() {
  const me = useApi<Me>("/api/hr/me");
  const allowed = me.data?.role === "hr_admin" && me.data.demo_mode;
  const status = useApi<Status>(allowed ? "/api/hr/demo/status" : null, 10000);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [invite, setInvite] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!me.data) return me.error ? <Empty title="Could not load" sub={me.error.message} /> : <Loading />;
  if (!allowed) {
    return (
      <>
        <PageHeader title="Demo controls" />
        <Empty title="Not available" sub={me.data.role !== "hr_admin" ? "Only an HR admin can use the demo controls." : "Demo mode is off for this organisation."} />
      </>
    );
  }

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
      const result = await apiSend<{ invite_link: string | null }>("/api/hr/demo/reset");
      setInvite(result.invite_link);
      setMessage("Reset to seed.");
    });

  const s = status.data;
  const next = s?.live_hire.next_check_in;
  return (
    <>
      <PageHeader
        title="Demo controls"
        sub="For the person driving the 2-minute demo. Only the live hire's phone receives messages. No message about a synthetic hire goes to anyone, and no manager nudges are sent."
      />
      <section className="sp-card flex flex-wrap items-center gap-5 p-[18px]">
        <div className="flex flex-col gap-1" style={{ flex: "1 1 260px" }}>
          <span className="text-[13px] font-semibold sp-muted">Live hire is on</span>
          <span className="sp-num text-[44px] font-bold leading-[48px]">{s ? `Day ${s.live_hire.day}` : "…"}</span>
          <span className="sp-caption">{s ? (next ? `Next check-in: ${dayLabel(next.touchpoint)}` : s.phones.live_hire_bound ? "No more check-ins scheduled" : "Check-ins start once the live hire opens the invite link and agrees") : ""}</span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button variant="primary" disabled={busy} onClick={() => advance(14)}>Advance to Day 14</Button>
          <Button disabled={busy} onClick={() => advance(30)}>Advance to Day 30</Button>
          <Button disabled={busy} onClick={() => setConfirming(true)}>Reset to seed</Button>
        </div>
        <div className="flex flex-col gap-1" style={{ flex: "1 1 100%" }} aria-live="polite">
          <span className="sp-caption">Advance moves the demo clock and sends what is due at once, ignoring working hours. Reset restores the seed in under 10 seconds.</span>
          {message ? <span className="text-[14px] font-semibold">{message}</span> : null}
          {invite ? (
            <span className="text-[14px]">
              New invite link for the live hire: <a href={invite} className="break-all">{invite}</a>
            </span>
          ) : null}
        </div>
      </section>
      {status.error ? <Empty title="Status not available" sub={status.error.message} /> : null}
      {s ? (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <StatusCard
            title="Main AI"
            line={s.main_ai.reachable ? `Reachable · ${seconds(s.main_ai.ms)}` : "Not reachable"}
            note={`Checked ${ago(s.ai_checked_at)}`}
          />
          <StatusCard
            title="Fallback AI"
            line={`${s.fallback_ai.reachable ? `Reachable · ${seconds(s.fallback_ai.ms)}` : "Not reachable"} · $${s.fallback_ai.spend.toFixed(2)} of $${s.fallback_ai.cap.toFixed(2)} cap used`}
          />
          <StatusCard
            title="Telegram bot"
            line={!s.telegram.reachable ? "Not reachable" : !s.telegram.webhook_set ? "Webhook not set" : `Webhook OK · last update ${ago(s.telegram.last_update_at)}`}
            note={s.telegram.last_error ?? (s.telegram.pending_updates ? `${s.telegram.pending_updates} updates waiting` : undefined)}
          />
          <StatusCard
            title="Phones"
            line={`Live hire ${s.phones.live_hire_bound ? "bound" : "not bound"} · Manager ${s.phones.demo_manager_bound ? "bound" : "not bound"}`}
          />
        </div>
      ) : null}
      <Card title="Demo script" meta={DEMO_SCRIPT_CAPTION}>
        <div className="overflow-x-auto">
          <table className="sp-table">
            <thead>
              <tr>
                <th scope="col">Beat</th>
                <th scope="col">Time</th>
                <th scope="col">What happens</th>
                <th scope="col">On screen</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_SCRIPT.map((row) => (
                <tr key={row.beat}>
                  <td>{row.beat}</td>
                  <td>{row.time}</td>
                  <td style={{ minWidth: 280 }}>{row.what}</td>
                  <td>{row.screen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="If something fails">
        <p className="m-0 text-[14px] leading-[21px]">{IF_SOMETHING_FAILS}</p>
      </Card>
      {confirming ? (
        <Dialog title="Reset to seed?" onClose={() => setConfirming(false)}>
          <p className="m-0 text-[14px] leading-[21px]">This erases everything done in the demo so far and loads the seed again. The live hire gets a new invite link.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={reset}>Reset to seed</Button>
            <Button onClick={() => setConfirming(false)}>Cancel</Button>
          </div>
        </Dialog>
      ) : null}
    </>
  );
}
