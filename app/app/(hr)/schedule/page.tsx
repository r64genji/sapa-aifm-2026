"use client";

import { useEffect, useState } from "react";
import { ApiError, apiSend, useApi } from "@/components/sapa/data";
import { Button, Loading, PageHeader, driverName } from "@/components/sapa/ui";

type Track = { id: "new_hire" | "employee"; name: string; days: number[]; questions: string[] };

const BANK = ["ROLE_CLARITY", "MANAGER_SUPPORT", "BELONGING", "ONBOARDING_TRAINING", "WORKLOAD", "OPEN"];
const label = (id: string) => (id === "OPEN" ? "Open question (a short chat)" : driverName(id));
const parse = (text: string) => [...new Set(text.split(/[\s,]+/).filter(Boolean).map(Number))].filter((n) => Number.isInteger(n) && n > 0).sort((a, b) => a - b);

function TrackCard({ track, onChange }: { track: Track; onChange: (track: Track) => void }) {
  const [days, setDays] = useState(track.days.join(", "));
  useEffect(() => setDays(track.days.join(", ")), [track.days]);
  const toggle = (id: string) =>
    onChange({ ...track, questions: track.questions.includes(id) ? track.questions.filter((q) => q !== id) : [...track.questions, id] });
  return (
    <section className="sp-card flex flex-col gap-4 p-5" aria-label={track.name}>
      <h2 className="m-0 text-[17px] font-bold">{track.name}</h2>
      <p className="m-0 sp-muted">
        {track.id === "new_hire" ? "For people in their first six months." : "For people after their first six months."}
      </p>
      <label className="flex flex-col gap-1.5">
        <span className="font-semibold">Days after joining</span>
        <input
          className="sp-input"
          value={days}
          inputMode="numeric"
          onChange={(e) => setDays(e.target.value)}
          onBlur={() => onChange({ ...track, days: parse(days) })}
        />
        <span className="sp-caption">Separate the days with commas. Day 1 is the day they scan the join code.</span>
      </label>
      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="p-0 font-semibold">Questions</legend>
        {BANK.map((id) => (
          <label key={id} className="flex min-h-11 items-center gap-2.5">
            <input type="checkbox" checked={track.questions.includes(id)} onChange={() => toggle(id)} />
            {label(id)}
          </label>
        ))}
      </fieldset>
    </section>
  );
}

export default function Page() {
  const { data } = useApi<Track[]>("/api/hr/tracks", 0);
  const [tracks, setTracks] = useState<Track[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    if (data && !tracks) setTracks(data);
  }, [data, tracks]);
  if (!tracks) return <Loading />;
  const save = async () => {
    try {
      setTracks(await apiSend<Track[]>("/api/hr/tracks", "PUT", { tracks }));
      setMessage("Saved. New joiners get these days. Check-ins not yet sent use these questions.");
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : "Something went wrong");
    }
  };
  const replace = (next: Track) => setTracks(tracks.map((t) => (t.id === next.id ? next : t)));
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Check-in schedule" sub="Choose how often Sapa checks in, and what it asks, for new hires and for longer-serving employees." />
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        {tracks.map((track) => (
          <TrackCard key={track.id} track={track} onChange={replace} />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={save}>Save schedule</Button>
        {message ? <span aria-live="polite" className="font-semibold">{message}</span> : null}
      </div>
    </div>
  );
}
