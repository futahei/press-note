"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { BugIcon, FeedbackIcon, XIcon } from "@/components/Icons";
import type { BugReportLog } from "@/lib/types";

const MAX_LOGS = 20;

type FeedbackKind = "bug" | "feature";

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
  const [kind, setKind] = useState<FeedbackKind>("bug");
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

    const payload =
      kind === "feature"
        ? {
            kind,
            message,
            path: reportContext.path,
            logs: []
          }
        : {
            ...reportContext,
            kind,
            message,
            logs
          };

    const response = await fetch("/api/bug-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
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
        aria-label="フィードバックを送る"
        title="フィードバックを送る"
        onClick={() => {
          setOpen(true);
          setStatus("idle");
        }}
      >
        <FeedbackIcon />
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
              <h2 id={titleId}>フィードバックを送る</h2>
              <p>
                不具合報告または機能要望を匿名で送信できます。不具合報告には状況確認のため直近のエラーログも含めます。
              </p>
            </div>
            <div className="feedback-kind-toggle" role="radiogroup" aria-label="フィードバック種別">
              <button
                type="button"
                className={kind === "bug" ? "active" : ""}
                role="radio"
                aria-checked={kind === "bug"}
                onClick={() => setKind("bug")}
              >
                <BugIcon size={18} />
                不具合報告
              </button>
              <button
                type="button"
                className={kind === "feature" ? "active" : ""}
                role="radio"
                aria-checked={kind === "feature"}
                onClick={() => setKind("feature")}
              >
                <FeedbackIcon size={18} />
                機能要望
              </button>
            </div>
            <label className="field-stack">
              <span className="small">{kind === "bug" ? "不具合の内容" : "要望の内容"}</span>
              <textarea
                className="textarea"
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  if (status !== "idle") setStatus("idle");
                }}
                placeholder={
                  kind === "bug"
                    ? "何をした時に、どのような問題が起きたかを書いてください。"
                    : "追加してほしい機能や、改善してほしい点を書いてください。"
                }
                maxLength={2000}
                required
              />
            </label>
            <div className="bug-report-context" aria-label="自動送信される情報">
              <span>{reportContext.path}</span>
              {kind === "bug" ? (
                <>
                  <span>{reportContext.viewport}</span>
                  <span>{logs.length} 件のログ</span>
                </>
              ) : (
                <span>要望ではログを送信しません</span>
              )}
            </div>
            {status === "sent" ? (
              <p className="small" role="status">
                送信しました。
              </p>
            ) : null}
            {status === "error" ? (
              <p className="small form-error" role="alert">
                送信できませんでした。
              </p>
            ) : null}
            <div className="dialog-actions">
              <button className="button-secondary" type="button" onClick={close}>
                キャンセル
              </button>
              <button className="button-primary" type="button" onClick={submit} disabled={!message.trim() || status === "sending"}>
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
