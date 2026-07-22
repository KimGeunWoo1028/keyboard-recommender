const APP_TIME_ZONE = "Asia/Seoul";

const ABSOLUTE_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const ABSOLUTE_DATE_TIME_WITH_SECONDS_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
});

const DATE_ONLY_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "long",
  day: "numeric",
});

function hasExplicitTimeZone(raw: string): boolean {
  return /(?:Z|[+-]\d{2}:\d{2})$/i.test(raw.trim());
}

export function parseDateTime(value?: string | number | Date | null): Date | null {
  if (value == null) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = hasExplicitTimeZone(trimmed) ? trimmed : `${trimmed}Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toEpochMs(value?: string | number | Date | null): number {
  return parseDateTime(value)?.getTime() ?? 0;
}

export function formatAbsoluteDate(value?: string | number | Date | null): string {
  const parsed = parseDateTime(value);
  if (!parsed) return "-";
  return DATE_ONLY_FORMATTER.format(parsed);
}

export function formatAbsoluteDateTime(
  value?: string | number | Date | null,
  options?: { includeSeconds?: boolean },
): string {
  const parsed = parseDateTime(value);
  if (!parsed) return "-";
  return (options?.includeSeconds ? ABSOLUTE_DATE_TIME_WITH_SECONDS_FORMATTER : ABSOLUTE_DATE_TIME_FORMATTER).format(
    parsed,
  );
}

export function formatRelativeKo(
  value?: string | number | Date | null,
  options?: { now?: string | number | Date | null },
): string | null {
  const parsed = parseDateTime(value);
  if (!parsed) return null;
  const now = parseDateTime(options?.now) ?? new Date();
  const diffMs = now.getTime() - parsed.getTime();
  if (diffMs <= 0) return "방금 전";
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}주 전`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}개월 전`;
  return `${Math.floor(days / 365)}년 전`;
}

export { APP_TIME_ZONE };
