"use client";

import Link from "next/link";
import { ChevronRight, Lock } from "lucide-react";
import { SENT_TO_COMPLAINTS, categoryName, type Concern } from "@/components/sapa/concerns";
import { useApi } from "@/components/sapa/data";
import { Empty, Loading, PageHeader, dayLabel, shortDate } from "@/components/sapa/ui";

function ConcernRow({ c }: { c: Concern }) {
  return (
    <Link href={`/concerns/${c.id}`} className="sp-case-row flex flex-wrap items-center gap-x-4 gap-y-2.5 border-t px-5 py-4 no-underline" style={{ borderColor: "var(--line-soft)", color: "var(--ink)" }}>
      <span className="w-full text-[13px] sm:w-[120px] sm:shrink-0 sp-muted">{shortDate(c.created_at)}</span>
      <span className="flex min-w-0 flex-col gap-1" style={{ flex: "999 1 280px" }}>
        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="text-[15px] font-bold leading-5">{categoryName(c.category)}</span>
          <span className="text-[13px] sp-muted">{c.touchpoint !== null ? dayLabel(c.touchpoint) : ""}</span>
        </span>
        {c.first_line ? (
          <span className="overflow-hidden text-ellipsis whitespace-nowrap text-base leading-[22px] sp-muted" style={{ fontFamily: "var(--font-serif)" }}>
            “{c.first_line}”
          </span>
        ) : null}
      </span>
      <ChevronRight size={18} strokeWidth={2} aria-hidden="true" className="hidden shrink-0 sm:block sp-muted" />
    </Link>
  );
}

export default function Page() {
  const { data } = useApi<Concern[]>("/api/hr/escalations?preview=1", 60000);
  if (!data) return <Loading />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Sent to Speak Up · ${data.length}`}
        sub={
          <span className="inline-flex items-center gap-1.5">
            <Lock size={14} strokeWidth={2} aria-hidden="true" />
            HR only. Managers never see these. Not counted in any problem area.
          </span>
        }
      />
      <p className="m-0 sp-muted">{SENT_TO_COMPLAINTS}</p>
      {data.length === 0 ? (
        <Empty title="Nobody sent to Speak Up yet" />
      ) : (
        <section aria-label="Serious concerns" className="sp-card overflow-hidden">
          {data.map((c) => (
            <ConcernRow key={c.id} c={c} />
          ))}
        </section>
      )}
    </div>
  );
}
