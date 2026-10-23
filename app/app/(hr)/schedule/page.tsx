"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Check, Sprout, UserRoundCheck, X } from "lucide-react";
import { ApiError, apiSend, useApi } from "@/components/sapa/data";
import { Button, Loading, PageHeader, Select, driverName } from "@/components/sapa/ui";

type Track = { id: "new_hire" | "employee"; name: string; days: number[]; questions: string[] };

const BANK = ["ROLE_CLARITY", "MANAGER_SUPPORT", "BELONGING", "ONBOARDING", "TRAINING", "WORKLOAD", "OPEN"];
const label = (id: string) => (id === "OPEN" ? "Open question" : driverName(id));
const sameTracks = (a: Track[], b: Track[]) => JSON.stringify(a) === JSON.stringify(b);
const dayOfMonth = (month: number) => Math.floor((month * 365) / 12);
const monthOfDay = (day: number) => Math.round((day * 12) / 365);
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const friendly = (day: number) => {
  if (day < 28 && day % 7 === 0) return plural(day / 7, "week");
  if (day >= 28 && Math.abs(day - dayOfMonth(monthOfDay(day))) <= 1) return plural(monthOfDay(day), "month");
  return null;
};
const listOf = (items: (string | number)[]) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`);

const UNITS = [
  { value: "days", label: "Days", toDay: (n: number) => n },
  { value: "weeks", label: "Weeks", toDay: (n: number) => n * 7 },
  { value: "months", label: "Months", toDay: dayOfMonth },
];
const EVERY = [
  { value: "1", label: "Every month" },
  { value: "2", label: "Every 2 months" },
  { value: "3", label: "Every 3 months" },
  { value: "6", label: "Every 6 months" },
  { value: "12", label: "Every year" },
];
const YEARS = [
  { value: "1", label: "For 1 year" },
  { value: "2", label: "For 2 years" },
  { value: "3", label: "For 3 years" },
];

const repeatDays = (lastNewHireDay: number, every: number, years: number) =>
  Array.from({ length: (years * 12) / every }, (_, i) => dayOfMonth(monthOfDay(lastNewHireDay) + every * (i + 1)));

const repeatOf = (days: number[], lastNewHireDay: number) => {
  for (const every of [1, 2, 3, 6, 12])
    for (const years of [1, 2, 3])
      if (JSON.stringify(repeatDays(lastNewHireDay, every, years)) === JSON.stringify(days)) return { every, years };
  return null;
};

function DaysField({ days, onChange }: { days: number[]; onChange: (days: number[]) => void }) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState(UNITS[0]);
  const commit = (text: string) => {
    const parts = text.split(/[\s,;]+/).filter(Boolean);
    if (!parts.length) return;
    const numbers = parts.map(Number);
    if (numbers.some((n) => !Number.isInteger(n) || n < 1)) {
      setError(`Use whole ${unit.value}, like 2.`);
      return;
    }
    setError(null);
    setDraft("");
    onChange([...new Set([...days, ...numbers.map(unit.toDay)])].sort((a, b) => a - b));
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold">Days after joining</span>
        <Select auto label="Add in" value={unit.value} onChange={(v) => setUnit(UNITS.find((u) => u.value === v)!)} options={UNITS.map((u) => ({ value: u.value, label: `Add in ${u.value}` }))} />
      </div>
      <div className="sp-chipbox">
        {days.map((d) => (
          <span key={d} className="sp-chip">
            Day {d}
            {friendly(d) ? <span style={{ fontWeight: 500, opacity: 0.75 }}>· {friendly(d)}</span> : null}
            <button type="button" className="sp-chip-x" aria-label={`Remove day ${d}`} onClick={() => onChange(days.filter((x) => x !== d))}>
              <X size={13} strokeWidth={2.5} aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          className="sp-chip-input"
          aria-label="Add a day"
          placeholder={`Add ${unit.value === "days" ? "a day" : unit.value}, like ${unit.value === "days" ? 7 : 2}`}
          value={draft}
          inputMode="numeric"
          onChange={(e) => {
            setError(null);
            if (/[,;\s]$/.test(e.target.value)) commit(e.target.value);
            else setDraft(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit(draft);
            } else if (e.key === "Backspace" && !draft && days.length) onChange(days.slice(0, -1));
          }}
          onBlur={() => commit(draft)}
        />
      </div>
      {error ? <span className="sp-caption" style={{ color: "var(--serious)" }} role="alert">{error}</span> : null}
      <span className="sp-caption">Press Enter to add. Day 1 is the day they scan the join code.</span>
    </div>
  );
}

function RepeatField({ days, lastNewHireDay, onChange }: { days: number[]; lastNewHireDay: number; onChange: (days: number[]) => void }) {
  const repeat = repeatOf(days, lastNewHireDay);
  const every = repeat?.every ?? 3;
  const years = repeat?.years ?? 1;
  const custom = repeat ? [] : [{ value: "custom", label: "Custom days", disabled: true }];
  return (
    <div className="flex flex-col gap-2">
      <span className="font-semibold">How often</span>
      <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        <Select label="How often" value={repeat ? String(every) : "custom"} onChange={(v) => onChange(repeatDays(lastNewHireDay, Number(v), years))} options={[...custom, ...EVERY]} />
        <Select label="For how long" value={repeat ? String(years) : "custom"} onChange={(v) => onChange(repeatDays(lastNewHireDay, every, Number(v)))} options={[...custom, ...YEARS]} />
      </div>
      <span className="sp-meta sp-num">
        {repeat ? `Month ${listOf(days.map(monthOfDay))} after joining.` : `Day ${listOf(days)} after joining.`}
      </span>
      <span className="sp-caption">
        {repeat
          ? `Starts after the last new hire check-in (month ${monthOfDay(lastNewHireDay)}).`
          : "These days were set by hand. Pick how often to replace them."}
      </span>
    </div>
  );
}

function TrackCard({ track, lastNewHireDay, onChange }: { track: Track; lastNewHireDay: number; onChange: (track: Track) => void }) {
  const toggle = (id: string) =>
    onChange({ ...track, questions: track.questions.includes(id) ? track.questions.filter((q) => q !== id) : [...track.questions, id] });
  const Icon = track.id === "new_hire" ? Sprout : UserRoundCheck;
  const lane = track.id === "new_hire" ? "problems" : "fixes";
  return (
    <section className="sp-card flex flex-col gap-5 p-5" aria-label={track.name}>
      <header className="flex items-start gap-3">
        <span className={`sp-icontile sp-lane-${lane}`} style={{ width: 40, height: 40, flexBasis: 40 }}>
          <Icon size={20} strokeWidth={2} aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h2 className="m-0 text-[17px] font-bold">{track.name}</h2>
          <p className="m-0 sp-meta">
            {track.id === "new_hire" ? "For people in their first six months." : "For people after their first six months."}
          </p>
        </div>
        <span className="sp-pill sp-num">
          <CalendarClock size={13} aria-hidden="true" />
          {track.days.length} check-in{track.days.length === 1 ? "" : "s"}
        </span>
      </header>
      {track.id === "new_hire" ? (
        <DaysField days={track.days} onChange={(days) => onChange({ ...track, days })} />
      ) : (
        <RepeatField days={track.days} lastNewHireDay={lastNewHireDay} onChange={(days) => onChange({ ...track, days })} />
      )}
      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-2 flex w-full items-center justify-between p-0 font-semibold">
          Questions
          <span className="sp-caption sp-num">{track.questions.length} of {BANK.length} on</span>
        </legend>
        {BANK.map((id) => {
          const on = track.questions.includes(id);
          return (
            <label key={id} className={`sp-qrow${on ? " is-on" : ""}`}>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-semibold">{label(id)}</span>
                {id === "OPEN" ? <span className="sp-caption">A short chat</span> : null}
              </span>
              <input type="checkbox" className="sp-switch" checked={on} onChange={() => toggle(id)} />
            </label>
          );
        })}
      </fieldset>
    </section>
  );
}

export default function Page() {
  const { data } = useApi<Track[]>("/api/hr/tracks", 0);
  const [tracks, setTracks] = useState<Track[] | null>(null);
  const [saved, setSaved] = useState<Track[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    if (data && !tracks) {
      setTracks(data);
      setSaved(data);
    }
  }, [data, tracks]);
  if (!tracks || !saved) return <Loading />;
  const dirty = !sameTracks(tracks, saved);
  const save = async () => {
    try {
      const next = await apiSend<Track[]>("/api/hr/tracks", "PUT", { tracks });
      setTracks(next);
      setSaved(next);
      setMessage("Saved. New joiners get these days. Check-ins not yet sent use these questions.");
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : "Something went wrong");
    }
  };
  const lastNewHireDay = (list: Track[]) => list.find((t) => t.id === "new_hire")!.days.at(-1) ?? 0;
  const replace = (next: Track) => {
    setMessage(null);
    setTracks(
      tracks.map((t) => {
        if (t.id === next.id) return next;
        const repeat = next.id === "new_hire" && repeatOf(t.days, lastNewHireDay(tracks));
        return repeat ? { ...t, days: repeatDays(next.days.at(-1) ?? 0, repeat.every, repeat.years) } : t;
      }),
    );
  };
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Check-in schedule" sub="Choose how often Sapa checks in, and what it asks, for new hires and for longer-serving employees." />
      <div className="grid items-start gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        {tracks.map((track) => (
          <TrackCard key={track.id} track={track} lastNewHireDay={lastNewHireDay(tracks)} onChange={replace} />
        ))}
      </div>
      <div className="sp-savebar">
        <span aria-live="polite" className="sp-meta flex min-w-0 flex-1 items-center gap-2 font-semibold">
          {dirty ? (
            <>
              <span className="sp-dot" aria-hidden="true" />
              You have changes that are not saved.
            </>
          ) : message ? (
            <>
              <Check size={16} aria-hidden="true" style={{ color: "var(--problems)" }} />
              {message}
            </>
          ) : (
            "All changes saved."
          )}
        </span>
        <Button variant="primary" onClick={save} disabled={!dirty}>Save schedule</Button>
      </div>
    </div>
  );
}
