const serverOnlyKeys = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "ADMIN_JWT_SECRET",
  "ADMIN_PASSWORD_HASH",
  "VAPID_PRIVATE_KEY",
  "CRON_SECRET"
] as const;

export function env(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

export function requiredEnv(name: string): string {
  const value = env(name);
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function hasSupabaseConfig(): boolean {
  return Boolean(env("SUPABASE_URL") && env("SUPABASE_SERVICE_ROLE_KEY"));
}

export function assertNoServerEnvLeak(): void {
  for (const key of serverOnlyKeys) {
    if (key.startsWith("NEXT_PUBLIC_")) {
      throw new Error(`Server-only key is public: ${key}`);
    }
  }
}
