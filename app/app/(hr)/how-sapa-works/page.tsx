"use client";

import { useApi } from "@/components/sapa/data";
import { Card, Empty, Loading, PageHeader } from "@/components/sapa/ui";

type Consent = Record<"ms" | "en", { version: string; text: string }>;

const SEES: [string, string, string][] = [
  ["Their words in check-ins", "Yes, with every view recorded", "Only if they chose to share"],
  ["Serious concerns", "Yes, HR only", "Never"],
  ["Questions to the handbook bot", "Grouped, no names, from 3 people", "Never"],
  ["Problem areas", "Counts from 5 people", "Weekly snapshot, \"fewer than 3\" for small counts"],
  ["Who took part", "Intake totals from 5 people", "Never"],
];

const NEVER = [
  ["Score emotions, mood, sentiment, personality or quit risk", "Watch cameras, keystrokes or anything people did not write to it", "Rank or compare teams or managers", "Decide anything about a person's job, probation or pay"],
  ["Let the AI write to a new hire, except a handbook answer it can quote", "Count anything the AI says: numbers come from the database", "Show a number from fewer than 5 people", "Use real employee data in this prototype"],
];

export default function Page() {
  const consent = useApi<Consent>("/api/hr/consent-text", 60000);
  const texts = consent.data;
  return (
    <>
      <PageHeader
        title="How Sapa treats people"
        sub="What new hires are told before they join, who sees their words, and what Sapa never does. Confidential, not anonymous."
      />
      <Card title="What new hires agree to" meta="The exact text the bot sends, in each language">
        {texts ? (
          <div className="grid gap-4 md:grid-cols-2">
            {([["ms", "Bahasa Malaysia · first message after choosing a language"], ["en", "English"]] as const).map(([key, label]) => (
              <div key={key} className="flex flex-col gap-1 rounded-[8px] px-3.5 py-3" style={{ background: "var(--surface-sunken)" }}>
                <span className="sp-caption">{label}</span>
                <span className="whitespace-pre-line">{texts[key].text}</span>
              </div>
            ))}
          </div>
        ) : consent.error ? (
          <Empty title="Could not load the consent text" sub={consent.error.message} />
        ) : (
          <Loading />
        )}
        <span className="sp-caption">Then: HR only (default) or HR and my manager · and an optional tick: HR may ask me one question if I resign</span>
      </Card>
      <Card title="Who sees what">
        <div className="overflow-x-auto">
          <table className="sp-table">
            <thead>
              <tr>
                <th scope="col"></th>
                <th scope="col">HR</th>
                <th scope="col">Their manager</th>
              </tr>
            </thead>
            <tbody>
              {SEES.map(([what, hr, manager]) => (
                <tr key={what}>
                  <td><span className="font-semibold">{what}</span></td>
                  <td>{hr}</td>
                  <td>{manager}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="What Sapa never does">
        <div className="grid gap-4 md:grid-cols-2">
          {NEVER.map((column, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              {column.map((line) => (
                <p key={line} className="m-0 text-[14px] leading-[21px]">· {line}</p>
              ))}
            </div>
          ))}
        </div>
      </Card>
      <Card title="AI helps, people decide">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className="font-semibold">The AI does</span>
            <p className="m-0 text-[14px] leading-[21px]">Label each reply with a problem area and the exact words it relied on · pick a fixed follow-up question · write a short summary over counts · draft a fix from your library · answer handbook questions with a quote.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="font-semibold">People decide</span>
            <p className="m-0 text-[14px] leading-[21px]">HR checks labels, offers help, approves every note and assigns every fix. Managers carry out fixes.</p>
          </div>
        </div>
      </Card>
    </>
  );
}
