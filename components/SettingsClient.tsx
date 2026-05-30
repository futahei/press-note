"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function SettingsClient() {
  const [status, setStatus] = useState("確認中");
  const [subscribed, setSubscribed] = useState(false);
  const [busyAction, setBusyAction] = useState<"subscribe" | "unsubscribe" | "test" | null>(null);
  const busy = busyAction !== null;

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("このブラウザは Web Push に対応していません。");
      return;
    }
    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        setSubscribed(Boolean(subscription));
        setStatus(subscription ? "購読中" : "未購読");
      });
  }, []);

  async function subscribe() {
    setBusyAction("subscribe");
    setStatus("通知を設定しています");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("通知が許可されませんでした。");
        localStorage.setItem("pressnote:push-suppressed-until", String(Date.now() + 7 * 24 * 60 * 60 * 1000));
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const response = await fetch("/api/push/public-key");
      const { publicKey } = (await response.json()) as { publicKey: string };
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(subscription)
      });
      setSubscribed(true);
      setStatus("購読中");
    } catch {
      setStatus("通知の設定に失敗しました");
    } finally {
      setBusyAction(null);
    }
  }

  async function unsubscribe() {
    setBusyAction("unsubscribe");
    setStatus("通知を解除しています");
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
        await subscription.unsubscribe();
      }
      setSubscribed(false);
      setStatus("未購読");
    } catch {
      setStatus("通知の解除に失敗しました");
    } finally {
      setBusyAction(null);
    }
  }

  async function sendTest() {
    setBusyAction("test");
    setStatus("テスト通知を送信中");
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        setStatus("未購読");
        return;
      }
      const response = await fetch("/api/push/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });
      setStatus(response.ok ? "テスト通知を送信しました" : "テスト通知の送信に失敗しました");
    } catch {
      setStatus("テスト通知の送信に失敗しました");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="utility-card">
      <div>
        <h3>ブラウザ通知</h3>
        <p className="muted" role="status" aria-live="polite">
          状態: {busy ? <span className="loading-spinner" aria-hidden="true" /> : null}
          {status}
        </p>
      </div>
      <div className="button-row">
        <button className="button-primary" type="button" onClick={subscribe} disabled={subscribed || busy}>
          {busyAction === "subscribe" ? <span className="loading-spinner" aria-hidden="true" /> : null}
          ON にする
        </button>
        <button className="button-secondary" type="button" onClick={unsubscribe} disabled={!subscribed || busy}>
          {busyAction === "unsubscribe" ? <span className="loading-spinner" aria-hidden="true" /> : null}
          OFF にする
        </button>
        <button className="button-rect" type="button" onClick={sendTest} disabled={!subscribed || busy}>
          {busyAction === "test" ? <span className="loading-spinner" aria-hidden="true" /> : null}
          テスト通知を送る
        </button>
      </div>
    </div>
  );
}
