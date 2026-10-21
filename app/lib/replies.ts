import { Tag, tagReply } from "@/lib/classify";
import { now } from "@/lib/clock";
import { decrypt } from "@/lib/crypto";
import { mask } from "@/lib/mask";
import { reachable, type Person } from "@/lib/directory";
import { escalate } from "@/lib/escalations";
import { resolveChallenge } from "@/lib/privacy";
import { audit, signal } from "@/lib/signal";
import { send } from "@/lib/telegram";
import { translation } from "@/lib/translate";
import { fillTopic, type Schedule } from "@/lib/checkin";
import { packs, type Language } from "@/lib/packs";
import { createAdminClient } from "@/lib/supabase/admin";

const byline = (name: string | null | undefined, team: string | null | undefined, touchpoint: number | null | undefined) =>
  [name ?? "A new hire", team, touchpoint == null ? null : touchpoint >= 180 ? "Month 6" : `Day ${touchpoint}`].filter(Boolean).join(" · ");

type Entry = { from: "bot" | "new_hire"; kind: "fixed" | "ai" | "tap" | "text"; text: string; en?: string; echo?: string; score?: number };

const question = (language: Language, id: string) =>
  packs[language].checkin.questions.find((q) => q.id === id) as { text: string; labels?: string[] } | undefined;

const chatKey = (language: Language, text: string) =>
  Object.entries(packs[language].checkin.chat).find(([, value]) => value === text)?.[0] as keyof (typeof packs)["en"]["checkin"]["chat"] | undefined;

function chatLog(
  row: { id: string; question_id: string; language: string; text: string },
  schedule: Pick<Schedule, "recheck_driver" | "chat"> | null,
  taps: { question_id: string; scale_value: number }[],
) {
  const language = (row.language in packs ? row.language : "en") as Language;
  const other = (en: string | undefined, own: string) => (en && en !== own ? { en: mask(en) } : {});
  const log: Entry[] = [];
  let echo: string | undefined;
  for (const tap of taps) {
    const own = question(language, tap.question_id);
    if (!own?.labels) continue;
    const english = question("en", tap.question_id)!;
    const asked = fillTopic(language, own.text, schedule?.recheck_driver ?? null);
    log.push({ from: "bot", kind: "fixed", text: asked, ...other(fillTopic("en", english.text, schedule?.recheck_driver ?? null), asked), ...(echo && { echo }) });
    const label = own.labels[tap.scale_value - 1];
    log.push({ from: "new_hire", kind: "tap", text: label, ...other(english.labels?.[tap.scale_value - 1], label), score: tap.scale_value });
    echo = packs[language].tapped.replace("{label}", label);
  }
  const turns = schedule?.chat?.response_id === row.id ? schedule.chat.turns : [];
  if (row.question_id !== "OPEN") return [...log, { from: "new_hire", kind: "text", text: row.text } as Entry];
  const opener = turns[0]?.from === "bot" ? turns[0].text : question(language, "OPEN")!.text;
  const key = chatKey(language, opener);
  log.push({ from: "bot", kind: "fixed", text: mask(opener), ...other(key ? packs.en.checkin.chat[key] : question("en", "OPEN")!.text, opener), ...(echo && { echo }) });
  const rest = turns[0]?.from === "bot" ? turns.slice(1) : turns;
  for (const turn of rest.length ? rest : [{ from: "new_hire" as const, text: row.text }]) {
    log.push(turn.from === "bot" ? { from: "bot", kind: "ai", text: mask(turn.text) } : { from: "new_hire", kind: "text", text: mask(turn.text) });
  }
  return log;
}

