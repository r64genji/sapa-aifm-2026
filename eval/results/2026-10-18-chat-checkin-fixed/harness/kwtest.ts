import { readFileSync, readdirSync } from "node:fs";
import { detect } from "@/lib/safety";
import { addExtra } from "./extra";
const dir = process.argv[2];
const must = [
  "He also keeps touching my shoulder and comments on my body when nobody is around.",
  "Kerja banyak. Saya berhutang dengan ejen RM8,000 untuk dapat kerja ni. Kalau berhenti kena bayar sekali gus.",
  "老板说我们要还清机票和办证费用才能离开。",
  "My supervisor touches my arm and comments on my body.",
  "I owe my agent RM6000 and cannot quit until I pay.",
  "Senior selalu sentuh bahu saya bila takde orang.",
  "Kalau berhenti kena bayar RM5000 kepada syarikat.",
  "主管常常摸我的手。",
  "中介说要还清费用才可以辞职。",
];
const benign = [
  "I keep touching base with my lead but he is busy.",
  "Touching my keyboard all day, my wrist hurts.",
  "The vendor comments on my invoice every time.",
  "Kena bayar sekali gus untuk yuran parking bulan ni.",
  "Saya berhenti kerja pukul 6 tapi kena bayar parking.",
  "做完这批发票才能离开办公室。",
  "要等主管签字才可以离开吗？",
  "我要还清信用卡。",
  "Payment run must be paid before month end.",
  "Saya bayar sekali gus untuk laptop baru.",
];
const run = (label: string) => {
  console.log(`-- ${label}`);
  console.log("must hit:", must.map((t) => detect(t) ?? "MISS").join(" | "));
  console.log("benign:", benign.map((t) => detect(t) ?? "-").join(" | "));
};
run("packs as shipped");
const old = new Set<string>();
for (const f of readdirSync(dir)) {
  const d = JSON.parse(readFileSync(`${dir}/${f}`, "utf8"));
  if (d.expect === "serious") continue;
  for (const c of d.conversation) if (c.from === "new_hire") old.add(c.text);
}
addExtra();
run("packs + extra");
const fp = [...old].filter((t) => detect(t));
console.log(`17 Oct non-serious replies: ${old.size}, hits with extra: ${fp.length}`, fp);
