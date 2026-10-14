import { checkinButton, checkinText } from "@/lib/checkin";
import { answerOffer } from "@/lib/offers";
import { scheduleFor } from "@/lib/scheduler";
import {
  liveLanguages,
  moveState,
  personByChat,
  personByToken,
  recordConsent,
  redeemInvite,
  setLanguage,
  setScope,
  stopPerson,
  type Person,
} from "@/lib/directory";
import { now } from "@/lib/clock";
import { packs, type CommandId, type Language } from "@/lib/packs";

export type Reply = { text: string; buttons?: { label: string; id: string; value: string }[] };
export type Outcome = { replies: Reply[]; menu?: Language };
export type Input = { kind: "text"; text: string } | { kind: "button"; id: string; value: string };

const none: Outcome = { replies: [] };

function commandId(text: string, languages: Language[]): CommandId | undefined {
  const [head, ...rest] = text.trim().split(/\s+/);
  const word = head.toLowerCase();
  if (word.startsWith("/")) {
    const name = word.slice(1).split("@")[0];
    for (const language of languages) {
      for (const [id, command] of Object.entries(packs[language].commands)) {
        if (command.name === name) return id as CommandId;
      }
    }
    return "help";
  }
  if (rest.length === 0 && languages.some((language) => packs[language].typedStop === word)) {
    return "stop";
  }
  return undefined;
}

function prompt(person: Person, languages: Language[]): Reply[] {
  const pack = packs[person.language];
  if (person.state === "invited") {
    return [
      {
        text: languages.map((language) => packs[language].languagePrompt).join("\n"),
        buttons: languages.map((language) => ({ label: packs[language].name, id: "lang", value: language })),
      },
    ];
  }
  if (person.state === "consent_shown") {
    return [
      {
        text: pack.consent,
        buttons: [
          { label: pack.agree, id: "consent", value: "yes" },
          { label: pack.decline, id: "consent", value: "no" },
        ],
      },
    ];
  }
  if (person.state === "active") return [{ text: pack.help }];
  return [];
}

async function join(chatId: number, token: string): Promise<Outcome> {
  const found = await personByToken(token);
  const refused = { replies: [{ text: packs[found?.language ?? "en"].invalidInvite }] };
  if (!found || found.invite_used_at || new Date(found.invite_expires_at) <= (await now())) {
    return refused;
  }
  const person = await redeemInvite(token, chatId);
  if (!person) return refused;
  return { replies: prompt(person, await liveLanguages(person.organisation_id)) };
}

async function press(person: Person, id: string, value: string, languages: Language[]): Promise<Outcome> {
  const pack = packs[person.language];
  if (id === "lang" && person.state === "invited" && languages.includes(value as Language)) {
    const language = value as Language;
    await setLanguage(person, language);
    await moveState(person, "invited", "consent_shown");
    return { replies: prompt({ ...person, language, state: "consent_shown" }, languages), menu: language };
  }
  if (id === "consent" && person.state === "consent_shown") {
    if (value === "no" && (await moveState(person, "consent_shown", "declined"))) {
      return { replies: [{ text: pack.declined }] };
    }
    if (value === "yes" && (await moveState(person, "consent_shown", "active"))) {
      await recordConsent(person, pack.consentVersion);
      await scheduleFor(person.id);
      return {
        replies: [
          {
            text: pack.visibilityPrompt,
            buttons: [
              { label: pack.visibilityHrOnly, id: "visibility", value: "hr_only" },
              { label: pack.visibilityHrManager, id: "visibility", value: "share_with_manager" },
            ],
          },
        ],
      };
    }
  }
  if (
    id === "visibility" &&
    person.state === "active" &&
    (value === "hr_only" || value === "share_with_manager")
  ) {
    await setScope(person, value, pack.consentVersion);
    return { replies: [{ text: pack.visibilitySaved }] };
  }
  if (id === "offer" && person.state === "active" && (value === "yes" || value === "no_thanks")) {
    const replies = await answerOffer(person, value);
    if (replies) return { replies };
  }
  if (id === "ans" && person.state === "active") {
    const replies = await checkinButton(person, value);
    if (replies) return { replies };
  }
  return { replies: prompt(person, languages) };
}

export async function handle(chatId: number, input: Input): Promise<Outcome> {
  const person = await personByChat(chatId);
  if (!person) {
    if (input.kind === "text") {
      const [head, token] = input.text.trim().split(/\s+/);
      if (head.toLowerCase().split("@")[0] === "/start" && token) return join(chatId, token);
    }
    return { replies: [{ text: packs.en.start }] };
  }
  if (person.state === "stopped") return none;
  const languages = await liveLanguages(person.organisation_id);
  const command = input.kind === "text" ? commandId(input.text, languages) : undefined;
  if (command === "stop") {
    await stopPerson(chatId);
    return { replies: [{ text: packs[person.language].stopped }] };
  }
  if (person.state === "declined") return none;
  if (input.kind === "button") return press(person, input.id, input.value, languages);
  if (command === "start" && input.text.trim().split(/\s+/).length > 1) {
    return { replies: [{ text: packs[person.language].invalidInvite }] };
  }
  if (person.state === "active" && !command && input.kind === "text") {
    const replies = await checkinText(person, input.text);
    if (replies) return { replies };
  }
  return { replies: prompt(person, languages) };
}
