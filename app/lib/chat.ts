export type Turn = { from: "bot" | "new_hire"; text: string; route?: "fixed" | "ai" };
export type Input = {
  language_setting: string;
  topic: "low_tap" | "light" | "fix_follow_up";
  taps: { driver: string; question: string; answer: string; score: number }[];
  focus_driver: string | null;
  conversation: Turn[];
  questions_asked: number;
};
