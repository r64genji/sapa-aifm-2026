import en from "@/data/packs/en.json";
import ms from "@/data/packs/ms.json";
import zh from "@/data/packs/zh.json";

export const packs = { en, ms, zh };
export type Language = keyof typeof packs;
export type CommandId = keyof typeof en.commands;
