"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { useApi } from "@/components/sapa/data";
import { Button, Loading, PageHeader, Tabs } from "@/components/sapa/ui";

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
          <CopyButton link={link} />
        </>
      ) : (
        <span className="sp-muted">Phone linked. Gets fixes in Telegram.</span>
      )}
    </section>
  );
}

export default function Page() {
  const { data } = useApi<{ intake: string; teams: TeamLink[] }>("/api/hr/team-links", 60000);
  const [who, setWho] = useState<"hires" | "leads">("hires");
  if (!data) return <Loading />;
  const leads = who === "leads";
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Join codes · ${data.intake}`} right={<Tabs label="Show codes for" value={who} onChange={setWho} items={[["hires", "New hires"], ["leads", "Team leads"]]} />} />
      <p className="m-0 sp-muted">
        {leads
          ? "Each team lead scans their own code once, on their own phone, to get fixes and mark them done in Telegram."
          : "Hand these out yourself, for example on each team's Day 1 welcome sheet. Do not ask team leads to hand them out."}
      </p>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
        {data.teams.map((row) => (
          <TeamCard key={row.team} row={row} leads={leads} />
        ))}
      </div>
    </div>
  );
}
