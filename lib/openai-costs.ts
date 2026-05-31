import { env, requiredEnv } from "@/lib/env";

const OPENAI_COSTS_URL = "https://api.openai.com/v1/organization/costs";
const JAPAN_TIME_ZONE = "Asia/Tokyo";

type CostBucketWidth = "1d" | "1h";
type OpenAICostAmount = number | string | { value?: number | string | null; currency?: string | null } | null;

type OpenAICostBucket = {
  start_time: number;
  end_time: number;
  results?: Array<{
    amount?: OpenAICostAmount;
    api_key_id?: string | null;
    line_item?: string | null;
    project_id?: string | null;
  }>;
};

type OpenAICostsResponse = {
  data?: OpenAICostBucket[];
  has_more?: boolean;
  next_page?: string | null;
};

export type OpenAICostDaily = {
  usage_date: string;
  cost_usd: number;
};

export type OpenAICostDashboard = {
  costs: OpenAICostDaily[];
  available: boolean;
  error: string | null;
};

function getJstYearMonth(now: Date) {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: JAPAN_TIME_ZONE,
    year: "numeric",
    month: "numeric"
  }).formatToParts(now);
  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value)
  };
}

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getJstDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: JAPAN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

function getCurrentMonthRange(now: Date) {
  const { year, month } = getJstYearMonth(now);
  const startDateKey = toDateKey(year, month, 1);
  const nextMonthYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const endDateKey = toDateKey(nextMonthYear, nextMonth, 1);
  return {
    startTime: Math.floor(new Date(`${startDateKey}T00:00:00+09:00`).getTime() / 1000),
    endTime: Math.floor(new Date(`${endDateKey}T00:00:00+09:00`).getTime() / 1000)
  };
}

function getTodayRange(now: Date) {
  const todayKey = getJstDateKey(now);
  const tomorrow = new Date(new Date(`${todayKey}T00:00:00+09:00`).getTime() + 24 * 60 * 60 * 1000);
  return {
    todayKey,
    startTime: Math.floor(new Date(`${todayKey}T00:00:00+09:00`).getTime() / 1000),
    endTime: Math.floor(tomorrow.getTime() / 1000)
  };
}

function bucketDateKey(bucket: OpenAICostBucket) {
  return getJstDateKey(new Date(bucket.start_time * 1000));
}

function normalizeCostAmount(amount: OpenAICostAmount | undefined) {
  const value = typeof amount === "object" && amount !== null ? amount.value : amount;
  const numeric = typeof value === "string" ? Number(value) : value;
  return typeof numeric === "number" && Number.isFinite(numeric) ? numeric : 0;
}

function sumBucketCost(bucket: OpenAICostBucket) {
  return (bucket.results ?? []).reduce((sum, result) => sum + normalizeCostAmount(result.amount), 0);
}

function addOptionalArrayParam(params: URLSearchParams, name: string, value?: string) {
  if (value) params.append(`${name}[]`, value);
}

async function fetchOpenAICostBuckets({
  startTime,
  endTime,
  bucketWidth,
  strict = true
}: {
  startTime: number;
  endTime: number;
  bucketWidth: CostBucketWidth;
  strict?: boolean;
}) {
  const buckets: OpenAICostBucket[] = [];
  let page: string | null | undefined;

  do {
    const params = new URLSearchParams({
      start_time: String(startTime),
      end_time: String(endTime),
      bucket_width: bucketWidth,
      limit: bucketWidth === "1h" ? "168" : "31"
    });
    params.append("group_by[]", "line_item");
    addOptionalArrayParam(params, "api_key_ids", env("OPENAI_COST_API_KEY_ID"));
    if (page) params.set("page", page);

    const response = await fetch(`${OPENAI_COSTS_URL}?${params.toString()}`, {
      headers: {
        authorization: `Bearer ${requiredEnv("OPENAI_ADMIN_API_KEY")}`,
        "content-type": "application/json"
      }
    });

    if (!response.ok) {
      if (!strict) return null;
      throw new Error(`OpenAI costs request failed: ${response.status}`);
    }

    const payload = (await response.json()) as OpenAICostsResponse;
    buckets.push(...(payload.data ?? []));
    page = payload.has_more ? payload.next_page : null;
  } while (page);

  return buckets;
}

function aggregateDailyCosts(buckets: OpenAICostBucket[]) {
  const daily = new Map<string, number>();

  for (const bucket of buckets) {
    const dateKey = bucketDateKey(bucket);
    daily.set(dateKey, (daily.get(dateKey) ?? 0) + sumBucketCost(bucket));
  }

  return {
    costs: [...daily.entries()]
      .map(([usage_date, cost_usd]) => ({ usage_date, cost_usd }))
      .sort((a, b) => a.usage_date.localeCompare(b.usage_date))
  };
}

export async function listOpenAICostsForCurrentMonth(now = new Date()): Promise<OpenAICostDashboard> {
  if (!env("OPENAI_ADMIN_API_KEY")) {
    return {
      costs: [],
      available: false,
      error: "OPENAI_ADMIN_API_KEY is not set"
    };
  }

  try {
    const monthRange = getCurrentMonthRange(now);
    const todayRange = getTodayRange(now);
    const dailyBuckets = await fetchOpenAICostBuckets({ ...monthRange, bucketWidth: "1d" });
    const hourlyTodayBuckets = await fetchOpenAICostBuckets({
      startTime: todayRange.startTime,
      endTime: todayRange.endTime,
      bucketWidth: "1h",
      strict: false
    });
    const buckets = [...(dailyBuckets ?? [])];

    if (hourlyTodayBuckets) {
      const withoutToday = buckets.filter((bucket) => bucketDateKey(bucket) !== todayRange.todayKey);
      buckets.splice(0, buckets.length, ...withoutToday, ...hourlyTodayBuckets);
    }

    return {
      ...aggregateDailyCosts(buckets),
      available: true,
      error: null
    };
  } catch (error) {
    return {
      costs: [],
      available: true,
      error: error instanceof Error ? error.message : "OpenAI costs request failed"
    };
  }
}
