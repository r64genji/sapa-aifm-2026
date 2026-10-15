"use client";

import Link from "next/link";
import { useState } from "react";
import { useApi } from "@/components/sapa/data";
import { Button, Empty, FixTrack, Loading, PageHeader, Row, Tabs, Waiting, driverName, fixScope, shortDate } from "@/components/sapa/ui";

type Side = { n: number; before: number; after: number };
type Action = {
  id: string;
  driver: string;
  hiring_side: boolean;
  title: string;
  created_at: string;
  status: string;
  scope_type: "person" | "team" | "intake" | null;
  scope_team: string | null;
  scope_intake: string | null;
  scope_person: string | null;
  owner: string | null;
  held: boolean;
  due_on: string | null;
  alert_due_on: string | null;
  alert_sent_at: string | null;
  alert_label: string | null;
  done_at: string | null;
  dismissed_at: string | null;
  dismiss_reason: string | null;
  overdue: boolean;
  notice: { status: string; sent_count: number };
  score: { headline: string; detail: string | null } | null;
  result: { scope: Side; other: Side } | null;
};
type Impact = { typical_days_reply_to_done: number | null };
type Tab = "open" | "done" | "cancelled";

const signed = (side: Side) => `${side.after - side.before < 0 ? "-" : "+"}${Math.abs(side.after - side.before).toFixed(1)}`;

const stepOf = (a: Action) => (a.status === "draft" ? 1 : a.status === "assigned" ? 2 : a.status === "accepted" ? 3 : a.notice.status === "sent" ? 5 : 4);

function waitingText(a: Action) {
  if (a.overdue) return "Overdue";
  if (a.status === "assigned" && a.owner !== "HR") return a.alert_sent_at ? `Waiting for ${a.owner} to accept` : `${a.owner} gets it ${shortDate(a.alert_due_on)}`;
  return null;
}

