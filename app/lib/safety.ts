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
  for (const category of Object.keys(packs.en.safety.keywords) as (keyof typeof packs.en.safety.keywords)[]) {
    for (const { safety } of Object.values(packs)) {
      const said = words(text, safety.spellings);
      if (safety.keywords[category].some((phrase) => said.includes(/\p{Script=Han}/u.test(phrase) ? phrase : words(phrase, safety.spellings)))) return category;
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
