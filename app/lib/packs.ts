import en from "@/data/packs/en.json";
import ms from "@/data/packs/ms.json";

export const packs = { en, ms };
export type Language = keyof typeof packs;
export type CommandId = keyof typeof en.commands;
