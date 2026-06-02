"use client";

import { useEffect, useState } from "react";
import { getNextCheckTimeLabel } from "@/lib/check-schedule";

export function NextCheckTime() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    setLabel(getNextCheckTimeLabel(new Date()));
  }, []);

  return <span suppressHydrationWarning>{label ?? "--:--"}</span>;
}
