import Link from "next/link";
import { Inbox } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function EmptyState({ title, description, actionHref, actionLabel }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <Inbox size={28} aria-hidden />
      <div>
        <h2>{title}</h2>
        <p className="muted">{description}</p>
      </div>
      {actionHref && actionLabel ? (
        <Link className="button primary" href={actionHref}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
