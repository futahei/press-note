import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, hasSupabaseConfig, requiredEnv } from "@/lib/env";

let serviceClient: SupabaseClient | null = null;

export function getServiceSupabase(): SupabaseClient {
  if (!serviceClient) {
    serviceClient = createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  return serviceClient;
}

export function getOptionalServiceSupabase(): SupabaseClient | null {
  return hasSupabaseConfig() ? getServiceSupabase() : null;
}

export function publicSupabaseConfig() {
  return {
    url: env("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: env("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  };
}
