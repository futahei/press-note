export const CRAWL_CHECK_HOURS = [6, 12, 18] as const;

const jstClockFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Tokyo",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23"
});

function getJstClockParts(date: Date) {
  const parts = Object.fromEntries(jstClockFormatter.formatToParts(date).map((part) => [part.type, part.value]));
  return {
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second)
  };
}

export function getNextCheckTimeLabel(now = new Date()) {
  const current = getJstClockParts(now);
  const nextHour =
    CRAWL_CHECK_HOURS.find(
      (hour) => current.hour < hour || (current.hour === hour && current.minute === 0 && current.second === 0)
    ) ??
    CRAWL_CHECK_HOURS[0];

  return `${String(nextHour).padStart(2, "0")}:00`;
}
