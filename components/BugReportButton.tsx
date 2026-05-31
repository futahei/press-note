"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { BugIcon, XIcon } from "@/components/Icons";
import type { BugReportLog } from "@/lib/types";

const MAX_LOGS = 20;

function toLogMessage(value: unknown) {
  if (value instanceof Error) return value.message;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function BugReportButton() {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [logs, setLogs] = useState<BugReportLog[]>([]);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    function appendLog(log: BugReportLog) {
      setLogs((current) => [...current, log].slice(-MAX_LOGS));
    }

    function handleError(event: ErrorEvent) {
      appendLog({
        level: "error",
        message: event.message || toLogMessage(event.error),
        source: event.filename || undefined,
        lineno: event.lineno || undefined,
        colno: event.colno || undefined,
        occurred_at: new Date().toISOString()
      });
    }

    function handleRejection(event: PromiseRejectionEvent) {
      appendLog({
        level: "unhandledrejection",
        message: toLogMessage(event.reason),
        occurred_at: new Date().toISOString()
      });
    }

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  const reportContext = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        path: "",
        user_agent: "",
        viewport: "",
        language: "",
        timezone: ""
      };
    }

    return {
      path: `${window.location.pathname}${window.location.search}${window.location.hash}`,
      user_agent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? ""
    };
  }, [open]);

  async function submit() {
    if (!message.trim()) return;
    setStatus("sending");

    const response = await fetch("/api/bug-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...reportContext,
        message,
        logs
      })
    }).catch(() => null);

    if (!response?.ok) {
      setStatus("error");
      return;
    }

    setMessage("");
    setStatus("idle");
    setOpen(false);
  }

  function close() {
    setOpen(false);
    setStatus("idle");
  }

  return (
    <>
      <button
        type="button"
        className="bug-report-button"
        aria-label="不具合を報告"
        title="不具合を報告"
        onClick={() => {
          setOpen(true);
          setStatus("idle");
        }}
      >
        <BugIcon />
      </button>
      {open ? (
        <div className="dialog-backdrop" role="presentation" onClick={close}>
          <section
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="dialog-close" aria-label="閉じる" onClick={close}>
              <XIcon />
            </button>
            <div>
              <h2 id={titleId}>不具合を報告</h2>
              <p>匿名で送信されます。現在のページ、ブラウザ情報、直近のエラーログも一緒に送信します。</p>
            </div>
            <label className="field-stack">
              <span className="small">内容</span>
              <textarea
                className="textarea"
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  if (status !== "idle") setStatus("idle");
                }}
                placeholder="何をした時に、どのような問題が起きたかを書いてください。"
                maxLength={2000}
                required
              />
            </label>
            <div className="bug-report-context" aria-label="自動送信される情報">
              <span>{reportContext.path}</span>
              <span>{reportContext.viewport}</span>
              <span>{logs.length} 件のログ</span>
            </div>
            {status === "sent" ? <p className="small" role="status">送信しました。</p> : null}
            {status === "error" ? <p className="small form-error" role="alert">送信できませんでした。</p> : null}
            <div className="dialog-actions">
              <button className="button-secondary" type="button" onClick={close}>
                キャンセル
              </button>
              <button
                className="button-primary"
                type="button"
                onClick={submit}
                disabled={!message.trim() || status === "sending"}
              >
                {status === "sending" ? <span className="loading-spinner" aria-hidden="true" /> : null}
                {status === "sending" ? "送信中" : "送信"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
