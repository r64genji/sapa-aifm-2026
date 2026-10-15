"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useApi } from "@/components/sapa/data";
import { AiMark, Button, CountBar, Loading, PageHeader, driverName, dayLabel, shortDate } from "@/components/sapa/ui";

type Share = { enough: true; n: number; m: number; reviewed?: number; ai_confident?: number } | { enough: false; have: number; need: number };
type Detail = {
  driver: string;
  card: Share & { note?: string | null };
  weekly: (Share & { week: string })[];
  by_day: (Share & { touchpoint: number })[];
  by_intake: (Share & { intake: string })[];
  by_role: (Share & { role: string })[];
};
type Groups = { status: "unavailable" } | { status: "ok"; enough: false; have: number; need: number } | { status: "ok"; groups: { title: string; n: number; reply_ids: string[] }[]; not_grouped: number };
type Entry = { id: string; title: string; text: string; used: number; result: string; evidence: string };
type Action = { driver: string; status: string; owner: string | null; assigned_at: string | null; title: string; library_entry_id: string | null };

const bar = (s: Share, label: string) => (s.enough ? <CountBar count={s.n} of={s.m} label={label} /> : <CountBar notEnough have={s.have} need={s.need} />);

function Breakdown({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 basis-[240px] flex-col gap-2">
      <h4 className="m-0 text-[14px] font-bold">{title}</h4>
      {note ? <span className="sp-caption">{note}</span> : null}
      {children}
    </div>
  );
}

function Step({ n, title, sub }: { n: number; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-3">
      <span aria-hidden="true" className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-full font-bold" style={{ background: "var(--problems-soft)", color: "var(--problems)" }}>
        {n}
      </span>
      <div className="flex flex-col">
        <h3 className="m-0 text-[17px] font-bold">{title}</h3>
        <span className="sp-meta">{sub}</span>
      </div>
    </div>
  );
}

