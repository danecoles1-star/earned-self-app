// iCalendar zone observances from the runtime IANA time-zone database.
// Export a century of explicit tzdata transitions. Never infer annual rules from
// a single year (some zones have nonannual or politically determined changes).
// Calendar exports are snapshots; re-export after a timezone rule changes.
// Cache formatters: enumerating transitions must not repeatedly construct Intl objects.
const formatters = new Map<string, Intl.DateTimeFormat>();
const parts = (t: number, zone: string) => {
  let formatter = formatters.get(zone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    formatters.set(zone, formatter);
  }
  return Object.fromEntries(
    formatter.formatToParts(t).map((p) => [p.type, p.value]),
  );
};
const offset = (t: number, z: string) => {
  const p = parts(t, z);
  return (
    (Date.parse(
      `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`,
    ) -
      t) /
    60000
  );
};
const off = (v: number) =>
  (v < 0 ? "-" : "+") +
  String(Math.floor(Math.abs(v) / 60)).padStart(2, "0") +
  String(Math.abs(v) % 60).padStart(2, "0");
const stamp = (n: number) =>
  new Date(n).toISOString().replace(/[-:]/g, "").slice(0, 15);
const cache = new Map<string, string[]>();
export function calendarZone(zone: string, year: number): string[] {
  const key = zone + year;
  if (cache.has(key)) return cache.get(key)!;
  const begin = Date.UTC(year - 1, 0, 1),
    end = Date.UTC(year + 100, 0, 1),
    step = 86400000;
  const transitions: { at: number; from: number; to: number }[] = [];
  let prior = offset(begin, zone);
  for (let t = begin + step; t <= end; t += step) {
    const next = offset(t, zone);
    if (next !== prior) {
      let lo = t - step,
        hi = t;
      while (hi - lo > 60000) {
        const mid = Math.floor((lo + hi) / 120000) * 60000;
        if (offset(mid, zone) === prior) lo = mid;
        else hi = mid;
      }
      transitions.push({ at: hi, from: prior, to: next });
      prior = next;
    }
  }
  const out = ["BEGIN:VTIMEZONE", "TZID:" + zone];
  if (!transitions.length) {
    out.push(
      "BEGIN:STANDARD",
      "DTSTART:" + stamp(begin),
      "TZOFFSETFROM:" + off(prior),
      "TZOFFSETTO:" + off(prior),
      "END:STANDARD",
    );
  }
  transitions.forEach((t) => {
    const kind = t.to > t.from ? "DAYLIGHT" : "STANDARD";
    const local = new Date(t.at + t.from * 60000);
    out.push(
      "BEGIN:" + kind,
      "DTSTART:" + stamp(+local),
      "TZOFFSETFROM:" + off(t.from),
      "TZOFFSETTO:" + off(t.to),
    );
    out.push("END:" + kind);
  });
  out.push("END:VTIMEZONE");
  cache.set(key, out);
  return out;
}
