export const CRAWL_CHECK_HOURS = [6, 12, 18] as const;

export function getNextCheckTimeLabel(now = new Date()) {
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const nextHour =
    CRAWL_CHECK_HOURS.find((hour) => currentHour < hour || (currentHour === hour && currentMinute === 0)) ??
    CRAWL_CHECK_HOURS[0];

  return `${String(nextHour).padStart(2, "0")}:00`;
}
