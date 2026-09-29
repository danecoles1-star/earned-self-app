// Cloudflare Pages advanced-mode worker. Only this path invokes the worker.
// Stateless conversion: no database access, secrets, event storage or payload logging.
const route = "/calendar-event.ics";
const headers = {
  "Cache-Control": "no-store, private, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy":
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
};
const fail = (status) =>
  new Response(
    "Calendar could not open. Return to Earned Self and try again. Your commitment is still saved.",
    {
      status,
      headers: { ...headers, "Content-Type": "text/plain; charset=utf-8" },
    },
  );
const stamp = (date) =>
  date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
const escape = (text) =>
  text
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
function fold(text) {
  let result = "",
    size = 0;
  for (const char of text) {
    const bytes = new TextEncoder().encode(char).length;
    if (size + bytes > 75) {
      result += "\r\n ";
      size = 1;
    }
    result += char;
    size += bytes;
  }
  return result;
}
async function boundedBody(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing body");
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 300000) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== route) return env.ASSETS.fetch(request);
    if (request.method !== "POST") return fail(405);
    // This is not account authorization: only the submitted fields are converted.
    const origin = request.headers.get("Origin");
    // A no-referrer form can send Origin: null. Fetch Metadata still identifies
    // a same-origin browser navigation without exposing a referrer URL.
    if (
      origin !== url.origin &&
      !(
        (origin === null || origin === "null") &&
        request.headers.get("Sec-Fetch-Site") === "same-origin"
      )
    )
      return fail(403);
    if (
      url.search ||
      request.headers.get("Content-Type")?.split(";")[0] !==
        "application/x-www-form-urlencoded"
    )
      return fail(400);
    try {
      const body = await boundedBody(request);
      if (body === null) return fail(413);
      const data = new URLSearchParams(body);
      const get = (key, max, required = true) => {
        const values = data.getAll(key);
        if (
          values.length !== 1 ||
          values[0].length > max ||
          (required && !values[0].trim()) ||
          /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(values[0])
        )
          throw new Error("Invalid field");
        return values[0];
      };
      const action = get("action", 10000),
        criterion = get("criterion", 10000),
        location = get("location", 10000, false);
      const id = get("id", 36),
        revision = Number(get("revision", 10)),
        minutes = Number(get("minutes", 3));
      const starts = get("starts", 40),
        date = new Date(starts);
      if (
        !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
          id,
        ) ||
        !Number.isSafeInteger(revision) ||
        revision < 1 ||
        ![5, 10, 15, 30, 45, 60, 90, 120].includes(minutes) ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(
          starts,
        ) ||
        !Number.isFinite(+date)
      )
        return fail(400);
      const content =
        [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "PRODID:-//Earned Self//Commitments//EN",
          "CALSCALE:GREGORIAN",
          "METHOD:PUBLISH",
          "BEGIN:VEVENT",
          `UID:${id}@earned-self`,
          `SEQUENCE:${revision}`,
          `DTSTAMP:${stamp(new Date())}`,
          `DTSTART:${stamp(date)}`,
          `DTEND:${stamp(new Date(+date + minutes * 60000))}`,
          `SUMMARY:${escape(action)}`,
          `DESCRIPTION:${escape("Done means: " + criterion + "\n" + url.origin + "/app")}`,
          `LOCATION:${escape(location)}`,
          "END:VEVENT",
          "END:VCALENDAR",
        ]
          .map(fold)
          .join("\r\n") + "\r\n";
      return new Response(content, {
        headers: {
          ...headers,
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": 'inline; filename="Earned_Self_Move.ics"',
        },
      });
    } catch {
      return fail(400);
    }
  },
};
