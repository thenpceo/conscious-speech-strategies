/**
 * Parse a date string (YYYY-MM-DD) as a local date, avoiding the UTC off-by-one bug.
 * `new Date("2026-04-12")` parses as UTC midnight, which displays as the previous day
 * in US timezones. This helper appends T00:00:00 to force local interpretation.
 */
export function formatLocalDate(
  dateStr: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(
    "en-US",
    options ?? { month: "short", day: "numeric", year: "numeric" }
  );
}
