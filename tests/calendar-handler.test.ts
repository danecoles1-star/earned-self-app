import { describe, it, expect } from "vitest";
// The deployed worker is intentionally standalone JavaScript for direct upload.
// @ts-expect-error No application TypeScript import is needed for the worker.
import worker from "../public/_worker.js";
const origin = "https://earned-self.pages.dev";
const fields = {
  id: "11111111-1111-4111-8111-111111111111",
  revision: "2",
  action: "Write the opening paragraph",
  criterion: "One complete paragraph",
  location: "At my desk",
  starts: "2030-11-01T17:00:00-06:00",
  minutes: "30",
};
function request(values = fields, options: RequestInit = {}) {
  return new Request(origin + "/calendar-event.ics", {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(values).toString(),
    ...options,
  });
}
describe("calendar response", () => {
  it("offers an inline, private event with the correct UTC time, duration and stable identity", async () => {
    const response = await worker.fetch(request(), {});
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "text/calendar; charset=utf-8",
    );
    expect(response.headers.get("content-disposition")).toBe(
      'inline; filename="Earned_Self_Move.ics"',
    );
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
    const text = await response.text();
    expect(text).toContain(
      "DTSTART:20301101T230000Z\r\nDTEND:20301101T233000Z",
    );
    expect(text).toContain("UID:" + fields.id + "@earned-self\r\nSEQUENCE:2");
    expect(text).toContain("SUMMARY:Write the opening paragraph");
    expect(text).toContain("LOCATION:At my desk");
    expect(text.replace(/\r\n /g, "")).toContain(
      "https://earned-self.pages.dev/app",
    );
  });
  it("escapes every newline form and folds Unicode without creating additional events", async () => {
    const title =
      "Climb 🏔️; together, " +
      "é".repeat(80) +
      "\rEND:VEVENT\r\nBEGIN:VEVENT\nSUMMARY:Injected";
    const response = await worker.fetch(
      request({ ...fields, action: title }),
      {},
    );
    const text = await response.text();
    expect(response.status).toBe(200);
    expect(
      text.split("\r\n").filter((line: string) => line === "BEGIN:VEVENT"),
    ).toHaveLength(1);
    for (const line of text.split("\r\n"))
      expect(Buffer.byteLength(line)).toBeLessThanOrEqual(75);
    const unfolded = text.replace(/\r\n /g, "");
    expect(unfolded).toContain("🏔️\\; together\\,");
    expect(unfolded).toContain(
      "\\nEND:VEVENT\\nBEGIN:VEVENT\\nSUMMARY:Injected",
    );
  });
  it.each([
    { starts: "not-a-date" },
    { starts: "2030-11-01T17:00:00" },
    { minutes: "0" },
    { minutes: "999" },
    { revision: "-1" },
    { id: "bad\rUID:injected" },
    { action: " " },
    { action: "bad\u0000title" },
  ])(
    "rejects invalid event values %j without reflecting them",
    async (change) => {
      const response = await worker.fetch(
        request({ ...fields, ...change }),
        {},
      );
      expect(response.status).toBe(400);
      expect(await response.text()).not.toContain("UID:");
    },
  );
  it("rejects cross-origin and missing-origin submissions", async () => {
    for (const headers of [{ Origin: "https://other.test" }, {}]) {
      expect(
        (await worker.fetch(request(fields, { headers }), {})).status,
      ).toBe(403);
    }
  });
  it("rejects GET, query strings, duplicate fields and oversized bodies", async () => {
    expect(
      (await worker.fetch(new Request(origin + "/calendar-event.ics"), {}))
        .status,
    ).toBe(405);
    expect(
      (
        await worker.fetch(
          new Request(origin + "/calendar-event.ics?event=private", {
            method: "POST",
            headers: {
              Origin: origin,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams(fields).toString(),
          }),
          {},
        )
      ).status,
    ).toBe(400);
    const duplicate = new URLSearchParams(fields);
    duplicate.append("action", "Other");
    expect(
      (await worker.fetch(request(fields, { body: duplicate.toString() }), {}))
        .status,
    ).toBe(400);
    expect(
      (
        await worker.fetch(
          request({ ...fields, action: "a".repeat(310000) }),
          {},
        )
      ).status,
    ).toBe(413);
  });
  it("accepts a private same-origin form navigation but rejects cross-site Origin null", async () => {
    for (const site of ["same-origin", "cross-site"]) {
      const response = await worker.fetch(
        request(fields, {
          headers: {
            Origin: "null",
            "Sec-Fetch-Site": site,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }),
        {},
      );
      expect(response.status).toBe(site === "same-origin" ? 200 : 403);
    }
  });
  it("leaves static asset handling to Cloudflare", async () => {
    let called = false;
    const response = await worker.fetch(new Request(origin + "/app"), {
      ASSETS: {
        fetch: () => {
          called = true;
          return new Response("static");
        },
      },
    });
    expect(called).toBe(true);
    expect(await response.text()).toBe("static");
  });
});
