// Local-only static test server: exercise the built app with its deployed headers.
// Applies _headers rules the way Cloudflare Pages does for this file's patterns:
// "/*", "/prefix/*" and exact paths. Absolute-host rules (preview hostnames) are skipped.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
const root = path.resolve("dist");
const rules = [];
for (const line of fs
  .readFileSync(path.join(root, "_headers"), "utf8")
  .split("\n")) {
  if (!line.trim() || line.trim().startsWith("#")) continue;
  if (!line.startsWith(" ")) rules.push({ pattern: line.trim(), headers: {} });
  else if (rules.length) {
    const i = line.indexOf(":");
    rules.at(-1).headers[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
}
const matches = (pattern, pathname) =>
  !pattern.startsWith("http") &&
  (pattern.endsWith("*")
    ? pathname.startsWith(pattern.slice(0, -1))
    : pathname === pattern);
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
};
http
  .createServer((req, res) => {
    const pathname = new URL(req.url, "http://localhost").pathname;
    let file = path.resolve(root, "." + pathname);
    if (!file.startsWith(root + path.sep)) file = path.join(root, "index.html");
    if (!fs.existsSync(file) || !fs.statSync(file).isFile())
      file = path.join(root, "index.html");
    const headers = Object.assign(
      {},
      ...rules.filter((r) => matches(r.pattern, pathname)).map((r) => r.headers),
    );
    res.writeHead(200, {
      ...headers,
      "Content-Type": mime[path.extname(file)] || "application/octet-stream",
    });
    fs.createReadStream(file).pipe(res);
  })
  .listen(4174, "127.0.0.1");