export async function readReplies(organisationId: string, actor: string) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("responses")
    .select(
      "id, question_id, schedule_id, text_encrypted, language, created_at, people(team, name), checkin_schedule(touchpoint, recheck_driver, chat), ai_tags(status, drivers, context_tags, evidence_quote, concern_level, escalate, counted, changed_by_hr, confidence)",
    )
    .eq("organisation_id", organisationId)
    .not("text_encrypted", "is", null)
    .order("created_at");
  if (error) throw error;
  type Joined = { people: { team: string | null; name: string | null } | null; checkin_schedule: (Pick<Schedule, "recheck_driver" | "chat"> & { touchpoint: number }) | null; ai_tags: { evidence_quote?: string | null } | null };
  const schedules = [...new Set(data.map((row) => row.schedule_id).filter(Boolean))];
  const { data: taps, error: tapsError } = await db
    .from("responses")
    .select("schedule_id, question_id, scale_value")
    .in("schedule_id", schedules)
    .not("scale_value", "is", null)
    .order("created_at");
  if (tapsError) throw tapsError;
  const at = (await now()).toISOString();
  const { error: auditError } = await db
    .from("audit_log")
    .insert(data.map((row) => ({ actor, action: "read_reply_text", target: row.id, at })));
  if (auditError) throw auditError;
  return Promise.all(
    data.map(async (row) => {
      const joined = row as unknown as Joined;
      const text = mask(decrypt(row.text_encrypted!));
      return {
        id: row.id,
        question_id: row.question_id,
        text,
        language: row.language,
        created_at: row.created_at,
        byline: byline(joined.people?.name, joined.people?.team, joined.checkin_schedule?.touchpoint),
        ...joined.ai_tags,
        evidence_quote: joined.ai_tags?.evidence_quote ? mask(joined.ai_tags.evidence_quote) : null,
        log: chatLog({ ...row, text }, joined.checkin_schedule, row.schedule_id ? taps.filter((tap) => tap.schedule_id === row.schedule_id) : []),
      };
    }),
  );
}

export async function translateReply(organisationId: string, responseId: string) {
  const { data, error } = await createAdminClient()
    .from("responses")
    .select("text_encrypted, language")
    .eq("organisation_id", organisationId)
    .eq("id", responseId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.text_encrypted) return { error: "Not found", code: 404 };
  const result = await translation(organisationId, data.language, decrypt(data.text_encrypted));
  return result.translation ? { ...result, translation: { ...result.translation, text: mask(result.translation.text) } } : result;
}

export async function retryReply(organisationId: string, responseId: string) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("responses")
    .select("text_encrypted, person_id, language, escalations(id)")
    .eq("organisation_id", organisationId)
    .eq("id", responseId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.text_encrypted) return { error: "Not found", code: 404 };
  const { data: tag, error: tagError } = await db
    .from("ai_tags")
    .select("status")
    .eq("response_id", responseId)
    .maybeSingle();
  if (tagError) throw tagError;
  if (tag?.status !== "awaiting_ai" && tag?.status !== "needs_review") {
    return { error: "Nothing to retry", code: 409 };
  }
  const result = await tagReply(organisationId, responseId, decrypt(data.text_encrypted));
  if (result.status !== "awaiting_ai" && result.tag.escalate && !data.escalations) {
    const person = await reachable(data.person_id);
    const reply = await escalate(person ?? ({ organisation_id: organisationId, language: data.language } as Person), responseId, null, result.tag.escalate_category);
    if (person) await send(person.telegram_chat_id!, reply);
  }
  return { status: result.status };
}

const waiting = "New labels wait for HR";
const challenged = "Challenged by new hire";
const spotCheck = "Spot check";

export async function readQueue(organisationId: string, actor: string) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("ai_tags")
    .select(
      "response_id, status, drivers, context_tags, concern_level, escalate, escalate_category, evidence_quote, summary, confidence, counted, spot_check_at, challenged_at, challenge_resolved_at, changed_by_hr, created_at, responses!inner(text_encrypted, language, people(team, name), checkin_schedule(touchpoint))",
    )
    .eq("organisation_id", organisationId)
    .or(
      "escalate.eq.true,concern_level.eq.needs_follow_up,status.in.(awaiting_ai,needs_review),and(status.eq.ok,counted.eq.false),and(status.eq.ok,spot_check_at.not.is.null)",
    )
    .order("escalate", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data as unknown as ((typeof data)[number] & { responses: { text_encrypted: string | null; language: string; people: { team: string | null; name: string | null } | null; checkin_schedule: { touchpoint: number } | null } })[];
  const { data: held, error: heldError } = await db
    .from("quality_holds")
    .select("driver, language, reason")
    .eq("organisation_id", organisationId)
    .eq("state", "held");
  if (heldError) throw heldError;
  const read = rows.filter((row) => row.responses.text_encrypted);
  if (read.length) {
    const at = (await now()).toISOString();
    const { error: auditError } = await db
      .from("audit_log")
      .insert(read.map((row) => ({ actor, action: "read_reply_text", target: row.response_id, at })));
    if (auditError) throw auditError;
  }
  return Promise.all(
    rows.map(async ({ responses, spot_check_at, response_id, challenged_at, challenge_resolved_at, ...row }) => {
      const text = responses.text_encrypted ? mask(decrypt(responses.text_encrypted)) : null;
      return {
        id: response_id,
        ...row,
        evidence_quote: row.evidence_quote ? mask(row.evidence_quote) : null,
        summary: row.summary ? mask(row.summary) : null,
        text,
        language: responses.language,
        byline: byline(responses.people?.name, responses.people?.team, responses.checkin_schedule?.touchpoint),
        note:
          challenged_at && !challenge_resolved_at
            ? challenged
            : row.status === "ok" && !row.counted
              ? (held.find((hold) => hold.language === responses.language && row.drivers.includes(hold.driver))?.reason ?? waiting)
              : row.status === "ok" && spot_check_at
                ? spotCheck
                : null,
      };
    }),
  );
}

