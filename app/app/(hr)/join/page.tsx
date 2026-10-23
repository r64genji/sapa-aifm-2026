"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { apiSend, useApi } from "@/components/sapa/data";
import { Button, Dialog, Loading, PageHeader, Tabs } from "@/components/sapa/ui";

type TeamLink = { team: string; lead: string; link: string; lead_link: string | null; lead_linked: boolean };

function Qr({ link, label }: { link: string; label: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    QRCode.toDataURL(link, { margin: 1, width: 240 }).then(setSrc);
  }, [link]);
  return src ? <img src={src} width={160} height={160} alt={`QR code to join ${label}`} /> : <div style={{ width: 160, height: 160 }} />;
}

function CopyButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
  };
  return <Button onClick={copy}>{copied ? "Copied" : "Copy link"}</Button>;
}

function SaveButton({ link, name }: { link: string; name: string }) {
  const save = async () => {
    const a = document.createElement("a");
    a.href = await QRCode.toDataURL(link, { margin: 2, width: 1024 });
    a.download = `${name}.png`;
    a.click();
  };
  return <Button onClick={save}>Save image</Button>;
}

function TeamCard({ row, leads }: { row: TeamLink; leads: boolean }) {
  const link = leads ? row.lead_link : row.link;
  return (
    <section className="sp-card flex flex-col items-start gap-3 p-5" aria-label={row.team}>
      <div className="flex flex-col gap-0.5">
        <span className="text-[15px] font-bold">{row.team}</span>
        <span className="sp-caption">{leads ? `Team lead: ${row.lead}${row.lead_linked ? " · phone linked" : ""}` : `Team lead: ${row.lead}`}</span>
      </div>
      {link ? (
        <>
          <Qr link={link} label={leads ? `${row.team} as team lead ${row.lead}` : row.team} />
          <div className="flex flex-wrap gap-2">
            <CopyButton link={link} />
            <SaveButton link={link} name={`sapa-join-${leads ? "lead-" : ""}${row.team.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} />
          </div>
        </>
      ) : (
        <span className="sp-muted">Phone linked. Gets fixes in Telegram.</span>
      )}
    </section>
  );
}

function AddTeam({ onAdded }: { onAdded: (team: string) => void }) {
  const [open, setOpen] = useState(false);
  const [team, setTeam] = useState("");
  const [lead, setLead] = useState("");
  const [error, setError] = useState("");
  const close = () => {
    setOpen(false);
    setTeam("");
    setLead("");
    setError("");
  };
  const save = async () => {
    try {
      await apiSend("/api/hr/team-links", "POST", { team: team.trim(), lead: lead.trim() });
      onAdded(team.trim());
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add the team");
    }
  };
  const ready = team.trim() && lead.trim();
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={16} aria-hidden="true" />
        Add team
      </Button>
      {open && (
        <Dialog title="Add a team" onClose={close}>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (ready) void save();
            }}
          >
            <label htmlFor="new-team" className="sp-caption" style={{ fontWeight: 600 }}>
              Team name
            </label>
            <input id="new-team" className="sp-input" maxLength={60} placeholder="e.g. Customer Support" value={team} onChange={(e) => setTeam(e.target.value)} autoFocus />
            <label htmlFor="new-lead" className="sp-caption" style={{ fontWeight: 600 }}>
              Team lead
            </label>
            <input id="new-lead" className="sp-input" maxLength={60} placeholder="e.g. Aisyah Rahman" value={lead} onChange={(e) => setLead(e.target.value)} />
            {error && <span role="alert" style={{ color: "var(--serious)" }}>{error}</span>}
            <div className="flex items-start gap-2">
              <Button type="button" onClick={close}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={!ready} why={!ready ? "Name the team and its lead first" : null}>
                Add and make codes
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </>
  );
}

export default function Page() {
  const { data } = useApi<{ intake: string; teams: TeamLink[] }>("/api/hr/team-links", 60000);
  const [who, setWho] = useState<"hires" | "leads">("hires");
  const [added, setAdded] = useState("");
  if (!data) return <Loading />;
  const leads = who === "leads";
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Join codes · ${data.intake}`} right={
          <div className="flex flex-wrap items-center gap-2">
            <Tabs label="Show codes for" value={who} onChange={setWho} items={[["hires", "New hires"], ["leads", "Team leads"]]} />
            <AddTeam onAdded={setAdded} />
          </div>
        }
      />
      {added && <p className="m-0" role="status">{`Added ${added}. Its new hire code and team lead code are below. Switch tabs to see each one.`}</p>}
      <p className="m-0 sp-muted">
        {leads
          ? "Each team lead scans their own code once, on their own phone, to get fixes and mark them done in Telegram."
          : "Hand these out yourself, for example on each team's Day 1 welcome sheet. Do not ask team leads to hand them out."}
      </p>
      <div key={who} className="sp-stagger grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
        {data.teams.map((row) => (
          <TeamCard key={row.team} row={row} leads={leads} />
        ))}
      </div>
    </div>
  );
}
