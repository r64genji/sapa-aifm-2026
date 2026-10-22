export type Concern = {
  id: string;
  category: string;
  source: string;
  created_at: string;
  touchpoint: number | null;
  first_line: string | null;
};

export const CATEGORIES: Record<string, string> = {
  forced_labour_indicator: "Signs of forced labour",
  sexual_harassment: "Sexual harassment",
  self_harm_crisis: "Self-harm or crisis",
  bullying_threats: "Bullying or threats",
  harassment: "Harassment",
  discrimination: "Discrimination",
  safety_hazard: "Safety hazard",
  wage_legal: "Pay and wage law",
};

export const categoryName = (c: string) => CATEGORIES[c] ?? c.replace(/_/g, " ").replace(/^./, (x) => x.toUpperCase());

export const SOURCES: Record<string, string> = { keyword: "keyword check", model: "AI", both: "keyword check and AI" };

export const SENT_TO_COMPLAINTS = "Sapa told them to report it to HR through Contoh Speak Up. HR handles it there, not in Sapa.";
