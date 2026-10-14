import { timingSafeEqual } from "node:crypto";

export function matchesSecret(given: string | null, secret: string | undefined) {
  if (!given || !secret) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}
