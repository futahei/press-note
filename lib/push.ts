import webpush from "web-push";
import { env, requiredEnv } from "@/lib/env";
import { getServiceSupabase } from "@/lib/supabase";

export function configureWebPush() {
  const publicKey = env("VAPID_PUBLIC_KEY");
  const privateKey = env("VAPID_PRIVATE_KEY");
  const subject = env("VAPID_SUBJECT");
  if (!publicKey || !privateKey || !subject) return false;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export async function sendDailyNotification() {
  if (!configureWebPush()) {
    throw new Error("VAPID keys are not configured");
  }

  const supabase = getServiceSupabase();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: articles, error: articlesError } = await supabase
    .from("articles")
    .select("source:sources(name)")
    .eq("is_deleted", false)
    .gte("fetched_at", since);
  if (articlesError) throw articlesError;

  const count = articles?.length ?? 0;
  const names = [
    ...new Set((articles ?? []).flatMap((article: { source?: { name?: string } }) => article.source?.name ?? []))
  ].slice(0, 3);
  const payload = JSON.stringify({
    title: "最新のプレスリリース",
    body: `最新のプレス ${count} 件${names.length ? ` (${names.join(", ")})` : ""}`,
    url: "/"
  });

  const { data: subscriptions, error: subscriptionsError } = await supabase.from("push_subscriptions").select("*");
  if (subscriptionsError) throw subscriptionsError;

  const results = await Promise.allSettled(
    (subscriptions ?? []).map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth }
          },
          payload
        );
      } catch (error) {
        if (typeof error === "object" && error && "statusCode" in error && error.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
        }
        throw error;
      }
    })
  );

  return {
    sent: results.filter((result) => result.status === "fulfilled").length,
    failed: results.filter((result) => result.status === "rejected").length
  };
}

export function publicVapidKey() {
  return requiredEnv("VAPID_PUBLIC_KEY");
}
