"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ChevronDown, Clock, LoaderCircle, Plus, Send, ShieldCheck, Trash2 } from "lucide-react";
import { ApiError, apiGet, apiSend, useApi } from "@/components/sapa/data";
import type { Me } from "@/components/sapa/shell";
import { AiMark, Button, CountBar, Empty, LaneIcon, Loading, PageHeader, Select, Tabs, driverName, shortDate } from "@/components/sapa/ui";

type Notes = { en: string; ms: string; zh: string };
type Entry = { id: string; title: string; text: string; notes: Partial<Notes> | null; custom: boolean; result: string };
type Scope = {
  type: "team" | "intake";
  key: string;
  label: string;
  n: number;
  managers: { id: string; name: string }[];
  lines: string[];
  counts: { n: number; m: number; week: string } | null;
  why: string | null;
};
type View = {
  id: string;
  driver: string;
  status: string;
  title: string;
  steps: string;
  own_fix: boolean;
  library_entry_id: string | null;
  reason: string | null;
  notes: Partial<Notes> | null;
  held: boolean;
  demo_mode: boolean;
  today: string;
  alert_on: string;
  alert_label: string | null;
  scopes: Scope[];
  all_counts: { n: number; m: number } | null;
  telegram: { alert: string; due: string; accept: string; done: string };
};
type Suggestion = { title: string; steps: string; notes: Notes | null; entryId: string | null; reason: string };
type Mode = "ai" | "library" | "none";
type Decision = "pending" | "accepted" | "rejected";
type Sent = { held: boolean; alert_sent: boolean; alert_label: string | null; alert_on: string; manager: string | null };
type Batch = { sent: { team: string; manager_id: string; id?: string; error?: string }[] };

