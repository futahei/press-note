"use client";

import { useEffect, useState } from "react";
import { FlagIcon, XIcon } from "@/components/Icons";

export function ReportButton({ articleId }: { articleId: string }) {
  const [reported, setReported] = useState(false);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const key = `pressnote:reported:${articleId}`;

  useEffect(() => {
    setReported(localStorage.getItem(key) === "1");
  }, [key]);

  async function report() {
    setBusy(true);
    const response = await fetch(`/api/articles/${articleId}/report`, { method: "POST" });
    setBusy(false);
    if (response.ok) {
      localStorage.setItem(key, "1");
      setReported(true);
      setOpen(false);
    }
  }

  return (
    <>
      <button
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
            aria-labelledby={`report-title-${articleId}`}
            aria-modal="true"
            className="dialog"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              aria-label="閉じる"
              className="dialog-close"
              type="button"
              onClick={() => setOpen(false)}
            >
              <XIcon size={18} />
            </button>
            <div>
              <h2 id={`report-title-${articleId}`}>この記事を報告しますか</h2>
              <p>
                この項目がプレスリリースではない場合のみ報告してください。送信後、このブラウザでは同じ記事を再報告できません。
              </p>
            </div>
            <div className="dialog-actions">
              <button className="button-secondary" type="button" onClick={() => setOpen(false)}>
                キャンセル
              </button>
              <button className="button-primary" type="button" onClick={report} disabled={busy}>
                {busy ? "送信中" : "報告する"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
