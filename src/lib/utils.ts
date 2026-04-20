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

/**
 * Compute decimal hours between two "HH:MM" strings. Returns null if either is
 * missing, malformed, or time_out is not after time_in.
 */
export function computeHours(timeIn: string, timeOut: string): number | null {
  if (!timeIn || !timeOut) return null;
  const [inH, inM] = timeIn.split(":").map(Number);
  const [outH, outM] = timeOut.split(":").map(Number);
  if ([inH, inM, outH, outM].some((n) => Number.isNaN(n))) return null;
  const diffMin = outH * 60 + outM - (inH * 60 + inM);
  if (diffMin <= 0) return null;
  return Math.round((diffMin / 60) * 100) / 100;
}
