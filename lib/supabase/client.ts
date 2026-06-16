import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Supabase client factory. Secrets come from env only (NFR-36).
// Sprint 1 deliverable: "Supabase connection verified".

let browserClient: SupabaseClient | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Thiếu biến môi trường ${name}. Xem .env.example để cấu hình.`,
    );
  }
  return value;
}

/** Anon client for browser / public reads. */
export function getSupabaseClient(): SupabaseClient {
  if (browserClient) return browserClient;
  browserClient = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
  return browserClient;
}

/** Service-role client for server-only privileged access. Never import in client code. */
export function getSupabaseServiceClient(): SupabaseClient {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );
}
