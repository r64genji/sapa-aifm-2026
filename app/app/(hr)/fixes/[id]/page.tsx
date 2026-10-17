"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { apiSend, useApi } from "@/components/sapa/data";
import { Button, Card, Dialog, Empty, Loading, Quote, Tabs, Waiting, driverName, fixScope, shortDate } from "@/components/sapa/ui";

type Side = { n: number; before: number; after: number };
type Detail = {
  id: string;
  driver: string;
  hiring_side: boolean;
  library_entry_id: string | null;
  title: string;
  steps: string;
  notes: Record<string, string> | null;
  no_notice_reason: string | null;
  note_approved_by: string | null;
  note_approved_at: string | null;
  scope_type: "team" | "intake" | null;
  scope_team: string | null;
  scope_intake: string | null;
  status: string;
  owner: string | null;
  due_on: string | null;
  alert_due_on: string | null;
  alert_sent_at: string | null;
  alert_label: string | null;
  created_at: string;
  assigned_at: string | null;
  accepted_at: string | null;
  done_at: string | null;
  dismissed_at: string | null;
  dismiss_reason: string | null;
  outcome_note: string | null;
  overdue: boolean;
  notice: { status: string; sent_count: number; sent_at: string | null };
  score: { headline: string; detail: string | null; note: string } | null;
  result: { scope: Side; other: Side } | null;
  library: { title: string; rank: number; used: number; difference: number | null } | null;
  hires: number | null;
  recheck: { asked: number; answered: number };
  follow_up: { answers: number; counts: { label: string; n: number }[] | null; quotes: string[] };
  question: string | null;
};

