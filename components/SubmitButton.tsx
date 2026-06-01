"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  className,
  pendingLabel
}: {
  children: ReactNode;
  className: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button className={className} type="submit" disabled={pending}>
      {pending ? <span className="loading-spinner" aria-hidden="true" /> : null}
      {pending ? (pendingLabel ?? children) : children}
    </button>
  );
}
