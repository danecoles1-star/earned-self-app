import { calendarZone } from "./calendarZone";
import { scheduledInstant } from "../data/time";
import type { Recurrence } from "../data/types";
import type { Definition, Schedule } from "../data/types";
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
const stamp = (d: Date) =>
  d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
const escape = (s: string) =>
  s
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
function fold(s: string) {
  let out = "",
    line = "",
    bytes = 0;
  for (const c of s) {
    const size = new TextEncoder().encode(c).length;
    if (bytes + size > 74) {
      out += line + "\r\n ";
      line = "";
      bytes = 1;
    }
    line += c;
    bytes += size;
  }
  return out + line;
}
export function calendarContent(
  d: Definition,
  s: Schedule,
  minutes: number,
  origin: string,
  recurrence?: Recurrence | null,
) {
  const date = new Date(s.starts_at!);
  if (!Number.isFinite(date.valueOf()))
    throw new Error("Save a valid schedule first.");
  return (
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Earned Self//Commitments//EN",
      "CALSCALE:GREGORIAN",
      ...(recurrence
        ? calendarZone(s.time_zone!, Number(s.local_date!.slice(0, 4)))
        : []),
      "BEGIN:VEVENT",
      `UID:${s.commitment_id}@earned-self`,
      `SEQUENCE:${s.commitment_revision}`,
      `DTSTAMP:${stamp(new Date())}`,
      ...(recurrence
        ? [
            `DTSTART;TZID=${s.time_zone}:${s.local_date!.replaceAll("-", "")}T${s.local_time!.slice(0, 5).replace(":", "")}00`,
            `DURATION:PT${minutes}M`,
            repeatRule(recurrence, s),
          ]
        : [
            `DTSTART:${stamp(date)}`,
            `DTEND:${stamp(new Date(date.valueOf() + minutes * 60000))}`,
          ]),
      `SUMMARY:${escape(d.action)}`,
      `DESCRIPTION:${escape("Done means: " + d.criterion + "\n" + origin + "/app")}`,
      `LOCATION:${escape(s.location || "")}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .map(fold)
      .join("\r\n") + "\r\n"
  );
}
export function googleCalendarUrl(
  d: Definition,
  s: Schedule,
  minutes: number,
  origin: string,
  recurrence?: Recurrence | null,
) {
  const date = new Date(s.starts_at!);
  return (
    "https://calendar.google.com/calendar/render?" +
    new URLSearchParams({
      action: "TEMPLATE",
      ...(recurrence
        ? { recur: repeatRule(recurrence, s), ctz: s.time_zone! }
        : {}),
      text: d.action,
      dates: stamp(date) + "/" + stamp(new Date(+date + minutes * 60000)),
      details: "Done means: " + d.criterion + "\n" + origin + "/app",
      location: s.location || "",
    }).toString()
  );
}

function repeatRule(r: Recurrence, s: Schedule) {
  return (
    "RRULE:FREQ=WEEKLY;BYDAY=" +
    r.days.map((d) => ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][d]).join(",") +
    (r.until
      ? ";UNTIL=" +
        stamp(new Date(scheduledInstant(r.until, "23:59", s.time_zone)))
      : "")
  );
}
