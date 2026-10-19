"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { useApi } from "@/components/sapa/data";
import { Button, Loading, PageHeader } from "@/components/sapa/ui";

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

function TeamCard({ row }: { row: TeamLink }) {
  return (
    <section className="sp-card flex flex-col items-start gap-3 p-5" aria-label={row.team}>
      <div className="flex flex-col gap-0.5">
        <span className="text-[15px] font-bold">{row.team}</span>
        <span className="sp-caption">New hires join here</span>
      </div>
      <Qr link={row.link} label={row.team} />
      <CopyButton link={row.link} />
      <div className="flex w-full flex-col items-start gap-3 pt-3" style={{ borderTop: "1px solid var(--line-soft)" }}>
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold">Team lead: {row.lead}</span>
          <span className="sp-caption">{row.lead_linked ? "Phone linked. Gets fixes in Telegram." : "Scan on the team lead's phone to get fixes in Telegram."}</span>
        </div>
        {row.lead_link ? (
          <>
            <Qr link={row.lead_link} label={`${row.team} as team lead ${row.lead}`} />
            <CopyButton link={row.lead_link} />
          </>
        ) : null}
      </div>
    </section>
  );
}

export default function Page() {
  const { data } = useApi<{ intake: string; teams: TeamLink[] }>("/api/hr/team-links", 60000);
  if (!data) return <Loading />;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Join codes · ${data.intake}`} />
      <p className="m-0 sp-muted">Hand these out yourself, for example on each team&apos;s Day 1 welcome sheet. Do not ask team leads to hand them out.</p>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
        {data.teams.map((row) => (
          <TeamCard key={row.team} row={row} />
        ))}
      </div>
    </div>
  );
}
