import { Check, Clock } from "lucide-react";

export type Concern = {
  id: string;
  category: string;
  source: string;
  created_at: string;
  acknowledged_at: string | null;
  contact_recorded_at: string | null;
  dont_contact: boolean;
  closed_at: string | null;
  touchpoint: number | null;
  first_line: string | null;
  minutes_left: number;
  overdue: boolean;
};

export const CATEGORIES: Record<string, string> = {
  forced_labour_indicator: "Signs of forced labour",
  sexual_harassment: "Sexual harassment",
  self_harm_crisis: "Self-harm or crisis",
  bullying_threats: "Bullying or threats",
  harassment: "Harassment",
  discrimination: "Discrimination",
  safety_hazard: "Safety hazard",
  wage_or_legal: "Pay and wage law",
};

export const categoryName = (c: string) => CATEGORIES[c] ?? c.replace(/_/g, " ").replace(/^./, (x) => x.toUpperCase());

export const SOURCES: Record<string, string> = { keyword: "keyword check", model: "AI", both: "keyword check and AI" };

export const LEGAL = "Legal duty to act within 30 days";

export const contactedAt = (c: Concern) => c.contact_recorded_at || c.dont_contact;

export function nextStep(c: Concern) {
  if (!c.acknowledged_at) return { label: "Acknowledge", step: 1 };
  if (!contactedAt(c)) return { label: "Contact them", step: 2 };
  return { label: "Record outcome", step: 3 };
}

export function clockText(c: Concern) {
  if (c.acknowledged_at) return { tone: "ok", text: c.overdue ? "Acknowledged late" : "Acknowledged" };
  if (c.minutes_left < 0) return { tone: "past", text: `Overdue by ${Math.ceil(-c.minutes_left / 60)} h` };
  if (c.minutes_left <= 60) return { tone: "near", text: "Within 1 h" };
  return { tone: "calm", text: `Within ${Math.ceil(c.minutes_left / 60)} h` };
}

const TONES: Record<string, { background?: string; color?: string; border?: string }> = {
  past: { background: "var(--serious)", color: "var(--on-serious)" },
  near: { background: "var(--waiting-soft)", color: "var(--waiting-ink)" },
  calm: { border: "1px solid var(--line)" },
  ok: { color: "var(--ink-muted)" },
};

export function ClockChip({ c }: { c: Concern }) {
  const { tone, text } = clockText(c);
  const Icon = tone === "ok" ? Check : Clock;
  return (
    <span
      className="inline-flex min-h-7 items-center gap-1.5 text-[13px] font-semibold"
      style={{ padding: tone === "ok" ? 0 : "0 10px", borderRadius: "var(--radius-control)", ...TONES[tone] }}
    >
      <Icon size={14} strokeWidth={2.2} aria-hidden="true" />
      {text}
    </span>
  );
}
