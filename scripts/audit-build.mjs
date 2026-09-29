import fs from "node:fs";
import path from "node:path";
const walk = (p) =>
  fs
    .readdirSync(p, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory() ? walk(path.join(p, e.name)) : [path.join(p, e.name)],
    );
const files = walk("dist");
const text = files
  .filter((p) => /\.(js|html)$/.test(p))
  .map((p) => fs.readFileSync(p, "utf8"))
  .join("\n");
for (const pattern of [
  "LOCAL-PREVIEW-ONLY",
  "Test next save failure",
  "local-preview-member",
  "createPreviewAdapter",
])
  if (text.includes(pattern))
    throw new Error("Unsafe preview build content: " + pattern);
if (
  /sb_secret_[a-zA-Z0-9_-]{12,}/.test(text) ||
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text)
)
  throw new Error("Possible secret in build");
for (const jwt of text.matchAll(
  /eyJ[a-zA-Z0-9_-]+\.([a-zA-Z0-9_-]+)\.[a-zA-Z0-9_-]+/g,
)) {
  try {
    if (
      JSON.parse(Buffer.from(jwt[1], "base64url").toString()).role ===
      "service_role"
    )
      throw new Error("Service credential in build");
  } catch (e) {
    if (e.message === "Service credential in build") throw e;
  }
}
if (!fs.readFileSync("dist/_headers", "utf8").includes("X-Robots-Tag: noindex"))
  throw new Error("Missing noindex");
console.log(
  "Build boundary PASS: no preview adapter, preview identities or detected service credentials.",
);

const calendarRoutes = JSON.parse(fs.readFileSync("dist/_routes.json", "utf8"));
if (
  calendarRoutes.version !== 1 ||
  JSON.stringify(calendarRoutes.include) !== '["/calendar-event.ics"]' ||
  calendarRoutes.exclude.length !== 0 ||
  !fs.existsSync("dist/_worker.js")
)
  throw new Error("Missing calendar worker or incorrect route scope");
console.log("Calendar handler and route included in build.");
