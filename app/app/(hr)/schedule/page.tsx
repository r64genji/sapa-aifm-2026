"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Check, Sprout, UserRoundCheck, X } from "lucide-react";
import { ApiError, apiSend, useApi } from "@/components/sapa/data";
import { Button, Loading, PageHeader, driverName } from "@/components/sapa/ui";

type Track = { id: "new_hire" | "employee"; name: string; days: number[]; questions: string[] };

const BANK = ["ROLE_CLARITY", "MANAGER_SUPPORT", "BELONGING", "ONBOARDING_TRAINING", "WORKLOAD", "OPEN"];
const label = (id: string) => (id === "OPEN" ? "Open question" : driverName(id));
const sameTracks = (a: Track[], b: Track[]) => JSON.stringify(a) === JSON.stringify(b);

function DaysField({ days, onChange }: { days: number[]; onChange: (days: number[]) => void }) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const commit = (text: string) => {
    const parts = text.split(/[\s,;]+/).filter(Boolean);
    if (!parts.length) return;
    const numbers = parts.map(Number);
    if (numbers.some((n) => !Number.isInteger(n) || n < 1)) {
      setError("Use whole days, like 14.");
      return;
    }
    setError(null);
    setDraft("");
    onChange([...new Set([...days, ...numbers])].sort((a, b) => a - b));
  };
  return (
    <div className="flex flex-col gap-2">
      <span className="font-semibold">Days after joining</span>
      <div className="sp-chipbox">
        {days.map((d) => (
          <span key={d} className="sp-chip">
            Day {d}
            <button type="button" className="sp-chip-x" aria-label={`Remove day ${d}`} onClick={() => onChange(days.filter((x) => x !== d))}>
              <X size={13} strokeWidth={2.5} aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          className="sp-chip-input"
          aria-label="Add a day"
          placeholder={days.length ? "Add a day" : "Add a day, like 7"}
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
      <span className="sp-caption">Press Enter to add a day. Day 1 is the day they scan the join code.</span>
    </div>
  );
}

function TrackCard({ track, onChange }: { track: Track; onChange: (track: Track) => void }) {
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
      <DaysField days={track.days} onChange={(days) => onChange({ ...track, days })} />
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
  const replace = (next: Track) => {
    setMessage(null);
    setTracks(tracks.map((t) => (t.id === next.id ? next : t)));
  };
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Check-in schedule" sub="Choose how often Sapa checks in, and what it asks, for new hires and for longer-serving employees." />
      <div className="grid items-start gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        {tracks.map((track) => (
          <TrackCard key={track.id} track={track} onChange={replace} />
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
