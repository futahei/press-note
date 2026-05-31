"use client";

import { useEffect, useState } from "react";
import { BellIcon, ExternalLinkIcon } from "@/components/Icons";

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
    <div className="settings-panel">
      <div className="settings-panel-head">
        <span className="settings-icon" aria-hidden="true">
          <BellIcon size={34} />
        </span>
        <div>
          <h3>ブラウザ通知</h3>
          <p className="muted" role="status" aria-live="polite">
            状態: {busy ? <span className="loading-spinner" aria-hidden="true" /> : null}
            {status}
          </p>
          <p>毎朝 8 時に新着プレスリリースをブラウザ通知でお届けします。</p>
        </div>
      </div>
      <div className="settings-row">
        <div>
          <strong>通知を受け取る</strong>
          <p className="muted">ブラウザ通知の受信をオン / オフできます。</p>
        </div>
        {subscribed ? (
          <button className="button-secondary" type="button" onClick={unsubscribe} disabled={busy}>
            {busyAction === "unsubscribe" ? <span className="loading-spinner" aria-hidden="true" /> : null}
            OFF にする
          </button>
        ) : (
          <button className="button-primary" type="button" onClick={subscribe} disabled={busy}>
            {busyAction === "subscribe" ? <span className="loading-spinner" aria-hidden="true" /> : null}
            ON にする
          </button>
        )}
      </div>
      {subscribed ? (
        <div className="settings-row">
          <div>
            <strong>テスト通知を送る</strong>
            <p className="muted">現在の設定で通知が届くかテストします。</p>
          </div>
          <button className="button-secondary" type="button" onClick={sendTest} disabled={busy}>
            <ExternalLinkIcon size={17} />
            {busyAction === "test" ? <span className="loading-spinner" aria-hidden="true" /> : null}
            テスト通知を送る
          </button>
        </div>
      ) : null}
    </div>
  );
}
