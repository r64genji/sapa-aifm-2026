import { managerChat } from "@/lib/actions";
import { checkinButton, checkinText, skipCheckin } from "@/lib/checkin";
import { exitButton, exitText } from "@/lib/exit";
import { answerOffer } from "@/lib/offers";
import { challenge, confirmDelete, deletePrompt, myAnswers } from "@/lib/privacy";
import { ask } from "@/lib/qa";
import { scheduleFor } from "@/lib/scheduler";
import {
  askName,
  moveState,
  joinIntake,
  personByChat,
  recordConsent,
  redeemInvite,
  setFirstJob,
  setLanguage,
  setName,
  stopPerson,
  type Person,
} from "@/lib/directory";
import { answerContact } from "@/lib/escalations";
import { bindManager, MANAGER_TOKEN_PREFIX } from "@/lib/managers";
import { say } from "@/lib/say";
import { milestoneDone } from "@/lib/milestones";
import { languages, packs, type CommandId, type Language } from "@/lib/packs";

export type Reply = { text: string; buttons?: { label: string; id: string; value: string }[]; phone?: string };
export type Outcome = { replies: Reply[]; menu?: Language };
export type Input = { kind: "text"; text: string } | { kind: "button"; id: string; value: string; label?: string };

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
  if (rest.length === 0 && languages.some((language) => packs[language].typedDelete === word)) {
    return "delete";
  }
  return undefined;
}

const languageReply = (languages: Language[]): Reply => ({
  text: languages.map((language) => packs[language].languagePrompt).join("\n"),
  buttons: languages.map((language) => ({ label: packs[language].name, id: "lang", value: language })),
});

async function prompt(person: Person, languages: Language[]): Promise<Reply[]> {
  const pack = packs[person.language];
  if (person.state === "invited") return [languageReply(languages)];
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
  const person = (await joinIntake(token, chatId)) ?? (await redeemInvite(token, chatId));
  if (!person) return { replies: [{ text: packs.en.invalidInvite }] };
  return { replies: await prompt(person, languages) };
}

async function press(person: Person, id: string, value: string, languages: Language[]): Promise<Outcome> {
  const pack = packs[person.language];
  if (id === "lang" && person.state === "invited" && languages.includes(value as Language)) {
    const language = value as Language;
    await setLanguage(person, language);
    await moveState(person, "invited", "consent_shown");
    return { replies: await prompt({ ...person, language, state: "consent_shown" }, languages), menu: language };
  }
  if (id === "lang" && person.state === "active" && languages.includes(value as Language)) {
    const language = value as Language;
    await setLanguage(person, language);
    return { replies: [{ text: packs[language].help }], menu: language };
  }
  if (id === "consent" && person.state === "consent_shown") {
    if (value === "no" && (await moveState(person, "consent_shown", "declined"))) {
      return { replies: [{ text: pack.declined }] };
    }
    if (value === "yes" && (await moveState(person, "consent_shown", "active"))) {
      await recordConsent(person, pack.consentVersion);
      await scheduleFor(person.id);
      await askName(person);
      return { replies: [{ text: pack.help }, { text: pack.yourName.question }] };
    }
  }
  if (id === "firstjob" && person.state === "active" && (value === "yes" || value === "no")) {
    await setFirstJob(person, value === "yes");
    return { replies: [{ text: pack.firstJob.thanks }] };
  }
  if (id === "offer" && person.state === "active" && (value === "yes" || value === "no_thanks")) {
    const replies = await answerOffer(person, value);
    if (replies) return { replies };
  }
  if (id === "wrong" && person.state === "active") {
    const replies = await challenge(person, value);
    if (replies) return { replies };
  }
  if (id === "ans" && person.state === "active") {
    const replies = await checkinButton(person, value);
    if (replies) return { replies };
  }
  return { replies: await prompt(person, languages) };
}

