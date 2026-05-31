"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BellIcon, XIcon } from "@/components/Icons";

export function SubscribeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const suppressedUntil = Number(localStorage.getItem("pressnote:push-suppressed-until") ?? "0");
    const unsupported = !("serviceWorker" in navigator) || !("PushManager" in window);
    if (!unsupported && Notification.permission === "default" && Date.now() > suppressedUntil) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="notice">
      <div className="notice-message">
        <span className="notice-icon" aria-hidden="true">
          <BellIcon size={22} />
        </span>
        <div>
          <strong>毎朝のプレスを通知で受け取る</strong>
          <div className="small">直近 24 時間の新着件数をブラウザ通知で知らせます。</div>
        </div>
      </div>
      <div className="button-row">
        <Link className="button-primary" href="/settings">
          通知を有効化
        </Link>
        <button
          className="button-secondary"
          type="button"
          onClick={() => {
            localStorage.setItem("pressnote:push-suppressed-until", String(Date.now() + 7 * 24 * 60 * 60 * 1000));
            setVisible(false);
          }}
          aria-label="通知バナーを閉じる"
        >
          <XIcon size={18} />
        </button>
      </div>
    </div>
  );
}
