import type { ReactNode } from "react";

type IconProps = {
  className?: string;
  size?: number;
};

function IconBase({
  children,
  className,
  size = 20
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      width={size}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-6h4v6" />
    </IconBase>
  );
}

export function ArchiveIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 7h16" />
      <path d="M5 7v13h14V7" />
      <path d="M8 4h8l2 3H6l2-3Z" />
      <path d="M10 11h4" />
    </IconBase>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
      <path d="M8 7h8" />
      <path d="M8 11h6" />
    </IconBase>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
      <path d="M10 21h4" />
    </IconBase>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="M9.5 12.5 11 14l4-4" />
    </IconBase>
  );
}

export function ExternalLinkIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M14 4h6v6" />
      <path d="m10 14 10-10" />
      <path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" />
    </IconBase>
  );
}

export function FlagIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 21V4" />
      <path d="M5 5h12l-2 4 2 4H5" />
    </IconBase>
  );
}

export function FeedbackIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M21 10a8 8 0 0 1-8 8H6l-3 2 1.2-4.2A8 8 0 1 1 21 10Z" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
    </IconBase>
  );
}

export function BugIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8 7.5a4 4 0 0 1 8 0" />
      <path d="M6 11h12" />
      <path d="M12 20a6 6 0 0 0 6-6v-3H6v3a6 6 0 0 0 6 6Z" />
      <path d="M4 14H2" />
      <path d="M22 14h-2" />
      <path d="m5 19-2 2" />
      <path d="m19 19 2 2" />
      <path d="M12 11v9" />
    </IconBase>
  );
}

export function XIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </IconBase>
  );
}
