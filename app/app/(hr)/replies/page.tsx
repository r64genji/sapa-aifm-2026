"use client";

import { useState } from "react";
import { ApiError, apiSend, useApi } from "@/components/sapa/data";
import { ReplyRow, type ReplyItem } from "@/components/sapa/reply";
import { Empty, Loading, PageHeader, Tabs } from "@/components/sapa/ui";

type QueueRow = { id: string; escalate: boolean | null; status: string | null; note: string | null };
type Before = { status: string | null; drivers: string[]; context_tags: string[]; changed_by_hr: boolean | null };

export default function Page() {
  const [view, setView] = useState<"needs" | "all">("needs");
  const [checked, setChecked] = useState<Record<string, Before>>({});
  const [error, setError] = useState<string | null>(null);
  const replies = useApi<ReplyItem[]>("/api/hr/replies", 30000);
  const queue = useApi<QueueRow[]>("/api/hr/queue");
  if (!replies.data || !queue.data) return <Loading />;

  const notes = new Map(queue.data.map((row) => [row.id, row.note]));
  const needs = new Set(queue.data.filter((row) => !row.escalate && row.status !== "reviewed").map((row) => row.id));
  const all = [...replies.data].sort((a, b) => b.created_at.localeCompare(a.created_at)).map((item) => ({ ...item, note: notes.get(item.id) ?? null }));
  const shown = view === "needs" ? all.filter((item) => needs.has(item.id) || item.id in checked) : all;

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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Replies"
        sub="Each check-in as the new hire saw it: the taps, the questions and their words. Check the label the AI gave it."
        right={
          <Tabs
            label="Show"
            value={view}
            onChange={setView}
            items={[
              ["needs", `Needs you · ${needs.size}`],
              ["all", `All · ${all.length}`],
            ]}
          />
        }
      />
      {error ? (
        <div role="alert" className="text-sm" style={{ color: "var(--serious)" }}>
          {error}
        </div>
      ) : null}
      {shown.length === 0 ? (
        <Empty title={view === "needs" ? "Nothing to check" : "No replies yet"} sub={view === "needs" ? "The AI was sure of every label. You can still change any in All." : undefined} />
      ) : (
        <div className="flex flex-col gap-4">
          {shown.map((item) => (
            <ReplyRow
              key={item.id}
              chat
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
