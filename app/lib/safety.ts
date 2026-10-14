import { packs, type Language } from "@/lib/packs";

export type Contacts = { general: string[]; forced_labour_indicator: string[] };

function words(text: string, spellings: Record<string, string>) {
  const plain = text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/(\p{L})\1{2,}/gu, "$1$1")
    .trim();
  return ` ${plain
    .split(" ")
    .map((word) => spellings[word] ?? word)
    .join(" ")} `;
}

export function detect(text: string): string | null {
  for (const { safety } of Object.values(packs)) {
    const said = words(text, safety.spellings);
    for (const [category, phrases] of Object.entries(safety.keywords)) {
      if (phrases.some((phrase) => said.includes(words(phrase, safety.spellings)))) return category;
    }
  }
  return null;
}

export function safeMessage(language: Language, category: string, contacts: Contacts) {
  const { safety } = packs[language];
  const lines =
    category === "forced_labour_indicator"
      ? [safety.forcedLabour, ...contacts.forced_labour_indicator, safety.labourAuthority]
      : [safety.message, ...contacts.general, ...(category === "sexual_harassment" ? [safety.tribunal] : [])];
  return lines.join("\n");
}
