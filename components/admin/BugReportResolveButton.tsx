"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BugReportResolveButton({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function resolve() {
    setPending(true);
    setFailed(false);

    const response = await fetch(`/api/admin/bug-reports/${reportId}/resolve`, {
      method: "POST",
      headers: { Accept: "application/json" }
    }).catch(() => null);

    if (!response?.ok) {
      setPending(false);
      setFailed(true);
      return;
    }

    router.refresh();
    setPending(false);
  }

  return (
    <div className="field-stack">
      <button className="button-rect" type="button" onClick={resolve} disabled={pending}>
        {pending ? <span className="loading-spinner" aria-hidden="true" /> : null}
        {pending ? "更新中" : "対応完了"}
      </button>
      {failed ? (
        <p className="small form-error" role="alert">
          更新できませんでした。
        </p>
      ) : null}
    </div>
  );
}
