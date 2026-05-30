"use client";

import type { ReactNode } from "react";
import { useState } from "react";

export function SubmitButton({
  children,
  className,
  pendingLabel
}: {
  children: ReactNode;
  className: string;
  pendingLabel?: string;
}) {
  const [pending, setPending] = useState(false);

  return (
    <button
      className={className}
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (event.currentTarget.form?.checkValidity()) setPending(true);
      }}
    >
      {pending ? <span className="loading-spinner" aria-hidden="true" /> : null}
      {pending ? (pendingLabel ?? children) : children}
    </button>
  );
}