export async function handle(chatId: number, input: Input): Promise<Outcome> {
  const before = input.kind === "button" ? (await personByChat(chatId))?.language : undefined;
  const outcome = await route(chatId, input);
  if (input.kind !== "button" || !input.label || outcome.replies.length === 0) return outcome;
  const language = outcome.menu ?? before ?? "en";
  const [first, ...rest] = outcome.replies;
  if (first.buttons?.[0]?.value === "done") return outcome;
  return { ...outcome, replies: [{ ...first, text: `${packs[language].tapped.replace("{label}", input.label)} ${first.text}` }, ...rest] };
}

async function route(chatId: number, input: Input): Promise<Outcome> {
  const person = await personByChat(chatId);
  if (!person) {
    if (input.kind === "button" && input.id === "ms") {
      const replies = await milestoneDone(chatId, input.value);
      if (replies) return { replies };
    }
    if (input.kind === "text") {
      const [head, token] = input.text.trim().split(/\s+/);
      if (head.toLowerCase().split("@")[0] === "/start" && token) {
        if (!token.startsWith(MANAGER_TOKEN_PREFIX)) return join(chatId, token);
        return {
          replies: [{ text: (await bindManager(token, chatId)) ? packs.en.managerLinked : packs.en.invalidInvite }],
        };
      }
    }
    return (await managerChat(chatId, input)) ?? { replies: [{ text: packs.en.start }] };
  }
  const command = input.kind === "text" ? commandId(input.text, languages) : undefined;
  if (command === "delete") return { replies: [deletePrompt(person.language)] };
  if (input.kind === "button" && input.id === "delete") return { replies: await confirmDelete(person, input.value) };
  if (person.state === "stopped") return none;
  if (input.kind === "button" && input.id === "contact") return { replies: await answerContact(person, input.value) };
  if (command === "stop") {
    await stopPerson(chatId);
    return { replies: [{ text: packs[person.language].stopped }] };
  }
  if (person.state === "left") {
    let replies: Reply[] | null = null;
    if (input.kind === "button") {
      if (input.id === "exit") replies = await exitButton(person, input.value);
    } else if (!command) {
      replies = await exitText(person, input.text);
    }
    return replies ? { replies } : none;
  }
  if (person.state === "declined") return none;
  if (input.kind === "button") return press(person, input.id, input.value, languages);
  if (command === "myanswers") return { replies: await myAnswers(person) };
  if (person.state === "active" && command === "skip") {
    return { replies: (await skipCheckin(person)) ? [{ text: packs[person.language].skipped }] : await prompt(person, languages) };
  }
  if (person.state === "active" && command === "language") return { replies: [languageReply(languages)] };
  if (command === "start" && input.text.trim().split(/\s+/).length > 1) {
    return { replies: [{ text: packs[person.language].invalidInvite }] };
  }
  if (person.state === "active" && input.kind === "text" && command === "say") {
    const message = input.text.trim().replace(/^\S+\s*/, "");
    return { replies: message ? await say(person, message) : [{ text: packs[person.language].say.prompt }] };
  }
  if (person.state === "active" && input.kind === "text" && (!command || command === "ask")) {
    if (!command) {
      const name = input.text.trim().replace(/\s+/g, " ");
      if (person.awaiting_name && /^[^?!@\d]{2,60}$/u.test(name) && name.split(" ").length <= 8) {
        const pack = packs[person.language];
        await setName(person, name);
        return { replies: [{ text: pack.firstJob.question, buttons: [{ label: pack.firstJob.yes, id: "firstjob", value: "yes" }, { label: pack.firstJob.no, id: "firstjob", value: "no" }] }] };
      }
      const replies = await checkinText(person, input.text);
      if (replies) return { replies };
      if (person.awaiting_name) return { replies: [{ text: packs[person.language].yourName.question }] };
    }
    const question = command ? input.text.trim().replace(/^\S+\s*/, "") : input.text;
    if (!question) return { replies: [{ text: packs[person.language].qa.askPrompt }] };
    return { replies: await ask(person, question, command === "ask") };
  }
  return { replies: await prompt(person, languages) };
}
