import type { NextConfig } from "next";

const baseUrls = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "TELEGRAM_API_BASE_URL",
  "OMNIROUTE_BASE_URL",
  "DEEPSEEK_BASE_URL",
];

if (process.env.SAPA_TEST === "1") {
  for (const name of baseUrls) {
    const host = URL.parse(process.env[name] ?? "")?.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      throw new Error(`${name} must be on localhost in the test environment`);
    }
  }
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  allowedDevOrigins: ["dev.sapa.abrahamtan.com"],
  env: { SAPA_TEST: process.env.SAPA_TEST ?? "" },
  redirects: async () => [{ source: "/impact", destination: "/fixes", permanent: false }],
};

export default nextConfig;
