import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let publicClient: SupabaseClient | null | undefined;
let adminClient: SupabaseClient | null | undefined;

function getSupabaseUrl() {
  return process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function getSupabaseClient() {
  if (publicClient !== undefined) {
    return publicClient;
  }

  const url = getSupabaseUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  publicClient = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return publicClient;
}

export function getSupabaseAdminClient() {
  if (adminClient !== undefined) {
    return adminClient;
  }

  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  adminClient = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return adminClient;
}
