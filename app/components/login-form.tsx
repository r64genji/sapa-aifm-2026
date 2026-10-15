"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    setIsLoading(false);
    if (error) return setError(error.message);
    router.push("/");
  };

  return (
    <div className="sp-card flex flex-col gap-5 p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center text-[15px] font-bold" style={{ borderRadius: "var(--radius-control)", background: "var(--problems)", color: "var(--on-problems)" }}>
          S
        </span>
        <span className="text-[17px] font-bold">Sapa</span>
      </div>
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-[22px] font-bold leading-7">Sign in</h1>
        <p className="sp-meta m-0">For the HR team at your organisation.</p>
      </div>
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 font-semibold">
          Email
          <input className="sp-input font-normal" id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 font-semibold">
          Password
          <input className="sp-input font-normal" id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error ? <p className="m-0 text-[13px]">{error}</p> : null}
        <button type="submit" className="sp-btn sp-btn-primary sp-lane-problems justify-center" disabled={isLoading}>
          {isLoading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
