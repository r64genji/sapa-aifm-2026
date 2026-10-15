import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import {
  addHire,
  classifierTag,
  db,
  freezeClock,
  hrRequest,
  link,
  modelCalls,
  postUpdate,
  resetDemo,
  say,
  scriptModel,
  sentTo,
  settle,
  tap,
  tapData,
  telegramCalls,
  update,
} from "./helpers.ts";

const pack = (language: string) =>
  JSON.parse(readFileSync(new URL(`../data/packs/${language}.json`, import.meta.url), "utf8"));
const [en, zh] = [pack("en"), pack("zh")];
const chat = 5550000401;
const reply = "老板给了我三个紧急任务，我不知道先做哪个";
const quote = "我不知道先做哪个";
const translated = "The boss gave me three urgent tasks and I do not know which to do first.";

const texts = async () => (await sentTo(chat)).map((m) => m.text);
const labels = async () =>
  (await sentTo(chat)).flatMap((m) =>
    ((m.reply_markup as { inline_keyboard: { text: string }[][] } | undefined)?.inline_keyboard ?? []).flat().map((b) => b.text),
  );
const counts = async () => ({
  responses: (await db.from("responses").select("id", { count: "exact", head: true })).count,
  tags: (await db.from("ai_tags").select("response_id", { count: "exact", head: true })).count,
});

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
});

test("R46, R36: a pack without a recorded checker cannot be picked; once HR records one, a Chinese hire gets the Chinese consent and English commands with Chinese descriptions", async () => {
  const { token } = await addHire({ code_name: "Hire ZH", language: "zh", start_date: "2026-10-02" });
  await link(chat, token);
  assert.deepEqual(await labels(), ["English", "Bahasa Malaysia"]);

  await tapData(chat, 'chat:{"a":"lang","v":"zh"}');
  const { data: refused } = await db.from("people").select("state").eq("telegram_chat_id", chat).single();
  assert.equal(refused!.state, "invited");
  assert.equal((await texts()).includes(zh.consent), false);

  const blank = await hrRequest("/api/hr/language-packs/zh/activate", "POST", { checker_name: " " });
  assert.equal(blank.status, 400);
  const activated = await hrRequest("/api/hr/language-packs/zh/activate", "POST", { checker_name: "Li Wei" });
  assert.equal(activated.status, 200);
  const { data: row } = await db.from("language_packs").select("checker_name, checked_on").eq("language", "zh").single();
  assert.deepEqual(row, { checker_name: "Li Wei", checked_on: "2026-10-15" });

  await tapData(chat, 'chat:{"a":"lang","v":"zh"}');
  assert.equal((await texts()).at(-1), zh.consent);
  const menu = (await telegramCalls("setMyCommands")).find((m: any) => m.scope.chat_id === chat) as any;
  assert.deepEqual(
    menu.commands.map((c: any) => c.command),
    ["start", "ask", "skip", "privacy", "language", "stop", "delete", "myanswers", "help"],
  );
  assert.deepEqual(
    menu.commands.map((c: any) => c.description),
    Object.values(zh.commands).map((c: any) => c.description),
  );
  assert.notEqual(menu.commands[0].description, en.commands.start.description);

  await tap(chat, zh.agree);
  assert.equal((await texts()).at(-1), zh.visibilityPrompt);
});

