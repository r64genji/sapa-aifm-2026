"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Lock } from "lucide-react";
import { ClockChip, LEGAL, categoryName, contactedAt, nextStep, type Concern } from "@/components/sapa/concerns";
import { useApi } from "@/components/sapa/data";
import { Empty, Loading, PageHeader, Tabs, dayLabel, shortDate } from "@/components/sapa/ui";

const HEAD = "flex flex-wrap gap-4 border-b px-5 py-2.5 text-xs font-semibold sp-muted";

function Chevron() {
  return <ChevronRight size={18} strokeWidth={2} aria-hidden="true" className="hidden shrink-0 sm:block sp-muted" />;
}

function OpenRow({ c }: { c: Concern }) {
  const next = nextStep(c);
  return (
    <Link href={`/concerns/${c.id}`} className="sp-case-row flex flex-wrap items-center gap-x-4 gap-y-2.5 border-t px-5 py-[18px] no-underline" style={{ borderColor: "var(--line-soft)", color: "var(--ink)" }}>
      <span className="w-full sm:w-[168px] sm:shrink-0">
        <ClockChip c={c} />
      </span>
      <span className="flex min-w-0 flex-col gap-1" style={{ flex: "999 1 280px" }}>
        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="text-[15px] font-bold leading-5">{categoryName(c.category)}</span>
          <span className="text-[13px] sp-muted">
            {c.touchpoint !== null ? dayLabel(c.touchpoint) : ""}
          </span>
          {c.category === "sexual_harassment" ? (
            <span className="inline-flex min-h-[22px] items-center px-2 text-xs font-semibold" style={{ borderRadius: "var(--radius-tag)", background: "var(--serious-soft)", color: "var(--serious-ink)" }}>
              {LEGAL}
            </span>
          ) : null}
        </span>
        {c.first_line ? (
          <span className="overflow-hidden text-ellipsis whitespace-nowrap text-base leading-[22px] sp-muted" style={{ fontFamily: "var(--font-serif)" }}>
            “{c.first_line}”
          </span>
        ) : null}
      </span>
      <span className="flex w-full flex-col gap-1.5 sm:w-[180px] sm:shrink-0">
        <span className="font-semibold">{next.label}</span>
        <span className="flex gap-[3px]" role="img" aria-label={`Step ${next.step} of 3: ${["Acknowledge", "Contact", "Outcome and close"][next.step - 1]}`}>
          {[1, 2, 3].map((n) => (
            <span key={n} className="h-1 flex-1" style={{ borderRadius: "var(--radius-track)", background: n < next.step ? "var(--ink)" : n === next.step ? "var(--serious)" : "var(--track-empty)" }} />
          ))}
        </span>
      </span>
      <Chevron />
    </Link>
  );
}

function ClosedRow({ c }: { c: Concern }) {
  return (
    <Link href={`/concerns/${c.id}`} className="sp-case-row flex flex-wrap items-center gap-x-4 gap-y-2.5 border-t px-5 py-4 no-underline" style={{ borderColor: "var(--line-soft)", color: "var(--ink)" }}>
      <span className="w-full text-[13px] sm:w-[168px] sm:shrink-0 sp-muted">{shortDate(c.closed_at)}</span>
      <span className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1" style={{ flex: "999 1 280px" }}>
        <span className="font-semibold">{categoryName(c.category)}</span>
        <span className="text-[13px] sp-muted">
          {c.touchpoint !== null ? dayLabel(c.touchpoint) : ""}
        </span>
      </span>
      <span className="w-full sm:w-[180px] sm:shrink-0">{c.dont_contact ? "Closed, not contacted" : contactedAt(c) ? "Closed, contacted" : "Closed"}</span>
      <Chevron />
    </Link>
  );
}

export default function Page() {
  const [tab, setTab] = useState<"open" | "closed">("open");
  const { data } = useApi<Concern[]>("/api/hr/escalations?preview=1", 60000);
  if (!data) return <Loading />;
  const open = data.filter((c) => !c.closed_at);
  const closed = data.filter((c) => c.closed_at);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Serious concerns"
        sub={
          <span className="inline-flex items-center gap-1.5">
            <Lock size={14} strokeWidth={2} aria-hidden="true" />
            HR only. Managers never see these.
          </span>
        }
        right={
          <Tabs
            label="Show"
            value={tab}
            onChange={setTab}
            items={[
              ["open", `Open · ${open.length}`],
              ["closed", `Closed · ${closed.length}`],
            ]}
          />
        }
      />
      {tab === "open" && open.length === 0 ? (
        <Empty title="No open concerns" sub="You get an alert the moment a new one comes in." />
      ) : (
        <section aria-label={tab === "open" ? "Open concerns" : "Closed concerns"} className="sp-card overflow-hidden">
          <div className={HEAD} style={{ borderColor: "var(--line)", background: "var(--surface-sunken)" }}>
            <span className="hidden w-[168px] sm:block">{tab === "open" ? "Respond by" : "Closed"}</span>
            <span className="hidden sm:block" style={{ flex: "999 1 280px" }}>Concern</span>
            <span className="hidden w-[180px] sm:block">{tab === "open" ? "Next step" : "Outcome"}</span>
            <span className="sm:hidden">{tab === "open" ? "Respond by, concern, next step" : "Closed, concern, outcome"}</span>
          </div>
          {tab === "open" ? open.map((c) => <OpenRow key={c.id} c={c} />) : closed.length ? closed.map((c) => <ClosedRow key={c.id} c={c} />) : <Empty title="Nothing closed yet" />}
        </section>
      )}
    </div>
  );
}
