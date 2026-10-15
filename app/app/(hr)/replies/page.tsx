"use client";

import { useState } from "react";
import { ReplyRow, type ReplyChange, type ReplyItem } from "@/components/sapa/reply";
import { ApiError, apiSend, useApi } from "@/components/sapa/data";
import { Empty, Loading, PageHeader, Tabs } from "@/components/sapa/ui";

type Before = { status: string; drivers: string[]; context_tags: string[]; changed_by_hr: boolean };
type Done = { item: ReplyItem; before: Before };

export default function Page() {
  const [tab, setTab] = useState<"check" | "all">("check");
  const [done, setDone] = useState<Record<string, Done>>({});
  const [order, setOrder] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const queue = useApi<ReplyItem[]>("/api/hr/queue");
  const replies = useApi<ReplyItem[]>(tab === "all" ? "/api/hr/replies" : null, 30000);

  const guard = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save. Try again.");
    }
  };

  const review = (item: ReplyItem, change: ReplyChange, patch: Partial<ReplyItem>, track: boolean) =>
    guard(async () => {
      await apiSend(`/api/hr/replies/${item.id}/review`, "POST", change);
      if (!track) return;
      setDone((d) => ({
        ...d,
        [item.id]: {
          before: d[item.id]?.before ?? { status: item.status ?? "ok", drivers: item.drivers, context_tags: item.context_tags, changed_by_hr: item.changed_by_hr ?? false },
          item: { ...(d[item.id]?.item ?? item), status: "reviewed", ...patch },
        },
      }));
      setOrder((o) => [...o.filter((id) => id !== item.id), item.id]);
    });

  const props = (item: ReplyItem, track: boolean, undoable = false) => ({
    item,
    onConfirm: () => review(item, {}, { changed_by_hr: false }, track),
    onChange: (change: ReplyChange) =>
      review(item, change, change.serious ? { serious: true } : { drivers: change.drivers ?? item.drivers, context_tags: change.context_tags ?? item.context_tags, changed_by_hr: true }, track),
    onRetry: () => guard(() => apiSend(`/api/hr/replies/${item.id}/retry`)),
    onFollowUp: (value: boolean) =>
      guard(async () => {
        await apiSend(`/api/hr/replies/${item.id}/follow-up`, "POST", { value });
        setDone((d) => (d[item.id] ? { ...d, [item.id]: { ...d[item.id], item: { ...d[item.id].item, concern_level: value ? "needs_follow_up" : "none" } } } : d));
      }),
    onUndo: undoable
      ? () =>
          guard(async () => {
            await apiSend(`/api/hr/replies/${item.id}/undo`, "POST", done[item.id].before);
            setDone((d) => Object.fromEntries(Object.entries(d).filter(([id]) => id !== item.id)));
            setOrder((o) => o.filter((id) => id !== item.id));
          })
      : undefined,
  });

  const todo = (queue.data ?? []).filter((item) => item.status !== "reviewed" && !done[item.id]);
  const checked = order.length;
  const total = todo.length + checked;
  const last = order.length ? done[order[order.length - 1]] : null;
  const all = [...(replies.data ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Check AI labels"
        sub="Read the reply. Is the AI label right?"
        right={
          <Tabs
            label="Show"
            value={tab}
            onChange={setTab}
            items={[
              ["check", `To check · ${todo.length}`],
              ["all", "All replies"],
            ]}
          />
        }
      />
      {error ? (
        <div role="alert" className="sp-card px-4 py-3 text-sm" style={{ borderColor: "var(--serious-line)" }}>
          {error}
        </div>
      ) : null}
      {tab === "check" ? (
        !queue.data ? (
          <Loading />
        ) : (
          <>
            {total > 0 ? (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between gap-3 text-[13px]">
                  <span style={{ fontWeight: 600 }}>{todo.length} left to check</span>
                  <span className="sp-muted">
                    {checked} of {total} done
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-[3px]" style={{ background: "var(--track-empty)" }}>
                  <div className="h-full" style={{ width: `${Math.round((checked / total) * 100)}%`, background: "var(--ink)" }} />
                </div>
              </div>
            ) : null}
            {todo[0] ? <ReplyRow key={todo[0].id} {...props(todo[0], true)} /> : <Empty title="All checked" sub="New replies come after the next check-in." />}
            {last ? (
              <div className="flex flex-col gap-2">
                <h2 className="m-0 text-[13px] font-semibold sp-muted">Just checked</h2>
                <ReplyRow key={last.item.id} {...props(last.item, true, true)} />
              </div>
            ) : null}
          </>
        )
      ) : !replies.data ? (
        <Loading />
      ) : all.length === 0 ? (
        <Empty title="No replies yet" sub="Replies show here after people answer a check-in." />
      ) : (
        <div className="flex flex-col gap-3">
          {all.map((item) => (
            <ReplyRow key={item.id} {...props(item, false)} />
          ))}
        </div>
      )}
    </div>
  );
}