const STEPS = ["Draft", "Assigned", "Accepted", "Done", "Note sent"];
const LANGUAGES: [string, string][] = [["ms", "Bahasa Malaysia"], ["en", "English"], ["zh", "中文"]];
const DAY = 86400000;
const signed = (value: number) => `${value < 0 ? "-" : "+"}${Math.abs(value).toFixed(1)}`;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function Bars({ label, side }: { label: string; side: Side }) {
  return (
    <div className="grid grid-cols-[56px_minmax(0,1fr)_32px] items-center gap-x-3 gap-y-2 text-[14px]">
      {(["before", "after"] as const).map((key) => (
        <div key={key} className="contents">
          <span className="sp-caption">{key === "before" ? "Before" : "After"}</span>
          <div className="sp-bar" style={{ margin: 0 }} role="img" aria-label={`${label} ${key} ${side[key].toFixed(1)} of 5`}>
            <div className="sp-bar-fill sp-lane-fixes" style={{ width: `${(side[key] / 5) * 100}%` }} />
          </div>
          <span className="sp-num font-bold">{side[key].toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}

function Result({ a }: { a: Detail }) {
  const enough = a.result && a.score && !a.score.headline.startsWith("Not enough");
  return (
    <Card title="Result" meta={`${driverName(a.driver)} score, 1 to 5`}>
      {enough ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {([[a.result!.scope, "Team", ""], [a.result!.other, "Other teams", ", same weeks"]] as const).map(([side, who, tail]) => (
            <div key={who} className="flex flex-col gap-2">
              <div>
                <span className="sp-num text-[26px] font-bold" style={{ color: who === "Team" ? "var(--fixes)" : undefined }}>
                  {signed(side.after - side.before)}
                </span>{" "}
                <span className="sp-caption">{who === "Team" ? fixScope(a) : who}</span>
              </div>
              <Bars label={who} side={side} />
              <span className="sp-caption">
                {plural(side.n, "person").replace("persons", "people")}
                {tail}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="font-semibold">{a.score?.headline}</div>
      )}
      {a.question ? (
        <div className="sp-caption">
          Question: “{a.question}”
        </div>
      ) : null}
      {a.score ? <div className="sp-caption">{a.score.note}</div> : null}
      <div className="sp-caption">
        Recheck answered: {a.recheck.answered} of {a.recheck.asked}
      </div>
    </Card>
  );
}

function FollowUp({ a }: { a: Detail }) {
  const { answers, counts, quotes } = a.follow_up;
  return (
    <Card title="What they say" meta="Since the last Update from HR, how has this changed for you?">
      {counts ? (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {counts.map(({ label, n }) => (
            <li key={label} className="grid grid-cols-[120px_minmax(0,1fr)_32px] items-center gap-3 text-[15px]">
              <span>{label}</span>
              <div className="sp-bar" style={{ margin: 0 }} role="img" aria-label={`${label}: ${n} of ${answers}`}>
                <div className="sp-bar-fill sp-lane-fixes" style={{ width: `${(n / answers) * 100}%` }} />
              </div>
              <span className="sp-num font-bold">{n}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="font-semibold">Not enough answers yet ({answers} of 5)</div>
      )}
      <div className="sp-caption">People often say things got better when asked. Compare with the score change above.</div>
      {quotes.length ? (
        <div className="flex flex-col gap-2">
          <h3 className="m-0 text-[17px] font-bold">In their words</h3>
          {quotes.map((quote) => (
            <Quote key={quote} text={quote} />
          ))}
        </div>
      ) : null}
    </Card>
  );
}

function NoteEditor({ a, onClose }: { a: Detail; onClose: () => void }) {
  const [draft, setDraft] = useState<Record<string, string>>({ en: a.notes?.en ?? "", ms: a.notes?.ms ?? "", zh: a.notes?.zh ?? "" });
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    try {
      await apiSend(`/api/hr/actions/${a.id}/notice`, "POST", { notes: draft });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    }
  };
  return (
    <Dialog title="Edit the note to new hires" onClose={onClose}>
      {LANGUAGES.map(([key, label]) => (
        <label key={key} className="flex flex-col gap-1 text-[13px] font-semibold">
          {label}
          <textarea className="sp-input" rows={3} value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
        </label>
      ))}
      <span className="sp-caption">At most 40 words each. English and Bahasa Malaysia are needed.</span>
      {error ? <span style={{ color: "var(--serious)" }}>{error}</span> : null}
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" lane="fixes" onClick={save}>
          Save note
        </Button>
        <Button onClick={onClose}>Cancel</Button>
      </div>
    </Dialog>
  );
}

function ReasonDialog({ title, label, cta, onSend, onClose }: { title: string; label: string; cta: string; onSend: (reason: string) => Promise<unknown>; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true);
    try {
      await onSend(reason);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
      setBusy(false);
    }
  };
  return (
    <Dialog title={title} onClose={onClose}>
      <label className="flex flex-col gap-1 text-[13px] font-semibold">
        {label}
        <textarea className="sp-input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>
      {error ? <span style={{ color: "var(--serious)" }}>{error}</span> : null}
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" lane="fixes" disabled={!reason.trim() || busy} why={!reason.trim() ? `Write ${label.toLowerCase()} first` : null} onClick={send}>
          {cta}
        </Button>
        <Button onClick={onClose}>Back</Button>
      </div>
    </Dialog>
  );
}

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const { data: a, error } = useApi<Detail>(`/api/hr/actions/${id}`);
  const [lang, setLang] = useState("en");
  const [dialog, setDialog] = useState<"done" | "note" | "no-note" | "cancel" | null>(null);
  if (error) return <Empty title="This fix was not found" sub="It may have been removed." />;
  if (!a) return <Loading />;

  const done = a.status === "done";
  const cancelled = a.status === "dismissed";
  const open = ["assigned", "accepted"].includes(a.status);
  const hr = a.owner === "HR";
  const at = done ? (a.notice.status === "sent" ? 5 : 4) : a.status === "accepted" ? 3 : a.status === "assigned" ? 2 : 1;
  const owner = a.owner ?? "the owner";
  const when = [
    shortDate(a.created_at),
    shortDate(a.assigned_at),
    a.accepted_at ? shortDate(a.accepted_at) : a.alert_sent_at || hr ? "Waiting" : a.alert_due_on ? `Goes out ${shortDate(a.alert_due_on)}` : "",
    a.done_at ? shortDate(a.done_at) : a.due_on ? `Due ${shortDate(a.due_on)}` : "",
    a.notice.sent_at ? shortDate(a.notice.sent_at) : a.hiring_side || !a.notes ? "No note" : "Automatic",
  ];
  const langs = LANGUAGES.filter(([key]) => a.notes?.[key]);
  const shown = a.notes?.[lang] ? lang : "en";
  const days = done && a.done_at ? Math.max(0, Math.round((Date.parse(a.done_at) - Date.parse(a.assigned_at ?? a.created_at)) / DAY)) : null;
  const waiting = a.overdue ? "Overdue" : a.status === "assigned" && !hr ? (a.alert_sent_at ? `Waiting for ${owner} to accept` : `${owner} gets it ${shortDate(a.alert_due_on)}`) : null;
  const activity: [string, string][] = [
    ["Draft created", shortDate(a.created_at)],
    ...(a.note_approved_at ? [["Note approved", shortDate(a.note_approved_at)] as [string, string]] : []),
    ...(a.assigned_at ? [[`Assigned to ${owner}`, shortDate(a.assigned_at)] as [string, string]] : []),
    ...(a.alert_sent_at ? [[`Sent to ${owner} on Telegram`, shortDate(a.alert_sent_at)] as [string, string]] : []),
    ...(a.accepted_at ? [[`${owner} accepted`, shortDate(a.accepted_at)] as [string, string]] : []),
    ...(a.done_at ? [[`${owner} marked it done`, shortDate(a.done_at)] as [string, string]] : []),
    ...(a.notice.sent_at ? [[`Note sent to ${plural(a.notice.sent_count, "new hire")}`, shortDate(a.notice.sent_at)] as [string, string]] : []),
    ...(a.recheck.asked ? [["Recheck answered", `${a.recheck.answered} of ${a.recheck.asked}`] as [string, string]] : []),
    ...(a.dismissed_at ? [["Cancelled", shortDate(a.dismissed_at)] as [string, string]] : []),
  ];
  const markDone = async (outcome: string) => {
    if (a.status === "assigned") await apiSend(`/api/hr/actions/${a.id}/accept`);
    return apiSend(`/api/hr/actions/${a.id}/done`, "POST", { outcome });
  };

  return (
    <>
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[15px] sp-muted">
        <Link href="/fixes" style={{ color: "inherit", textDecoration: "none" }}>
          Fixes
        </Link>
        <span aria-hidden="true">/</span>
        <span style={{ color: "var(--ink)", fontWeight: 600 }}>{a.title}</span>
      </nav>

      <section className="sp-card flex flex-col gap-6 px-5 py-5 sm:px-7 sm:py-6" aria-label="Fix status">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap gap-2 text-[14px] font-semibold">
              <span className="rounded px-3 py-1" style={{ background: "var(--problems-soft)", color: "var(--problems)" }}>
                {a.hiring_side ? "Hiring" : driverName(a.driver)}
              </span>
              <span className="rounded px-3 py-1" style={{ background: "var(--surface-sunken)" }}>
                {fixScope(a)}
              </span>
            </div>
            <h1 className="sp-page-title">{a.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {done ? <span className="rounded px-4 py-3 text-[15px] font-bold" style={{ background: "var(--fixes-soft)", color: "var(--fixes)" }}>Done in {plural(days ?? 0, "day")}</span> : null}
            {cancelled ? <span className="rounded px-4 py-3 text-[15px] font-bold" style={{ background: "var(--surface-sunken)" }}>Cancelled</span> : null}
            {waiting ? <Waiting>{waiting}</Waiting> : null}
            {open && hr ? (
              <Button variant="primary" lane="fixes" onClick={() => setDialog("done")}>
                Mark done
              </Button>
            ) : null}
            {open ? <Button onClick={() => setDialog("cancel")}>Cancel fix</Button> : null}
          </div>
        </div>
        {cancelled ? <div className="text-[15px]">Why: {a.dismiss_reason}</div> : null}
        {!cancelled ? (
          <ol aria-label="Fix progress" className="m-0 grid list-none grid-cols-5 gap-2.5 p-0 sm:gap-3">
            {STEPS.map((label, i) => {
              const n = i + 1;
              const now = n === at && !done;
              return (
                <li key={label} className="flex min-w-0 flex-col gap-2">
                  <div style={{ height: 6, borderRadius: 3, background: n <= at ? (now && a.status === "assigned" && waiting ? "var(--waiting)" : "var(--fixes)") : "var(--track-empty)" }} />
                  <span className="text-[11px] sm:text-[16px]" style={{ fontWeight: n <= at ? 700 : 500, color: n <= at ? "var(--ink)" : "var(--ink-muted)", overflowWrap: "normal" }}>
                    {label}
                  </span>
                  <span className="sp-caption">{when[i]}</span>
                </li>
              );
            })}
          </ol>
        ) : null}
      </section>

      {a.status === "draft" ? (
        <Card title="This fix is still a draft">
          <Button variant="primary" lane="fixes" href={`/fixes/new?id=${a.id}`}>
            Open the draft
          </Button>
        </Card>
      ) : null}

      <div className={`grid items-start gap-6 ${done ? "lg:grid-cols-[minmax(0,1fr)_340px]" : ""}`}>
        <div className="flex min-w-0 flex-col gap-6">
          <Card title="The fix" meta={a.note_approved_at ? `Approved by HR · ${shortDate(a.note_approved_at)}` : undefined}>
            <dl className="m-0 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {a.library ? (
                <div>
                  <dt className="sp-caption font-bold">From fix library</dt>
                  <dd className="m-0 text-[17px] font-semibold">{a.library.title}</dd>
                </div>
              ) : null}
              <div>
                <dt className="sp-caption font-bold">For</dt>
                <dd className="m-0 text-[17px] font-semibold">
                  {fixScope(a)}
                  {a.hires !== null ? ` · ${plural(a.hires, "new hire")}` : ""}
                </dd>
              </div>
              <div>
                <dt className="sp-caption font-bold">Owner</dt>
                <dd className="m-0 text-[17px] font-semibold">{a.owner ?? "Not assigned"}</dd>
              </div>
              <div>
                <dt className="sp-caption font-bold">{done ? "Done" : "Due"}</dt>
                <dd className="m-0 text-[17px] font-semibold">{done ? shortDate(a.done_at) : a.due_on ? shortDate(a.due_on) : "Not set"}</dd>
              </div>
            </dl>
            <div>
              <h3 className="m-0 text-[17px] font-bold">{`Message to ${owner}`}</h3>
              <p className="m-0 mt-2 text-[17px] leading-7">{a.steps}</p>
            </div>
            {done && a.outcome_note ? (
              <div>
                <div className="sp-caption font-bold">{owner}&apos;s words · HR only</div>
                <Quote text={a.outcome_note} />
              </div>
            ) : null}
            {a.hiring_side ? (
              <div className="sp-caption">No note, no recheck. A hiring fix stays with HR.</div>
            ) : a.notes ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <h3 className="m-0 text-[17px] font-bold">{done ? "Note new hires got" : "Note to new hires"}</h3>
                  {!done ? <span className="sp-caption">Sent when {owner} marks it done</span> : null}
                </div>
                <Tabs label="Language" value={shown} onChange={setLang} items={langs} />
                <p className="m-0 text-[17px] leading-7">{a.notes[shown]}</p>
                {done ? (
                  <span className="sp-caption">
                    {a.notice.status === "sent" ? `Sent to ${plural(a.notice.sent_count, "new hire")}` : "Not sent yet"}
                  </span>
                ) : open ? (
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setDialog("note")}>Edit note</Button>
                    <Button onClick={() => setDialog("no-note")}>Cancel note</Button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="sp-caption">No note: {a.no_notice_reason ?? "none chosen"}</div>
                {open ? (
                  <div>
                    <Button onClick={() => setDialog("note")}>Add a note</Button>
                  </div>
                ) : null}
              </div>
            )}
          </Card>
          {done && !a.hiring_side ? <Result a={a} /> : null}
          {done && !a.hiring_side && a.notes ? <FollowUp a={a} /> : null}
          <Card title="Activity">
            <ol className="m-0 flex list-none flex-col gap-2 p-0">
              {activity.map(([what, date]) => (
                <li key={what} className="flex flex-wrap justify-between gap-x-4 text-[15px]">
                  <span>{what}</span>
                  <span className="sp-muted">{date}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
        {done ? (
        <aside aria-label="Context" className="flex flex-col gap-6">
          {a.library && done ? (
            <Card title="Fix library">
              <div>
                <span className="sp-num text-[22px] font-bold">#{a.library.rank}</span> <span className="sp-muted">for {driverName(a.driver)}</span>
              </div>
              <span className="sp-caption">
                {a.library.difference === null ? "Not enough evidence yet" : `${signed(a.library.difference)} vs other teams`} · used {a.library.used === 1 ? "once" : `${a.library.used} times`}
              </span>
            </Card>
          ) : null}
          {done && !a.hiring_side ? (
            <Button lane="fixes" href={`/fixes/new?driver=${a.driver}${a.library_entry_id ? `&entry=${a.library_entry_id}` : ""}`}>
              Use this fix again
            </Button>
          ) : null}
        </aside>
        ) : null}
      </div>

      {dialog === "done" ? <ReasonDialog title="Mark this fix done" label="What was done" cta="Mark done" onSend={markDone} onClose={() => setDialog(null)} /> : null}
      {dialog === "cancel" ? (
        <ReasonDialog title="Cancel this fix" label="Why it is cancelled" cta="Cancel fix" onSend={(reason) => apiSend(`/api/hr/actions/${a.id}/dismiss`, "POST", { reason })} onClose={() => setDialog(null)} />
      ) : null}
      {dialog === "no-note" ? (
        <ReasonDialog title="Cancel the note" label="Why no note" cta="Cancel note" onSend={(reason) => apiSend(`/api/hr/actions/${a.id}/notice`, "POST", { no_notice_reason: reason })} onClose={() => setDialog(null)} />
      ) : null}
      {dialog === "note" ? <NoteEditor a={a} onClose={() => setDialog(null)} /> : null}
    </>
  );
}