export default function Page() {
  const [tab, setTab] = useState<Tab>("open");
  const actions = useApi<Action[]>("/api/hr/actions");
  const impact = useApi<Impact>("/api/hr/impact");
  if (!actions.data) return <Loading />;

  const all = actions.data;
  const open = all
    .filter((a) => ["draft", "assigned", "accepted"].includes(a.status))
    .sort((a, b) => (a.due_on ?? "9999").localeCompare(b.due_on ?? "9999") || a.created_at.localeCompare(b.created_at));
  const done = all.filter((a) => a.status === "done").sort((a, b) => (b.done_at ?? "").localeCompare(a.done_at ?? ""));
  const cancelled = all.filter((a) => a.status === "dismissed").sort((a, b) => (b.dismissed_at ?? "").localeCompare(a.dismissed_at ?? ""));
  const days = impact.data?.typical_days_reply_to_done;
  const tiles: [string | number, string][] = [
    [open.filter((a) => a.status === "draft").length, "Drafts waiting for you"],
    [open.filter((a) => a.status === "assigned" && a.owner !== "HR").length, "Waiting for a manager to accept"],
    [open.filter((a) => a.status !== "draft").length, "In progress"],
    [days == null ? "–" : `${days} ${days === 1 ? "day" : "days"}`, "Typical time from reply to fix done"],
  ];

  return (
    <>
      <PageHeader
        title="Fixes"
        sub="Each fix starts from a shared problem, goes to a manager or to hiring, and ends with a note to the new hires it covers."
        right={
          <div className="flex flex-wrap items-center gap-3">
            <Tabs
              label="Show"
              value={tab}
              onChange={setTab}
              items={[
                ["open", `Open · ${open.length}`],
                ["done", `Done · ${done.length}`],
                ["cancelled", `Cancelled · ${cancelled.length}`],
              ]}
            />
            <Button variant="primary" lane="fixes" href="/problems">
              New fix
            </Button>
          </div>
        }
      />
      <p className="sp-caption m-0">New fix opens Shared problems. A fix always starts from a problem area, never from one person.</p>

      {tab === "open" ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {tiles.map(([n, label]) => (
              <div key={label} className="sp-card flex flex-col gap-0.5 px-[18px] py-3.5">
                <span className="sp-num text-[22px] font-bold leading-7">{n}</span>
                <span className="sp-caption">{label}</span>
              </div>
            ))}
          </div>
          {open.length === 0 ? (
            <Empty title="No open fixes" sub="Start one from a shared problem." />
          ) : (
            <section className="sp-card" aria-label="Open fixes">
              {open.map((a) => {
                const waiting = waitingText(a);
                return (
                  <Row
                    key={a.id}
                    title={
                      <Link href={a.status === "draft" ? `/fixes/new?id=${a.id}` : `/fixes/${a.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                        {a.title}
                      </Link>
                    }
                    meta={`${a.hiring_side ? "Hiring" : driverName(a.driver)} · ${fixScope(a)}${a.alert_label ? ` · ${a.alert_label}` : ""}`}
                    metric={
                      <div className="flex flex-col gap-1.5">
                        <FixTrack step={stepOf(a)} />
                        <span className="text-[13px]">
                          {a.owner ?? "Not assigned"}
                          {a.due_on ? ` · due ${shortDate(a.due_on)}` : ""}
                        </span>
                        {waiting ? <Waiting>{waiting}</Waiting> : null}
                      </div>
                    }
                    action={
                      <Button href={a.status === "draft" ? `/fixes/new?id=${a.id}` : `/fixes/${a.id}`}>{a.status === "draft" ? "Open draft" : "Open"}</Button>
                    }
                  />
                );
              })}
            </section>
          )}
        </>
      ) : null}

      {tab === "done" ? (
        done.length === 0 ? (
          <Empty title="No fixes done yet" />
        ) : (
          <section className="sp-card" aria-label="Done fixes">
            <div className="sp-caption border-b px-[18px] py-3" style={{ borderColor: "var(--line-soft)" }}>
              Result: the same 1 to 5 question before and after, against other teams in the same weeks
            </div>
            {done.map((a) => {
              const measured = a.result && a.score && !a.score.headline.startsWith("Not enough");
              return (
                <Row
                  key={a.id}
                  title={
                    <Link href={`/fixes/${a.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                      {a.title}
                    </Link>
                  }
                  meta={`${a.hiring_side ? "Hiring" : driverName(a.driver)} · ${fixScope(a)} · ${a.owner} · Done ${shortDate(a.done_at)} · ${
                    a.hiring_side ? "No note, no recheck" : a.notice.status === "sent" ? `Note sent to ${a.notice.sent_count} new ${a.notice.sent_count === 1 ? "hire" : "hires"}` : a.notice.status === "none" ? "No note" : "Note not sent yet"
                  }`}
                  metric={
                    a.hiring_side ? null : measured ? (
                      <div>
                        <span className="sp-num text-[17px] font-bold" style={{ color: "var(--fixes)" }}>
                          {signed(a.result!.scope)}
                        </span>{" "}
                        <span className="sp-caption">vs {signed(a.result!.other)} other teams</span>
                        <div className="sp-caption">
                          {a.result!.scope.before.toFixed(1)} → {a.result!.scope.after.toFixed(1)} · {a.result!.scope.n} people
                        </div>
                      </div>
                    ) : (
                      <span className="sp-caption">{a.score?.headline}</span>
                    )
                  }
                  action={<Button href={`/fixes/${a.id}`}>Open</Button>}
                />
              );
            })}
          </section>
        )
      ) : null}

      {tab === "cancelled" ? (
        cancelled.length === 0 ? (
          <Empty title="No cancelled fixes" />
        ) : (
          <section className="sp-card" aria-label="Cancelled fixes">
            {cancelled.map((a) => (
              <Row
                key={a.id}
                muted
                title={a.title}
                meta={`${a.hiring_side ? "Hiring" : driverName(a.driver)} · ${fixScope(a)} · Cancelled ${shortDate(a.dismissed_at)}`}
                metric={<span className="text-[13px]">{a.dismiss_reason}</span>}
                action={<Button href={`/fixes/${a.id}`}>Open</Button>}
              />
            ))}
          </section>
        )
      ) : null}
    </>
  );
}
