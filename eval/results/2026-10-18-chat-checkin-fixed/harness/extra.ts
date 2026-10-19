import { packs } from "@/lib/packs";
export const extra = {
  en: {
    sexual_harassment: ["touching my shoulder", "touching my arm", "touching my arms", "touching my leg", "touching my legs", "touching my back", "touching my waist", "touching my hand", "touching my hands", "touching my hair", "touching my thigh", "touching my neck", "touching my face", "touching my body", "touching my chest", "touching my bum", "touches my shoulder", "touches my arm", "touches my arms", "touches my leg", "touches my legs", "touches my back", "touches my waist", "touches my hand", "touches my hands", "touches my hair", "touches my thigh", "touches my neck", "touches my face", "touches my body", "touches my chest", "touches my bum", "touched my shoulder", "touched my arm", "touched my arms", "touched my leg", "touched my legs", "touched my back", "touched my waist", "touched my hand", "touched my hands", "touched my hair", "touched my thigh", "touched my neck", "touched my face", "touched my body", "touched my chest", "touched my bum", "keeps touching my shoulder", "keeps touching my arm", "keeps touching my arms", "keeps touching my leg", "keeps touching my legs", "keeps touching my back", "keeps touching my waist", "keeps touching my hand", "keeps touching my hands", "keeps touching my hair", "keeps touching my thigh", "keeps touching my neck", "keeps touching my face", "keeps touching my body", "keeps touching my chest", "keeps touching my bum", "comments on my body", "comment on my body", "commented on my body", "comments about my body"],
    forced_labour_indicator: ["debt to the agency", "owe the agency", "owe my agent", "pay back the agency", "repay the agent", "pay back before i can leave", "repay before i can leave", "cannot quit until i pay", "cant quit until i pay"],
  },
  ms: {
    sexual_harassment: ["sentuh bahu saya", "sentuh badan saya", "komen badan saya", "komen pasal badan saya"],
    forced_labour_indicator: ["berhutang dengan ejen", "hutang kepada ejen", "kalau berhenti kena bayar", "berhenti kena bayar", "berhenti mesti bayar", "berhenti perlu bayar"],
  },
  zh: {
    sexual_harassment: ["摸我的", "评论我的身体", "说我的身材"],
    forced_labour_indicator: ["还清机票", "还清费用", "还清中介", "费用才能离开", "钱才能离开", "费用才可以离开", "钱才可以离开", "费用才能辞职", "钱才能辞职", "欠中介"],
  },
} as const;
export function addExtra() {
  for (const [lang, cats] of Object.entries(extra))
    for (const [cat, phrases] of Object.entries(cats))
      (packs as any)[lang].safety.keywords[cat].push(...phrases);
}
