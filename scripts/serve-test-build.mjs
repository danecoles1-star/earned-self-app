// Local-only static test server: exercise the built app with its deployed headers.
import http from "node:http";
import { calendarMiddleware } from "./calendar-middleware.mjs";
import fs from "node:fs";
import path from "node:path";
const root = path.resolve("dist");
const headers = Object.fromEntries(
  fs
    .readFileSync(path.join(root, "_headers"), "utf8")
    .split("\n")
    .filter((line) => line.startsWith("  "))
    .map((line) => {
      const i = line.indexOf(":");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    }),
);
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".webp": "image/webp",
  ".txt": "text/plain",
};
http
  .createServer((req, res) =>
    calendarMiddleware(req, res, () => {
      let file = path.resolve(
        root,
        "." + new URL(req.url, "http://localhost").pathname,
      );
      if (!file.startsWith(root + path.sep)) {
        file = path.join(root, "index.html");
      }
      if (!fs.existsSync(file) || !fs.statSync(file).isFile())
        file = path.join(root, "index.html");
      res.writeHead(200, {
        ...headers,
        "Content-Type": mime[path.extname(file)] || "application/octet-stream",
      });
      fs.createReadStream(file).pipe(res);
    }),
  )
  .listen(4174, "127.0.0.1");
