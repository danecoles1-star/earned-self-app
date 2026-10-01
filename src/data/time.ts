// Resolve the member's wall clock in its IANA zone, independently of this device's zone.
// Reject gaps and repeated times instead of silently shifting the agreement.
export function scheduledInstant(
  day: unknown,
  time: unknown,
  zone: unknown,
): string {
  if (
    typeof day !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
    typeof time !== "string" ||
    !/^\d{2}:\d{2}$/.test(time) ||
    typeof zone !== "string" ||
    !zone
  )
    throw new Error("Date, time and time zone are required.");
  const wall = Date.parse(`${day}T${time}:00Z`);
  if (
    !Number.isFinite(wall) ||
    new Date(wall).toISOString().slice(0, 16) !== `${day}T${time}`
  )
    throw new Error("Choose a valid date and time.");
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
  } catch {
    throw new Error("Choose a valid IANA time zone.");
  }
  const local = (instant: number) => {
    const p = Object.fromEntries(
      formatter.formatToParts(instant).map((v) => [v.type, v.value]),
    );
    return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
  };
  const offsets = new Set<number>();
  for (const delta of [-48, -24, -12, 0, 12, 24, 48]) {
    const t = wall + delta * 3600000;
    offsets.add(Date.parse(local(t) + ":00Z") - t);
  }
  const matches = [...offsets]
    .map((o) => wall - o)
    .filter((t) => local(t) === `${day}T${time}`);
  if (!matches.length)
    throw new Error(
      "This local time does not exist because the clock changes. Choose another time.",
    );
  if (matches.length > 1)
    throw new Error(
      "This local time repeats because the clock changes. Choose an unambiguous time.",
    );
  return new Date(matches[0]).toISOString();
}

export function displayDate(day?: string | null) {
  if (!day) return "";
  const [y, m, d] = day.slice(0, 10).split("-");
  return `${m}/${d}/${y}`;
}
export function displayTime(time?: string | null) {
  if (!time) return "";
  const [h, m] = time.split(":");
  return `${Number(h) % 12 || 12}:${m} ${Number(h) < 12 ? "AM" : "PM"}`;
}
export function displaySchedule(
  day?: string | null,
  time?: string | null,
  zone?: string | null,
) {
  return [displayDate(day), displayTime(time), zone?.replaceAll("_", " ")]
    .filter(Boolean)
    .join(" · ");
}
