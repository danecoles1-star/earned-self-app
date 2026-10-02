import type { Recurrence } from "./types";
export function checkRecurrence(
  value: unknown,
  start: string,
): Recurrence | null {
  if (value == null) return null;
  const r = value as Recurrence;
  if (
    !Array.isArray(r.days) ||
    !r.days.length ||
    r.days.length > 7 ||
    new Set(r.days).size !== r.days.length ||
    r.days.some((d) => !Number.isInteger(d) || d < 0 || d > 6) ||
    typeof r.until !== "string" ||
    (r.until &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(r.until) ||
        new Date(r.until).toISOString().slice(0, 10) !== r.until ||
        r.until < start))
  )
    throw new Error("Choose repeat days and a valid end date.");
  if (!r.days.includes(new Date(start + "T12:00:00Z").getUTCDay()))
    throw new Error("The start date must fall on a selected repeat day.");
  return r;
}
export function nextOccurrence(day: string, r: Recurrence): string | null {
  for (let n = 1; n <= 7; n++) {
    const date = new Date(day + "T12:00:00Z");
    date.setUTCDate(date.getUTCDate() + n);
    const next = date.toISOString().slice(0, 10);
    if (r.until && next > r.until) return null;
    if (r.days.includes(date.getUTCDay())) return next;
  }
  return null;
}
export function repeatLabel(r?: Recurrence | null) {
  return !r
    ? "One-time"
    : (r.days.length === 7
        ? "Daily"
        : r.days
            .map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d])
            .join(", ")) +
        (r.until
          ? " · until " +
            r.until.split("-").slice(1).concat(r.until.slice(0, 4)).join("/")
          : " · until stopped");
}
