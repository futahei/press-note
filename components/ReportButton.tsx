"use client";

import { useEffect, useId, useRef, useState } from "react";
import { FlagIcon, XIcon } from "@/components/Icons";

type ReportReason = "not_press_release" | "duplicate";

export function ReportButton({ articleId }: { articleId: string }) {
  const [reported, setReported] = useState(false);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("not_press_release");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const reasonName = useId();
  const key = `pressnote:reported:${articleId}`;

  useEffect(() => {
    setReported(localStorage.getItem(key) === "1");
  }, [key]);

  useEffect(() => {
    if (!open) return;

    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function report() {
    setBusy(true);
    try {
      const response = await fetch(`/api/articles/${articleId}/report`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason })
      });
      if (response.ok) {
        localStorage.setItem(key, "1");
        setReported(true);
        setOpen(false);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        aria-haspopup="dialog"
        aria-label={reported ? "報告済み" : "この記事を報告"}
        className="report-icon-button"
        disabled={reported || busy}
        title={reported ? "報告済み" : "この記事を報告"}
        type="button"
        onClick={() => setOpen(true)}
      >
        <FlagIcon size={18} />
      </button>
      {open ? (
        <div className="dialog-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <div
            aria-describedby={descriptionId}
            aria-labelledby={titleId}
            aria-modal="true"
            className="dialog"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              aria-label="閉じる"
              className="dialog-close"
              ref={closeButtonRef}
              type="button"
              onClick={() => setOpen(false)}
            >
              <XIcon size={18} />
            </button>
            <div>
              <h2 id={titleId}>この記事を報告しますか</h2>
              <p id={descriptionId}>
                該当する理由を選択してください。送信後、このブラウザでは同じ記事を再報告できません。
              </p>
            </div>
            <div className="radio-group" role="radiogroup" aria-label="報告理由">
              <label className="radio-option">
                <input
                  checked={reason === "not_press_release"}
                  name={reasonName}
                  type="radio"
                  value="not_press_release"
                  onChange={() => setReason("not_press_release")}
                />
                <span>プレスリリースではない</span>
              </label>
              <label className="radio-option">
                <input
                  checked={reason === "duplicate"}
                  name={reasonName}
                  type="radio"
                  value="duplicate"
                  onChange={() => setReason("duplicate")}
                />
                <span>同じ記事がある</span>
              </label>
            </div>
            <div className="dialog-actions">
              <button className="button-secondary" type="button" onClick={() => setOpen(false)}>
                キャンセル
              </button>
              <button className="button-primary" type="button" onClick={report} disabled={busy}>
                {busy ? <span className="loading-spinner" aria-hidden="true" /> : null}
                {busy ? "送信中" : "報告する"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