test("R46, R53: a Chinese reply goes to needs review, HR sees the original and a labelled AI translation, and nothing of the translation is stored", async () => {
  const advance = await hrRequest("/api/hr/demo/advance", "POST", { day: 14 });
  assert.equal(advance.status, 200);
  await tap(chat, "4");
  await tap(chat, "3");
  await tap(chat, "5");
  await tap(chat, "3");
  await tap(chat, "3");
  await tap(chat, "3");
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag({ evidence_quote: quote, summary: "Unclear task priorities." }) }]);
  await say(chat, reply);

  const { data: person } = await db.from("people").select("id").eq("telegram_chat_id", chat).single();
  const { data: response } = await db.from("responses").select("id, language").eq("person_id", person!.id).eq("question_id", "OPEN").single();
  assert.equal(response!.language, "zh");
  const { data: tag } = await db.from("ai_tags").select("status, counted").eq("response_id", response!.id).single();
  assert.deepEqual(tag, { status: "needs_review", counted: false });

  const classifyCalls = (await modelCalls("omniroute")).length;
  const res = await hrRequest("/api/hr/queue", "GET");
  const item = (await res.json()).find((r: any) => r.id === response!.id);
  assert.equal(item.text, reply);
  assert.equal(item.evidence_quote, quote);
  assert.equal(item.translation, undefined);
  assert.equal((await modelCalls("omniroute")).length, classifyCalls);

  await scriptModel("omniroute", [{ kind: "json", content: { translation: translated } }]);
  const opened = await hrRequest(`/api/hr/replies/${response!.id}/translation`, "GET");
  assert.equal(opened.status, 200);
  assert.deepEqual(await opened.json(), { language: "zh", translation: { label: "AI translation", text: translated } });
  const calls = (await modelCalls("omniroute")).slice(classifyCalls);
  assert.equal(calls.length, 1);
  assert.ok(JSON.stringify(calls[0].body).includes(reply));

  const all = await (await hrRequest("/api/hr/replies", "GET")).json();
  assert.equal(all.find((r: any) => r.id === response!.id).translation, undefined);

  await scriptModel("omniroute", [{ kind: "text", content: "```json\n{}\n```" }, { kind: "json", content: { translation: translated } }]);
  const retried = await hrRequest(`/api/hr/replies/${response!.id}/translation`, "GET");
  assert.deepEqual(await retried.json(), { language: "zh", translation: { label: "AI translation", text: translated } });

  await scriptModel("omniroute", [{ kind: "text", content: "not json" }, { kind: "text", content: "still not json" }]);
  const failed = await hrRequest(`/api/hr/replies/${response!.id}/translation`, "GET");
  assert.equal(failed.status, 200);
  assert.deepEqual(await failed.json(), { language: "zh", translation: null });
  assert.equal((await hrRequest("/api/hr/queue", "GET")).status, 200);

  for (const table of ["responses", "ai_tags", "ai_usage", "audit_log", "change_signals", "escalations"]) {
    const { data } = await db.from(table).select("*");
    assert.ok(!JSON.stringify(data).includes("three urgent tasks"), table);
  }
});

test("R17: HR opening a Chinese reply that holds a phone number sends the model [PHONE], never the number", async () => {
  const other = 5550000402;
  const withPhone = "我不知道先做哪个，请打电话 012-345 6789 给我";
  const { token } = await addHire({ code_name: "Hire ZH 2", language: "zh", start_date: "2026-10-05" });
  await link(other, token);
  await tapData(other, 'chat:{"a":"lang","v":"zh"}');
  await tap(other, zh.agree);
  assert.equal((await hrRequest("/api/hr/demo/advance", "POST", { day: 17 })).status, 200);
  await tap(other, "4");
  await tap(other, "3");
  await tap(other, "5");
  await tap(other, "3");
  await tap(other, "3");
  await tap(other, "3");
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag({ evidence_quote: quote, summary: "Unclear task priorities." }) }]);
  await say(other, withPhone);
  await settle();

  const calls = (await modelCalls("omniroute")).length;
  await scriptModel("omniroute", [
    { kind: "json", content: { translation: translated } },
    { kind: "json", content: { translation: translated } },
  ]);
  const all = await (await hrRequest("/api/hr/replies", "GET")).json();
  const opened = all.find((r: any) => r.text === withPhone);
  assert.ok(opened);
  assert.equal((await hrRequest(`/api/hr/replies/${opened.id}/translation`, "GET")).status, 200);
  const sent = (await modelCalls("omniroute")).slice(calls).map((c) => JSON.stringify(c.body));
  assert.ok(sent.some((body) => body.includes("我不知道先做哪个，请打电话 [PHONE] 给我")));
  assert.ok(!sent.some((body) => body.includes("012-345 6789")));
});

test("R46: a voice note gets the fixed type-it text and nothing from it is stored", async () => {
  const before = await counts();
  const calls = (await modelCalls("omniroute")).length;
  const res = await postUpdate(update("voice", { chat_id: chat }));
  assert.equal(res.status, 200);
  await settle();
  assert.equal((await texts()).at(-1), zh.typeInstead);
  assert.deepEqual(await counts(), before);
  assert.equal((await modelCalls("omniroute")).length, calls);
});

test("R3, R50: a stopped person who sends a voice note gets no message", async () => {
  await db.from("people").update({ state: "stopped" }).eq("telegram_chat_id", chat);
  const before = (await texts()).length;
  assert.equal((await postUpdate(update("voice", { chat_id: chat }))).status, 200);
  await settle();
  assert.equal((await texts()).length, before);
});
