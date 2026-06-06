export function getGoogleAnalyticsMeasurementId() {
  const value = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  return value && /^G-[A-Z0-9]+$/i.test(value) ? value : null;
}

export function buildAnalyticsPagePath(pathname: string, searchParams: Pick<URLSearchParams, "toString">) {
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}
