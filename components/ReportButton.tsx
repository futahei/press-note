"use client";

import { useEffect, useState } from "react";

export function ReportButton({ articleId }: { articleId: string }) {
  const [reported, setReported] = useState(false);
  const [busy, setBusy] = useState(false);
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
    }
  }

  return (
    <button className="button-rect" type="button" onClick={report} disabled={reported || busy}>
      {reported ? "報告済み" : busy ? "送信中" : "プレスではない"}
    </button>
  );
}
