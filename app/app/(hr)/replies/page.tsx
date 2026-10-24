"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ApiError, apiSend, useApi } from "@/components/sapa/data";
import { QualityWatch } from "@/components/sapa/quality";
import { ReplyRow, type ReplyItem } from "@/components/sapa/reply";
import { CountUp, DRIVERS, Empty, Loading, PageHeader, Select, Tabs } from "@/components/sapa/ui";

type QueueRow = { id: string; escalate: boolean | null; status: string | null; note: string | null };
type Before = { status: string | null; drivers: string[]; context_tags: string[]; changed_by_hr: boolean | null };

const LANGUAGES: Record<string, string> = { ms: "Bahasa Malaysia", en: "English", zh: "Chinese" };
const part = (item: ReplyItem, i: number) => item.byline.split(" · ")[i] ?? "";
const noArea = (item: ReplyItem) => !!item.text && !item.escalate && !item.drivers?.length && (item.status === "reviewed" || (item.status === "ok" && item.counted !== false));
const unique = (values: string[]) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "en", { numeric: true }));

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <Select auto label={label} value={value} onChange={onChange} options={[{ value: "all", label: `${label}: all` }, ...options.map(([key, text]) => ({ value: key, label: text }))]} />
  );
}

function Replies() {
  const params = useSearchParams();
  const [view, setView] = useState<"needs" | "none" | "all">(params.get("view") === "all" ? "all" : params.get("view") === "none" ? "none" : "needs");
  const [area, setArea] = useState(params.get("area") ?? "all");
  const [day, setDay] = useState("all");
  const [team, setTeam] = useState("all");
  const [language, setLanguage] = useState("all");
  const [checked, setChecked] = useState<Record<string, Before>>({});
  const [error, setError] = useState<string | null>(null);
  const replies = useApi<ReplyItem[]>("/api/hr/replies", 2000);
  const queue = useApi<QueueRow[]>("/api/hr/queue", 2000);
  const seen = useRef<Set<string> | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!replies.data) return;
    const ids = replies.data.map((item) => item.id);
    const known = seen.current;
    seen.current = new Set(ids);
    if (!known) return;
    const added = ids.filter((id) => !known.has(id));
    if (!added.length) return;
    setFresh(new Set(added));
    const timer = setTimeout(() => setFresh(new Set()), 800);
    return () => clearTimeout(timer);
  }, [replies.data]);
  if (!replies.data || !queue.data) return <Loading />;

  const notes = new Map(queue.data.map((row) => [row.id, row.note]));
  const needs = new Set(queue.data.filter((row) => !row.escalate && row.status !== "reviewed").map((row) => row.id));
  const all = [...replies.data].sort((a, b) => b.created_at.localeCompare(a.created_at)).map((item) => ({ ...item, note: notes.get(item.id) ?? null }));
  const loose = all.filter(noArea);
  const listed = view === "needs" ? all.filter((item) => needs.has(item.id) || item.id in checked) : view === "none" ? loose : all;
  const shown = listed.filter(
    (item) =>
      (area === "all" || (area === "none" ? !item.drivers.length : item.drivers.includes(area))) &&
      (day === "all" || part(item, 2) === day) &&
      (team === "all" || part(item, 1) === team) &&
      (language === "all" || item.language === language),
  );
  const filtered = shown.length < listed.length;

  const guard = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save. Try again.");
    }
  };
  const review = (item: ReplyItem, body: object) =>
    guard(async () => {
      await apiSend(`/api/hr/replies/${item.id}/review`, "POST", body);
      if (item.status !== "reviewed") {
        setChecked((c) => ({ ...c, [item.id]: { status: item.status, drivers: item.drivers, context_tags: item.context_tags, changed_by_hr: item.changed_by_hr } }));
      }
    });
  const undo = (id: string) =>
    guard(async () => {
      await apiSend(`/api/hr/replies/${id}/undo`, "POST", { ...checked[id], changed_by_hr: !!checked[id].changed_by_hr });
      setChecked((c) => Object.fromEntries(Object.entries(c).filter(([key]) => key !== id)));
    });
  const clear = () => {
    setArea("all");
    setDay("all");
    setTeam("all");
    setLanguage("all");
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Replies"
        right={
          <Tabs
            label="Show"
            value={view}
            onChange={setView}
            items={[
              ["needs", <>Needs you · <CountUp value={needs.size} /></>],
              ["none", <>Fits no area · <CountUp value={loose.length} /></>],
              ["all", <>All · <CountUp value={all.length} /></>],
            ]}
          />
        }
      />
      <QualityWatch />
      <div role="group" aria-label="Filter replies" className="flex flex-wrap items-center gap-2">
        <Filter label="Problem area" value={area} onChange={setArea} options={[...Object.entries(DRIVERS), ["none", "Nothing to act on"]]} />
        <Filter label="Check-in" value={day} onChange={setDay} options={unique(all.map((item) => part(item, 2))).map((d) => [d, d])} />
        <Filter label="Team" value={team} onChange={setTeam} options={unique(all.map((item) => part(item, 1))).map((t) => [t, t])} />
        <Filter label="Language" value={language} onChange={setLanguage} options={unique(all.map((item) => item.language ?? "")).map((l) => [l, LANGUAGES[l] ?? l])} />
        {filtered ? (
          <>
            <span className="sp-caption">
              {shown.length} of {listed.length}
            </span>
            <button type="button" className="sp-link" onClick={clear}>
              Clear filters
            </button>
          </>
        ) : null}
      </div>
      {error ? (
        <div role="alert" className="text-sm" style={{ color: "var(--serious)" }}>
          {error}
        </div>
      ) : null}
      {shown.length === 0 ? (
        <Empty
          title={filtered ? "No reply matches these filters" : view === "needs" ? "Nothing to check" : view === "none" ? "Every reply fits a problem area" : "No replies yet"}
          sub={!filtered && view === "needs" ? "The AI was sure of every label. You can still change any in All." : undefined}
        />
      ) : (
        <div key={[view, area, day, team, language].join()} className="sp-stagger flex flex-col gap-4">
          {shown.map((item) => (
            <ReplyRow
              key={item.id}
              chat
              fresh={fresh.has(item.id)}
              item={item}
              onConfirm={() => review(item, {})}
              onChange={(change) => review(item, change)}
              onRetry={() => guard(() => apiSend(`/api/hr/replies/${item.id}/retry`))}
              onUndo={item.id in checked && item.status === "reviewed" ? () => undo(item.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <Replies />
    </Suspense>
  );
}