export default function Page({ params }: { params: Promise<{ driver: string }> }) {
  const { driver } = use(params);
  const [team, setTeam] = useState("");
  const detail = useApi<Detail>(`/api/hr/themes/${driver}?touchpoint=14`);
  const teamDetail = useApi<Detail>(team ? `/api/hr/themes/${driver}?touchpoint=14&team=${encodeURIComponent(team)}` : null);
  const groups = useApi<Groups>(`/api/hr/themes/${driver}/groups?touchpoint=14`);
  const library = useApi<Entry[]>(`/api/hr/actions/library?driver=${driver}`);
  const actions = useApi<Action[]>("/api/hr/actions");
  const teams = useApi<string[]>("/api/hr/teams");
  if (!detail.data || !library.data || !actions.data) return <Loading />;

  const d = detail.data;
  const card = d.card;
  const live = actions.data.filter((a) => a.driver === driver && (a.status === "assigned" || a.status === "accepted"));
  const calibrating = card.enough && !!card.note;
  const g = groups.data;

  return (
    <>
      <p className="m-0">
        <Link href="/problems" className="sp-meta">
          Back to shared problems
        </Link>
      </p>
      <PageHeader title={driverName(driver)} sub={`${dayLabel(14)} check-in`} />
      <section className="sp-card flex flex-col gap-3 p-5">
        {card.enough ? (
          <>
            <span className="sp-num text-[40px] font-bold leading-[44px]">
              {card.n} of {card.m}
            </span>
            <span>who answered the Day 14 check-in</span>
            <span className="sp-caption">
              {card.reviewed ?? 0} you checked · {card.ai_confident ?? 0} the AI was sure about
            </span>
          </>
        ) : (
          <CountBar notEnough have={card.have} need={card.need} />
        )}
        {calibrating ? <span className="sp-caption">The AI is still new here, so you check each new reply before it counts.</span> : null}
        {live.map((a) => (
          <span key={a.title} className="sp-meta">
            Fix in progress: {a.title} · {a.status === "accepted" ? `${a.owner} accepted` : `sent to ${a.owner}${a.assigned_at ? ` ${shortDate(a.assigned_at)}` : ""}, not accepted yet`}
          </span>
        ))}
      </section>

      {g && g.status === "ok" ? (
        <section className="sp-card flex flex-col gap-4 p-5">
          <Step n={1} title="What new hires mean" sub="The AI groups replies that say the same thing. Check it before you act." />
          {"groups" in g ? (
            <>
              {g.groups.map((group) => (
                <div key={group.title} className="flex flex-col gap-2">
                  <AiMark label={group.title} />
                  {card.enough ? <CountBar count={group.n} of={card.n} label="of these replies" /> : null}
                  <Link href="/replies" className="sp-meta">
                    Read the {group.n} replies
                  </Link>
                </div>
              ))}
              {g.not_grouped > 0 ? (
                <span className="sp-caption">
                  {g.not_grouped} more replies are not grouped: each idea came from fewer than 5 people.{" "}
                  <Link href="/replies">Read them</Link>
                </span>
              ) : null}
            </>
          ) : (
            <span className="sp-muted">
              {g.have} of {g.need} needed. Shows once {g.need} people answer Day 14.
            </span>
          )}
        </section>
      ) : null}

      <section className="sp-card flex flex-col gap-4 p-5">
        <Step n={2} title="Who has it" sub="Counted by Sapa from the labels. Each group shows who it is out of." />
        <div className="flex flex-wrap gap-6">
          <Breakdown title="When it starts" note="The same group, at each check-in">
            {d.by_day.map((s) => (
              <div key={s.touchpoint}>{bar(s, `at ${dayLabel(s.touchpoint)}`)}</div>
            ))}
          </Breakdown>
          <Breakdown title="By intake">
            {d.by_intake.map((s) => (
              <div key={s.intake}>{bar(s, `in the ${new Date(`${s.intake}-01T00:00:00Z`).toLocaleString("en-GB", { month: "long", timeZone: "UTC" })} intake`)}</div>
            ))}
          </Breakdown>
          <Breakdown title="By role">
            {d.by_role.map((s) => (
              <div key={s.role}>{bar(s, `${s.role}`)}</div>
            ))}
          </Breakdown>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="team" className="text-[14px] font-bold">
            See one team
          </label>
          <select id="team" className="sp-input" style={{ maxWidth: 320 }} value={team} onChange={(e) => setTeam(e.target.value)}>
            <option value="">Choose a team</option>
            {(teams.data ?? []).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {!team ? (
            <span className="sp-meta">Pick a team to see how many in it raised {driverName(driver)}.</span>
          ) : teamDetail.data ? (
            teamDetail.data.card.enough ? (
              <CountBar count={teamDetail.data.card.n} of={teamDetail.data.card.m} label="in this team" />
            ) : (
              <>
                <CountBar notEnough />
                <span className="sp-meta">
                  {teamDetail.data.card.have} of {teamDetail.data.card.need} needed. Shows once {teamDetail.data.card.need} people answer Day 14.
                </span>
              </>
            )
          ) : (
            <Loading />
          )}
          <span className="sp-caption">One team at a time, from 5 people. Teams are never shown side by side.</span>
        </div>
      </section>

      <section className="sp-card flex flex-col gap-4 p-5">
        <Step n={3} title="Fix it" sub="Fixes from your library, best match first, with how each worked here before." />
        {library.data.map((f, i) => (
          <div key={f.id} className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 basis-[260px] flex-col gap-1">
              {i === 0 ? <span className="sp-caption font-bold">Best match</span> : null}
              {live.some((a) => a.library_entry_id === f.id) ? <span className="sp-caption font-bold">Fix in progress</span> : null}
              <div className="text-[15px] font-bold">{f.title}</div>
              <span className="sp-meta">{f.text}</span>
              <span className="sp-num sp-meta">{f.result}</span>
            </div>
            <Button variant={i === 0 ? "primary" : "secondary"} lane="fixes" href={`/fixes/new?driver=${driver}&entry=${f.id}`}>
              Draft this fix
            </Button>
          </div>
        ))}
        <span className="sp-meta">
          None of these fit? <Link href={`/fixes/new?driver=${driver}`}>Write your own fix</Link>
        </span>
      </section>
    </>
  );
}
