"use client";

import { useEffect } from "react";
import useSWR, { mutate } from "swr";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

async function token() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function signedOut(): never {
  void supabase.auth.signOut({ scope: "local" }).finally(() => window.location.reload());
  throw new ApiError(401, "Signed out");
}

async function request(path: string, init: RequestInit = {}) {
  const access = await token();
  if (!access) signedOut();
  const response = await fetch(path, {
    ...init,
    headers: { ...(init.body ? { "content-type": "application/json" } : {}), ...init.headers, authorization: `Bearer ${access}` },
  });
  if (response.status === 401) signedOut();
  const text = await response.text();
  const body = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
  if (!response.ok) throw new ApiError(response.status, typeof body === "object" && body?.error ? body.error : String(body ?? response.statusText));
  return body;
}

export function useApi<T>(path: string | null, refreshInterval = 5000) {
  return useSWR<T>(path, (p: string) => request(p), { refreshInterval, revalidateOnFocus: true });
}

export async function apiSend<T = unknown>(path: string, method: "POST" | "PUT" | "PATCH" | "DELETE" = "POST", body?: unknown): Promise<T> {
  const result = await request(path, { method, body: body === undefined ? undefined : JSON.stringify(body) });
  await refreshAll();
  return result as T;
}

export function refreshAll() {
  return mutate((key) => typeof key === "string" && key.startsWith("/api/"));
}

export function useLiveRefresh() {
  useEffect(() => {
    const channel = supabase
      .channel("change_signals")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "change_signals" }, () => refreshAll())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
