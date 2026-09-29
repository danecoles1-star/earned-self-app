// Local dev/test bridge to the same self-contained Cloudflare handler.
import { Readable } from "node:stream";
import worker from "../public/_worker.js";
export function calendarMiddleware(req, res, next) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname !== "/calendar-event.ics") return next();
  const request = new Request(url, {
    method: req.method,
    headers: req.headers,
    ...(req.method !== "GET" && req.method !== "HEAD"
      ? { body: Readable.toWeb(req), duplex: "half" }
      : {}),
  });
  worker
    .fetch(request, {})
    .then(async (response) => {
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
    })
    .catch(() => {
      res.writeHead(500, { "Cache-Control": "no-store" });
      res.end("Calendar could not open. Return to Earned Self and try again.");
    });
}