const EMPTY: Notes = { en: "", ms: "", zh: "" };
const LANGS: ["en" | "ms" | "zh", string][] = [["en", "English"], ["ms", "Bahasa Malaysia"], ["zh", "中文"]];
const addDays = (date: string, days: number) => new Date(Date.parse(date) + days * 86400000).toISOString().slice(0, 10);
const scopeKey = (s: Scope) => `${s.type}:${s.key}`;
const words = (value: string) => (value.trim() ? value.trim().split(/\s+/).length : 0);
const fail = (error: unknown) => (error instanceof ApiError ? error.message : "Something went wrong. Try again.");

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 basis-[200px] flex-col gap-1">
      <label htmlFor={htmlFor} className="sp-caption" style={{ fontWeight: 600 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Editor({ id, view, entries, teams }: { id: string; view: View; entries: Entry[] | undefined; teams: string[] }) {
  const me = useApi<Me>("/api/hr/me", 60000);
  const hr = me.data?.name ?? "HR";
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [mode, setMode] = useState<Mode>("none");
  const [decision, setDecision] = useState<Decision>("pending");
  const [title, setTitle] = useState("");
  const [steps, setSteps] = useState("");
  const [notes, setNotes] = useState<Notes>(EMPTY);
  const [lang, setLang] = useState<"en" | "ms" | "zh">("en");
  const [entryId, setEntryId] = useState<string | null>(null);
  const [ownFix, setOwnFix] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [scopeId, setScopeId] = useState("");
  const [weeks, setWeeks] = useState(1);
  const [menu, setMenu] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [drafting, setDrafting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removed, setRemoved] = useState<Entry | null>(null);
  const [sent, setSent] = useState<Sent | null>(null);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [leads, setLeads] = useState<Record<string, string>>({});
  const [dropped, setDropped] = useState<string[]>([]);
  const started = useRef<string | null>(null);

  useEffect(() => {
    if (started.current === id) return;
    started.current = id;
    const library = !view.notes;
    setSuggestion(library ? null : { title: view.title, steps: view.steps, notes: { ...EMPTY, ...view.notes }, entryId: view.library_entry_id, reason: view.reason ?? "" });
    setMode(library ? "library" : "ai");
    setDecision("pending");
    setTitle(view.title);
    setSteps(view.steps);
    setNotes(library ? EMPTY : { ...EMPTY, ...view.notes });
    setEntryId(view.library_entry_id);
    setOwnFix(view.own_fix);
    setBanner(library ? view.reason : null);
    setScopeId(view.scopes.find((s) => !s.why) ? scopeKey(view.scopes.find((s) => !s.why)!) : "");
  }, [id, view]);

  const many = teams
    .map((t) => view.scopes.find((s) => s.type === "team" && s.key === t))
    .filter((s): s is Scope => !!s)
    .map((s) => ({ scope: s, lead: s.managers.find((m) => m.id === leads[s.key]) ?? s.managers[0] ?? null, on: !dropped.includes(s.key) }));
  const multi = teams.length > 0;
  const chosen = many.filter((t) => t.on && t.lead);
  const scope = multi ? (chosen[0]?.scope ?? null) : (view.scopes.find((s) => scopeKey(s) === scopeId) ?? null);
  const managers = scope?.managers ?? [];
  const owner = managers[0] ?? null;
  const ownerName = owner?.name ?? "the manager";
  const base = owner ? view.alert_on : view.today;
  const dueOn = addDays(base, weeks * 7);
  const total = view.scopes.length;
  const worst = Math.max(0, ...view.scopes.filter((s) => s.type === "team" && !s.why).map((s) => s.counts?.n ?? 0));
  const scopeOptions = view.scopes.map((s) => ({
    value: scopeKey(s),
    label: s.type === "team" ? s.key : s.label,
    hint: s.why ?? (s.counts ? `${s.counts.n} of ${s.counts.m} raised ${driverName(view.driver).toLowerCase()}` : undefined),
    flag: s.type === "team" && !s.why && worst > 0 && s.counts?.n === worst ? "Needs it most" : undefined,
    disabled: !!s.why,
  }));

  const library = entries ?? [];
  const entry = library.find((e) => e.id === entryId) ?? null;

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await work();
    } catch (e) {
      setError(fail(e));
    } finally {
      setBusy(false);
    }
  };

  const pick = (e: Entry) =>
    run(async () => {
      await apiSend(`/api/hr/actions/${id}`, "PATCH", { library_entry_id: e.id, title: e.title, steps: e.text });
      setSuggestion(null);
      setMode("library");
      setTitle(e.title);
      setSteps(e.text);
      setNotes({ ...EMPTY, ...e.notes });
      setEntryId(e.id);
      setOwnFix(false);
      setBanner(null);
      setMenu(false);
    });

  const filled = useRef(false);
  useEffect(() => {
    if (filled.current || !entries || mode !== "library") return;
    filled.current = true;
    const e = entries.find((candidate) => candidate.id === entryId);
    if (e?.notes) setNotes((n) => (n.en || n.ms ? n : { ...EMPTY, ...e.notes }));
  }, [entries, mode, entryId]);

  const pickedFromUrl = useRef(false);
  const params = useSearchParams();
  const wanted = params.get("entry");
  const own = params.get("own");
  useEffect(() => {
    if (!own || pickedFromUrl.current || started.current !== id) return;
    pickedFromUrl.current = true;
    void addOwn(own);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [own, id]);
  useEffect(() => {
    if (!wanted || pickedFromUrl.current || !entries || started.current !== id) return;
    pickedFromUrl.current = true;
    const e = entries.find((candidate) => candidate.id === wanted);
    if (e && e.id !== view.library_entry_id) void pick(e);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted, entries, id]);

  const addOwn = (fixName = name) =>
    run(async () => {
      setMenu(false);
      setAdding(false);
      setDrafting(fixName.trim().slice(0, 60));
      const result = await apiSend<{ title: string; steps: string; notes: Notes | null }>(`/api/hr/actions/${id}/own-fix`, "POST", { name: fixName.trim().slice(0, 60) }).finally(() => setDrafting(null));
      setOwnFix(true);
      setEntryId(null);
      setNotes(EMPTY);
      setName("");
      if (result.notes) {
        setSuggestion({ title: result.title, steps: result.steps, notes: result.notes, entryId: null, reason: "You named this fix. The AI wrote the steps and the note." });
        setMode("ai");
        setDecision("pending");
        setTitle(result.title);
        setSteps(result.steps);
        setNotes(result.notes);
        setBanner(null);
      } else {
        setSuggestion(null);
        setMode("library");
        setTitle(result.title);
        setSteps("");
        setBanner("The AI is not available, so write the steps and the note yourself.");
      }
    });

  const remove = (e: Entry) =>
    run(async () => {
      await apiSend(`/api/hr/actions/library/${e.id}`, "DELETE");
      setRemoved(e);
    });
  const undoRemove = () =>
    run(async () => {
      await apiSend(`/api/hr/actions/library/${removed!.id}/restore`, "POST");
      setRemoved(null);
    });

  const accept = () => setDecision("accepted");
  const reject = () => {
    setTitle("");
    setSteps("");
    setNotes(EMPTY);
    setDecision("rejected");
  };
  const useDraft = () => {
    setTitle(suggestion!.title);
    setSteps(suggestion!.steps);
    setNotes(suggestion!.notes ?? EMPTY);
    setDecision("pending");
  };

  const tryAgain = () => addOwn(suggestion!.title);

  const pending = mode === "ai" && decision === "pending" && !drafting;
  const noteOk = !!notes.en.trim() && !!notes.ms.trim();
  const tooLong = LANGS.find(([l]) => words(notes[l]) > 40);
  const why = drafting
    ? "Wait for the AI draft."
    : pending
    ? "Accept or reject the AI draft first."
    : !title.trim() || !steps.trim()
      ? "Add the fix title and the message."
      : !scope
        ? multi ? "Tick at least one team with a team lead." : "Choose who the fix is for."
        : !noteOk
          ? "Add the note in English and Bahasa Malaysia."
          : tooLong
            ? "A note has at most 40 words."
            : null;
  const label = multi ? `Send to ${chosen.length} team ${chosen.length === 1 ? "lead" : "leads"}` : owner ? `Send to ${owner.name}` : "Assign to me";

  const send = () =>
    run(async () => {
      const target = scope!;
      await apiSend(`/api/hr/actions/${id}`, "PATCH", {
        title: title.trim(),
        steps: steps.trim(),
        scope: target.type === "team" ? { type: "team", team: target.key } : { type: "intake", month: target.key },
      });
      await apiSend(`/api/hr/actions/${id}/notice`, "POST", { notes: { en: notes.en, ms: notes.ms, zh: notes.zh || undefined } });
      if (multi) {
        setBatch(await apiSend<Batch>(`/api/hr/actions/${id}/batch`, "POST", { teams: chosen.map((t) => ({ team: t.scope.key, manager_id: t.lead!.id })), due_in_days: weeks * 7 }));
        return;
      }
      const result = await apiSend<{ held: boolean; alert_sent: boolean; alert_label: string | null }>(`/api/hr/actions/${id}/assign`, "POST", {
        owner: owner ? { manager_id: owner.id } : "hr",
        due_in_days: weeks * 7,
      });
      setSent({ ...result, alert_on: view.alert_on, manager: owner?.name ?? null });
    });

  const gets = owner
    ? view.held && !view.demo_mode
      ? `${owner.name} gets it ${shortDate(view.alert_on)}, with the weekly snapshot`
      : `${owner.name} gets it today`
    : "It stays with you";
  const telegram = [view.telegram.alert.replace("{title}", title || "…"), steps, ...(scope?.lines ?? []), view.telegram.due.replace("{date}", shortDate(dueOn))];
  const draftClass = pending ? "sp-input sp-input-ai" : "sp-input";
  const pendingMark = pending ? <AiMark label="Drafted for your new fix" /> : null;

  return (
    <>
      <PageHeader
        title={`New fix for ${driverName(view.driver)}`}
        sub={multi ? `${chosen.length} ${chosen.length === 1 ? "team" : "teams"} · one fix for each team lead` : scope ? `${scope.label} · ${scope.n} new ${scope.n === 1 ? "hire" : "hires"}` : undefined}
        right={
          sent ? (
            <span className="sp-ai sp-ai-reviewed">
              <ShieldCheck size={16} aria-hidden="true" />
              {sent.manager ? `Sent to ${sent.manager}` : "Assigned to you"}
            </span>
          ) : pendingMark
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          <section className="sp-section" aria-label="The fix">
            <div className="sp-section-head">
              <div className="sp-icontile sp-lane-fixes">
                <LaneIcon lane="fixes" size={18} />
              </div>
              <h2 className="sp-section-title">The fix</h2>
              {mode === "ai" && decision === "accepted" ? (
                <AiMark state="confirmed" reviewer={hr} label="Drafted with AI" />
              ) : null}
            </div>
            <div className="flex flex-col gap-4 p-4">
              {banner ? (
                <div className="sp-meta" role="status" style={{ background: "var(--waiting-soft)", color: "var(--waiting-ink)", padding: "8px 12px", borderRadius: "var(--radius-control)" }}>
                  {banner}
                </div>
              ) : null}

              <div className="relative flex flex-col gap-1">
                <span id="lib-label" className="sp-caption" style={{ fontWeight: 600 }}>
                  From fix library
                </span>
                <button
                  type="button"
                  className="sp-input flex items-center justify-between gap-3 text-left"
                  aria-haspopup="dialog"
                  aria-expanded={menu}
                  aria-labelledby="lib-label"
                  onClick={() => setMenu(!menu)}
                  disabled={!!sent || !!drafting}
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold">{ownFix ? (title || "Your own fix") : (entry?.title ?? "Pick a fix")}</span>
                    <span className="sp-caption truncate">{ownFix ? "Your own fix · saved to the library when you send" : (entry?.result ?? "")}</span>
                  </span>
                  <ChevronDown size={16} aria-hidden="true" />
                </button>
                {removed ? (
                  <div className="sp-meta flex flex-wrap items-center gap-2" role="status">
                    <span>Deleted “{removed.title}”.</span>
                    <button type="button" className="sp-btn sp-btn-secondary sp-lane-fixes" style={{ minHeight: 32, padding: "0 12px" }} onClick={undoRemove}>
                      Undo
                    </button>
                  </div>
                ) : null}
                {menu ? (
                  <div role="dialog" aria-label="Fix library" className="sp-card absolute left-0 right-0 top-full z-10 mt-1 flex flex-col" style={{ boxShadow: "var(--shadow-pop)" }}>
                    <div className="sp-section-meta px-4 py-2">Fix library · {driverName(view.driver)} · {library.length}</div>
                    {library.map((e) => (
                      <div key={e.id} className="flex items-center gap-1 border-t" style={{ borderColor: "var(--line-soft)" }}>
                        <button type="button" className="flex min-w-0 flex-1 flex-col px-4 py-2 text-left" style={{ background: "none", border: 0, font: "inherit", cursor: "pointer" }} aria-pressed={e.id === entryId && !ownFix} onClick={() => pick(e)}>
                          <span className="font-semibold">{e.title}</span>
                          <span className="sp-caption">{e.result}</span>
                        </button>
                        <button type="button" aria-label={`Delete ${e.title}`} title={`Delete ${e.title}`} className="px-3" style={{ background: "none", border: 0, cursor: "pointer", color: "var(--ink-muted)", minHeight: 40 }} onClick={() => remove(e)}>
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                    <div className="border-t p-2" style={{ borderColor: "var(--line-soft)" }}>
                      {adding ? (
                        <div className="flex flex-col gap-2 p-2">
                          <label htmlFor="new-fix" className="sp-caption" style={{ fontWeight: 600 }}>
                            Name your fix
                          </label>
                          <input id="new-fix" className="sp-input" maxLength={60} placeholder="e.g. Weekly 1:1 with a mentor" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                          <div className="flex gap-2">
                            <Button onClick={() => setAdding(false)}>Cancel</Button>
                            <Button variant="primary" lane="fixes" disabled={!name.trim() || busy} why={!name.trim() ? "Name the fix first" : null} onClick={() => addOwn()}>
                              Add and use
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button type="button" className="sp-btn sp-btn-secondary sp-lane-fixes" onClick={() => setAdding(true)}>
                          <Plus size={16} aria-hidden="true" />
                          Add your own fix
                        </button>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              {drafting ? (
                <div className="sp-meta sp-fade-in flex items-center gap-2" role="status" aria-live="polite" style={{ background: "var(--surface-sunken)", padding: "8px 12px", borderRadius: "var(--radius-control)" }}>
                  <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
                  <span>The AI is writing “{drafting}”: the message and the note. This takes a few seconds.</span>
                </div>
              ) : null}

              {decision === "rejected" && mode === "ai" && !drafting ? (
                <div className="sp-meta flex flex-wrap items-center gap-2">
                  <span>Your own words.</span>
                  <Button onClick={useDraft}>Use the AI draft instead</Button>
                </div>
              ) : null}

              <div className="flex flex-col gap-1">
                <label htmlFor="fix-title" className="sp-caption" style={{ fontWeight: 600 }}>
                  Fix title
                </label>
                <input id="fix-title" className={draftClass} maxLength={120} value={title} disabled={!!sent || !!drafting} onChange={(e) => setTitle(e.target.value)} placeholder="Short name for the fix" />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="fix-steps" className="sp-caption" style={{ fontWeight: 600 }}>
                  Message to {ownerName}
                </label>
                <textarea id="fix-steps" className={draftClass} rows={4} value={steps} disabled={!!sent || !!drafting} onChange={(e) => setSteps(e.target.value)} placeholder={`What you ask ${ownerName} to do. This is the Telegram message.`} />
                <span className="sp-caption">{words(steps)} of 60 words</span>
              </div>

              {pending && suggestion ? (
                <div className="sp-suggest-bar" role="group" aria-label="AI draft">
                  <span className="sp-meta flex min-w-0 flex-1 basis-[260px] flex-col gap-1">
                    <AiMark label="The AI filled in the fix, the message and the note" />
                    <span className="sp-ai-voice">
                      {suggestion.entryId ? (
                        <>
                          From the library: <strong style={{ color: "var(--ink)" }}>{library.find((e) => e.id === suggestion.entryId)?.title ?? "an entry"}</strong>. {suggestion.reason}
                        </>
                      ) : (
                        suggestion.reason
                      )}
                    </span>
                  </span>
                  <span className="flex flex-wrap gap-2">
                    <Button variant="primary" lane="ai" onClick={accept}>
                      Accept
                    </Button>
                    <Button onClick={reject}>Reject</Button>
                    <Button onClick={tryAgain} disabled={busy}>
                      Try again
                    </Button>
                  </span>
                </div>
              ) : null}
            </div>
          </section>

          <section className="sp-section" aria-label="Note to new hires">
            <div className="sp-section-head">
              <h2 className="sp-section-title">Note to new hires</h2>
              <span className="sp-section-meta">Sent when {ownerName} marks it done. It never says who raised it.</span>
            </div>
            <div className="flex flex-col gap-3 p-4">
              <Tabs label="Language" value={lang} onChange={setLang} items={LANGS} />
              {mode === "ai" && decision === "accepted" ? (
                <AiMark state="confirmed" reviewer={hr} label={lang === "en" ? "Drafted with AI" : "AI translation, accepted"} />
              ) : pending ? (
                <AiMark label={lang === "en" ? "English draft" : "AI translation, not accepted yet"} />
              ) : lang !== "en" && !notes[lang] ? (
                <span className="sp-caption">Write the {lang === "ms" ? "Bahasa Malaysia" : "中文"} version yourself. Only English and Bahasa Malaysia are needed.</span>
              ) : null}
              <textarea
                id="fix-note"
                aria-label={`Note in ${LANGS.find(([l]) => l === lang)![1]}`}
                className={draftClass}
                rows={3}
                disabled={!!sent || !!drafting}
                value={notes[lang]}
                placeholder={lang === "en" ? "What changed, in one or two sentences. Do not name anyone." : ""}
                onChange={(e) => setNotes({ ...notes, [lang]: e.target.value })}
              />
              <span className="sp-caption">{words(notes[lang])} of 40 words</span>
            </div>
          </section>

          {batch ? (
            <section className="sp-section" aria-label="Sent">
              <div className="flex flex-col gap-2 p-4" role="status">
                {batch.sent.map((r) => (
                  <div key={r.team} className="flex flex-wrap items-center justify-between gap-2">
                    <span className={r.id ? "font-semibold" : "sp-meta"}>
                      {r.team}: {r.id ? `sent to ${many.find((t) => t.scope.key === r.team)?.lead?.name ?? "the team lead"}` : `not sent. ${r.error}`}
                    </span>
                    {r.id ? (
                      <Button lane="fixes" href={`/fixes/${r.id}`}>
                        Open fix
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : sent ? (
            <section className="sp-section" aria-label="Sent">
              <div className="flex flex-wrap items-center gap-3 p-4">
                <span className="flex min-w-0 flex-1 basis-[260px] flex-col gap-0.5" role="status">
                  <span className="flex items-center gap-2 font-semibold">
                    <Clock size={16} aria-hidden="true" />
                    {sent.manager
                      ? sent.alert_sent
                        ? `Sent. ${sent.manager} has it on Telegram.`
                        : `Sent. ${sent.manager} gets it ${shortDate(sent.alert_on)}, with the weekly snapshot.`
                      : "Assigned to you."}
                  </span>
                  {sent.alert_label ? <span className="sp-caption">{sent.alert_label}</span> : null}
                </span>
                <Button variant="primary" lane="fixes" href={`/fixes/${id}`}>
                  Open fix
                </Button>
              </div>
            </section>
          ) : (
            <section className="sp-section" aria-label="Send">
              <div className="sp-section-head">
                <h2 className="sp-section-title">Send</h2>
              </div>
              <div className="flex flex-col gap-4 p-4">
                {multi ? (
                  <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
                    <legend className="sp-caption mb-1" style={{ fontWeight: 600 }}>
                      For these teams
                    </legend>
                    {many.map((t) => (
                      <div key={t.scope.key} className="flex flex-wrap items-center gap-3">
                        <label className="flex min-w-0 flex-1 basis-[200px] items-center gap-2">
                          <input type="checkbox" checked={t.on} onChange={() => setDropped((d) => (t.on ? [...d, t.scope.key] : d.filter((k) => k !== t.scope.key)))} />
                          <span>
                            {t.scope.key}
                          </span>
                        </label>
                        {t.scope.managers.length > 1 ? (
                          <Select auto label={`Team lead for ${t.scope.key}`} value={t.lead?.id ?? ""} onChange={(v) => setLeads((l) => ({ ...l, [t.scope.key]: v }))} options={t.scope.managers.map((m) => ({ value: m.id, label: m.name }))} />
                        ) : (
                          <span className="sp-caption">{t.lead ? t.lead.name : "No team lead"}</span>
                        )}
                      </div>
                    ))}
                  </fieldset>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  {multi ? null : (
                  <Field label="For" htmlFor="f-for">
                    <Select id="f-for" label="For" value={scopeId} onChange={setScopeId} options={scopeOptions} />
                  </Field>
                  )}
                  <Field label="Due" htmlFor="f-due">
                    <Select id="f-due" label="Due" value={String(weeks)} onChange={(v) => setWeeks(Number(v))} options={[1, 2, 3].map((w) => ({ value: String(w), label: `${shortDate(addDays(base, w * 7))} · ${w} ${w === 1 ? "week" : "weeks"}` }))} />
                  </Field>
                </div>
                {total === 0 ? <span className="sp-caption">No new hires to send this to yet.</span> : null}
                <div className="flex flex-wrap items-start gap-3">
                  <span className="sp-waiting flex-1 basis-[240px]">
                    <Clock size={16} aria-hidden="true" />
                    <span className="flex flex-col">
                      <span>{multi ? "Each team lead gets their own fix. No lead sees the other teams." : gets}</span>
                      {owner && view.demo_mode && view.alert_label ? <span className="sp-caption" style={{ fontWeight: 500 }}>{view.alert_label}</span> : null}
                    </span>
                  </span>
                  <Button variant="primary" lane="fixes" disabled={!!why || busy} why={why} onClick={send}>
                    <Send size={16} aria-hidden="true" />
                    {label}
                  </Button>
                </div>
                {error ? (
                  <span role="alert" className="sp-meta" style={{ color: "var(--serious-ink)" }}>
                    {error}
                  </span>
                ) : null}
              </div>
            </section>
          )}
          {sent && error ? <span role="alert" className="sp-meta">{error}</span> : null}
        </div>

        <aside aria-label="Context" className="flex min-w-0 flex-col gap-4">
          <section className="sp-section">
            <div className="sp-section-head">
              <div className="sp-icontile sp-lane-problems">
                <LaneIcon lane="problems" size={18} />
              </div>
              <h2 className="sp-section-title">Why this fix</h2>
            </div>
            <div className="flex flex-col gap-4 p-4">
              {scope?.counts ? (
                <div>
                  <CountBar count={scope.counts.n} of={scope.counts.m} label={`in ${scope.label}`} lane="problems" />
                  <span className="sp-caption">Snapshot {shortDate(scope.counts.week)}</span>
                </div>
              ) : null}
              {view.all_counts ? (
                <div>
                  <CountBar count={view.all_counts.n} of={view.all_counts.m} label="all new hires" lane="problems" />
                  <span className="sp-caption">At Day 14</span>
                </div>
              ) : (
                <CountBar notEnough />
              )}
            </div>
          </section>
          <section className="sp-section">
            <div className="sp-section-head">
              <h2 className="sp-section-title">What {multi ? "each team lead" : ownerName} gets</h2>
              <span className="sp-section-meta">Telegram</span>
            </div>
            <div className="flex flex-col gap-3 p-4">
              <div className="flex flex-col gap-2 text-[14px] leading-5" style={{ background: "var(--surface-sunken)", borderRadius: "var(--radius-control)", padding: 12 }} aria-label="Telegram preview">
                {telegram.map((line, i) => (
                  <span key={i} style={i === 0 ? { fontWeight: 700 } : undefined}>
                    {line}
                  </span>
                ))}
                <div className="flex gap-2">
                  {[view.telegram.accept, view.telegram.done].map((b) => (
                    <span key={b} className="sp-caption" style={{ border: "1px solid var(--line-strong)", borderRadius: 6, padding: "2px 10px", color: "var(--ink)" }}>
                      {b}
                    </span>
                  ))}
                </div>
              </div>
              <span className="sp-caption">No replies. No names.</span>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}

function Page() {
  const params = useSearchParams();
  const driver = params.get("driver");
  const resume = params.get("id");
  const [id, setId] = useState<string | null>(resume);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (resume || !driver || started.current) return;
    started.current = true;
    apiGet<{ id: string; driver: string; status: string; hiring_side: boolean }[]>("/api/hr/actions")
      .then((actions) => actions.find((a) => a.status === "draft" && a.driver === driver && !a.hiring_side) ?? apiSend<{ id: string }>("/api/hr/actions", "POST", { driver }))
      .then(({ id }) => setId(id), (e) => setError(fail(e)));
  }, [driver, resume]);

  const view = useApi<View>(id ? `/api/hr/actions/${id}/draft` : null, 0);
  const [first, setFirst] = useState<View | null>(null);
  useEffect(() => {
    if (view.data && !first) setFirst(view.data);
  }, [view.data, first]);
  const entries = useApi<Entry[]>(first ? `/api/hr/actions/library?driver=${first.driver}` : null, 0);

  if (!driver && !resume) return <Empty title="Pick a problem area first" sub="A fix starts from a shared problem." />;
  if (error) return <Empty title="Could not start a fix" sub={error} />;
  if (view.error) return <Empty title="This fix is not available" sub={fail(view.error)} />;
  if (!id || !first) return <Loading />;
  if (first.status !== "draft") return <Empty title="This fix has been sent" sub="Open it from the Fixes list." />;
  return <Editor key={id} id={id} view={first} entries={entries.data} teams={params.getAll("team")} />;
}

export default function Wrapped() {
  return (
    <Suspense fallback={<Loading />}>
      <Page />
    </Suspense>
  );
}