async function ownTag(organisationId: string, responseId: string) {
  const { data, error } = await createAdminClient()
    .from("ai_tags")
    .select("status, drivers, context_tags, counted, spot_check_at, responses!inner(language)")
    .eq("organisation_id", organisationId)
    .eq("response_id", responseId)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as NonNullable<typeof data> & { responses: { language: string } };
}

export async function reviewReply(
  organisationId: string,
  actor: string,
  responseId: string,
  change: { drivers?: Tag["drivers"]; context_tags?: Tag["context_tags"]; serious?: boolean },
) {
  const tag = await ownTag(organisationId, responseId);
  if (!tag) return { error: "Not found", code: 404 };
  if (tag.status === "awaiting_ai" && !change.drivers && !change.context_tags) return { error: "Nothing to review", code: 409 };
  const { serious, ...labels } = change;
  const at = (await now()).toISOString();
  const { error } = await createAdminClient()
    .from("ai_tags")
    .update({
      ...labels,
      ...((change.drivers || change.context_tags) && { changed_by_hr: true }),
      status: "reviewed",
      reviewed_by: actor,
      reviewed_at: at,
    })
    .eq("response_id", responseId);
  if (error) throw error;
  await audit(actor, change.drivers || change.context_tags ? "change_tag" : "confirm_tag", responseId);
  if (tag.status === "ok" && (tag.spot_check_at || !tag.counted)) {
    const differs = (was: string[], now?: string[]) => now !== undefined && [...was].sort().join() !== [...now].sort().join();
    const changed = differs(tag.drivers, change.drivers) || differs(tag.context_tags, change.context_tags);
    for (const driver of tag.drivers) {
      const { error: checkError } = await createAdminClient().rpc("record_spot_check", {
        org: organisationId,
        drv: driver,
        lang: tag.responses.language,
        was_changed: changed,
        at,
      });
      if (checkError) throw checkError;
    }
  }
  if (serious) {
    const { data: response, error: responseError } = await createAdminClient()
      .from("responses")
      .select("person_id, language, escalations(id)")
      .eq("id", responseId)
      .single();
    if (responseError) throw responseError;
    if (!response.escalations) {
      const person = await reachable(response.person_id);
      const reply = await escalate(person ?? ({ organisation_id: organisationId, language: response.language } as Person), responseId, null, "none");
      if (person) await send(person.telegram_chat_id!, reply);
    }
  }
  await resolveChallenge(responseId);
  await signal(organisationId, "cohort");
  await signal(organisationId, "queue");
  return { status: "reviewed" };
}

export async function undoReview(
  organisationId: string,
  actor: string,
  responseId: string,
  before: { status: "ok" | "needs_review" | "awaiting_ai"; drivers: Tag["drivers"]; context_tags: Tag["context_tags"]; changed_by_hr: boolean },
) {
  const tag = await ownTag(organisationId, responseId);
  if (!tag) return { error: "Not found", code: 404 };
  if (tag.status !== "reviewed") return { error: "Nothing to undo", code: 409 };
  const { error } = await createAdminClient()
    .from("ai_tags")
    .update({ ...before, reviewed_by: null, reviewed_at: null })
    .eq("response_id", responseId);
  if (error) throw error;
  await audit(actor, "undo_review", responseId);
  await signal(organisationId, "cohort");
  await signal(organisationId, "queue");
  return { status: before.status };
}

export async function setFollowUp(organisationId: string, actor: string, responseId: string, value: boolean) {
  if (!(await ownTag(organisationId, responseId))) return { error: "Not found", code: 404 };
  const { error } = await createAdminClient()
    .from("ai_tags")
    .update({ concern_level: value ? "needs_follow_up" : "none" })
    .eq("response_id", responseId);
  if (error) throw error;
  await audit(actor, value ? "set_follow_up" : "clear_follow_up", responseId);
  await signal(organisationId, "queue");
  return { follow_up: value };
}
