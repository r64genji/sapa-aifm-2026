"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, Home, MessagesSquare, QrCode, Shield } from "lucide-react";
import { Suspense, type ReactNode } from "react";
import { ApiError, useApi, useLiveRefresh } from "./data";
import { DemoBar } from "./demo-bar";
import { LaneIcon, Loading } from "./ui";

export type Me = { name: string; role: string; organisation: string; demo_mode: boolean };

function NavItem({ href, icon, label, short, count, serious }: { href: string; icon: ReactNode; label: string; short: string; count?: number; serious?: boolean }) {
  const path = usePathname();
  const current = href === "/" ? path === "/" : path.startsWith(href);
  return (
    <Link href={href} className="sp-nav-item" aria-current={current ? "page" : undefined}>
      {icon}
      <span className="flex-auto md:hidden">{short}</span>
      <span className="hidden flex-auto md:inline">{label}</span>
      {count ? <span className={`sp-nav-count${serious ? " sp-lane-serious" : ""}`}>{count}</span> : null}
    </Link>
  );
}

function Main({ children }: { children: ReactNode }) {
  const path = usePathname();
  return (
    <main id="main" tabIndex={-1} key={path.split("/")[1]} className="sp-enter mx-auto box-border flex max-w-[1180px] flex-col gap-6 px-4 pb-28 pt-5 md:px-8 md:pb-14 md:pt-8">
      {children}
    </main>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  useLiveRefresh();
  const me = useApi<Me>("/api/hr/me", 60000);
  const queue = useApi<{ escalate: boolean | null; status: string | null }[]>(me.data ? "/api/hr/queue" : null);

  if (me.error instanceof ApiError && me.error.status !== 401) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="sp-card flex max-w-sm flex-col items-start gap-3 p-6">
          <span className="text-[17px] font-bold">This account has no HR access</span>
        </div>
      </div>
    );
  }
  if (!me.data) return <Loading />;

  const toCheck = (queue.data ?? []).filter((r) => !r.escalate && r.status !== "reviewed").length;

  const logo = (
    <Link href="/" className="flex min-h-11 items-center gap-2.5 px-2.5 no-underline" style={{ color: "var(--ink)" }}>
      <img src="/icon.svg" alt="" className="h-8 w-8 transition-transform duration-300 hover:rotate-[-6deg] hover:scale-110" />
      <span className="text-[17px] font-bold">Sapa</span>
    </Link>
  );
  const user = (
    <>
      <span className="flex h-8 w-8 flex-none items-center justify-center font-bold" style={{ borderRadius: "var(--radius-round)", background: "var(--problems-soft)", color: "var(--problems)" }}>
        {me.data.name.slice(0, 1).toUpperCase()}
      </span>
      <span className="flex min-w-0 flex-auto flex-col">
        <span className="truncate font-semibold">{me.data.name}</span>
        <span className="sp-caption truncate">HR · {me.data.organisation.replace(/ \(.*$/, "").replace("Contoh Global Business Services", "Contoh GBS")}</span>
      </span>
    </>
  );

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <a href="#main" className="sp-skip">Skip to content</a>
      <header className="sticky top-0 z-30 flex items-center gap-2.5 border-b py-1.5 pl-1.5 pr-3 md:hidden" style={{ background: "var(--surface-raised)", borderColor: "var(--line)" }}>
        {logo}
        <span className="flex min-w-0 flex-auto items-center justify-end gap-2.5">{user}</span>
      </header>
      <nav
        aria-label="Main"
        className="sp-nav box-border md:sticky md:top-0 md:flex md:h-screen md:w-[232px] md:flex-none md:flex-col md:gap-0.5 md:overflow-y-auto md:border-r md:px-3 md:py-5"
        style={{ background: "var(--surface-raised)", borderColor: "var(--line)" }}
      >
        <div className="hidden pb-5 md:block">{logo}</div>
        <div className="grid auto-cols-fr grid-flow-col md:flex md:flex-col md:gap-0.5">
          <NavItem href="/" icon={<Home size={17} aria-hidden="true" />} label="Home" short="Home" />
          <NavItem href="/replies" icon={<MessagesSquare size={17} aria-hidden="true" />} label="Replies" short="Replies" count={toCheck} />
          <NavItem href="/problems" icon={<LaneIcon lane="problems" />} label="Shared problems" short="Problems" />
          <NavItem href="/fixes" icon={<LaneIcon lane="fixes" />} label="Fixes and impact" short="Fixes" />
          {me.data.role === "hr_admin" ? <NavItem href="/join" icon={<QrCode size={17} aria-hidden="true" />} label="Join codes" short="Join" /> : null}
          {me.data.role === "hr_admin" ? <NavItem href="/schedule" icon={<CalendarClock size={17} aria-hidden="true" />} label="Check-in schedule" short="Schedule" /> : null}
        </div>
        <div className="hidden min-h-6 grow md:block" />
        <Link href="/concerns" className="sp-caption hidden min-h-11 items-center gap-2 px-2.5 no-underline md:flex" style={{ color: "var(--ink-muted)" }}>
          <Shield size={14} strokeWidth={2} aria-hidden="true" />
          Sent to Speak Up
        </Link>
        <div className="mt-2 hidden items-center gap-2.5 border-t px-2.5 pt-3 md:flex" style={{ borderColor: "var(--line-soft)" }}>
          {user}
        </div>
      </nav>
      <div className="min-w-0 flex-1">
        {me.data.role === "hr_admin" && me.data.demo_mode ? <DemoBar /> : null}
        <Suspense fallback={<Loading />}>
          <Main>{children}</Main>
        </Suspense>
      </div>
    </div>
  );
}
