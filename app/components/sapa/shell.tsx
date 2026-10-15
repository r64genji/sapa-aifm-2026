"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, Info, MonitorPlay } from "lucide-react";
import type { ReactNode } from "react";
import { ApiError, signOut, useApi, useLiveRefresh } from "./data";
import { Button, LaneIcon, Loading, Waiting } from "./ui";

export type Me = { name: string; role: string; organisation: string; demo_mode: boolean };
type Escalation = { id: string; closed_at: string | null; waited_hours: number; overdue: boolean };

function NavItem({ href, icon, label, count, serious }: { href: string; icon: ReactNode; label: string; count?: number; serious?: boolean }) {
  const path = usePathname();
  const current = href === "/" ? path === "/" : path.startsWith(href);
  return (
    <Link href={href} className="sp-nav-item" aria-current={current ? "page" : undefined}>
      {icon}
      <span className="flex-auto">{label}</span>
      {count ? <span className={`sp-nav-count${serious ? " sp-lane-serious" : ""}`}>{count}</span> : null}
    </Link>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  useLiveRefresh();
  const me = useApi<Me>("/api/hr/me", 60000);
  const escalations = useApi<Escalation[]>(me.data ? "/api/hr/escalations" : null);
  const queue = useApi<{ escalate: boolean | null; status: string | null }[]>(me.data ? "/api/hr/queue" : null);

  if (me.error instanceof ApiError && me.error.status !== 401) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="sp-card flex max-w-sm flex-col items-start gap-3 p-6">
          <span className="text-[17px] font-bold">This account has no HR access</span>
          <Button onClick={signOut}>Sign out</Button>
        </div>
      </div>
    );
  }
  if (!me.data) return <Loading />;

  const open = (escalations.data ?? []).filter((e) => !e.closed_at);
  const oldest = open.reduce((max, e) => Math.max(max, e.waited_hours), 0);
  const toCheck = (queue.data ?? []).filter((r) => !r.escalate && r.status !== "reviewed").length;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <nav
        aria-label="Main"
        className="box-border flex w-full flex-col gap-0.5 border-b px-3 py-4 md:sticky md:top-0 md:h-screen md:w-[232px] md:border-b-0 md:border-r md:py-5"
        style={{ background: "var(--surface-raised)", borderColor: "var(--line)" }}
      >
        <Link href="/" className="flex items-center gap-2.5 px-2.5 pb-4 no-underline md:pb-5" style={{ color: "var(--ink)" }}>
          <span className="flex h-7 w-7 items-center justify-center text-[15px] font-bold" style={{ borderRadius: "var(--radius-control)", background: "var(--problems)", color: "var(--on-problems)" }}>
            S
          </span>
          <span className="text-[17px] font-bold">Sapa</span>
        </Link>
        <div className="grid grid-cols-2 gap-0.5 md:flex md:flex-col">
          <NavItem href="/" icon={<Home size={17} aria-hidden="true" />} label="Needs you" />
          <NavItem href="/concerns" icon={<LaneIcon lane="serious" />} label="Serious concerns" count={open.length} serious />
          <NavItem href="/problems" icon={<LaneIcon lane="problems" />} label="Shared problems" />
          <NavItem href="/replies" icon={<LaneIcon lane="ai" />} label="Check AI labels" count={toCheck} />
          <NavItem href="/fixes" icon={<LaneIcon lane="fixes" />} label="Fixes" />
          <NavItem href="/impact" icon={<BarChart3 size={17} aria-hidden="true" />} label="Impact" />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-0.5 border-t pt-2 md:flex md:flex-col" style={{ borderColor: "var(--line-soft)" }}>
          <NavItem href="/how-sapa-works" icon={<Info size={17} aria-hidden="true" />} label="How Sapa treats people" />
          {me.data.role === "hr_admin" && me.data.demo_mode ? <NavItem href="/demo" icon={<MonitorPlay size={17} aria-hidden="true" />} label="Demo" /> : null}
        </div>
        <div className="hidden min-h-6 grow md:block" />
        <div className="mt-2 flex items-center gap-2.5 border-t px-2.5 pt-3" style={{ borderColor: "var(--line-soft)" }}>
          <span className="flex h-8 w-8 items-center justify-center font-bold" style={{ borderRadius: "var(--radius-round)", background: "var(--problems-soft)", color: "var(--problems)" }}>
            {me.data.name.slice(0, 1).toUpperCase()}
          </span>
          <span className="flex min-w-0 flex-auto flex-col">
            <span className="font-semibold">{me.data.name}</span>
            <span className="sp-caption truncate">HR · {me.data.organisation.replace(/ \(.*$/, "").replace("Contoh Global Business Services", "Contoh GBS")}</span>
          </span>
          <button type="button" onClick={signOut} className="sp-caption cursor-pointer border-0 bg-transparent underline">
            Sign out
          </button>
        </div>
      </nav>
      <div className="min-w-0 flex-1">
        {me.data.demo_mode ? (
          <div className="px-4 py-2 text-center text-[13px] font-medium md:px-8" style={{ background: "var(--surface-sunken)", borderBottom: "1px solid var(--line)" }}>
            This is a future year: what HR would see one year into Sapa. These numbers are fictional.
          </div>
        ) : null}
        {open.length > 0 ? (
          <Link
            href="/concerns"
            className="flex flex-wrap items-center gap-2 px-4 py-2 text-[13px] font-semibold no-underline md:px-8"
            style={{ background: "var(--serious-soft)", color: "var(--serious-ink)", borderBottom: "1px solid var(--serious-line)" }}
          >
            <LaneIcon lane="serious" size={15} />
            {open.length} serious {open.length === 1 ? "concern" : "concerns"} open
            <Waiting>oldest waiting {oldest} h of 1 working day</Waiting>
          </Link>
        ) : null}
        <main className="mx-auto box-border flex max-w-[1180px] flex-col gap-6 px-4 pb-14 pt-6 md:px-8 md:pt-8">{children}</main>
      </div>
    </div>
  );
}
