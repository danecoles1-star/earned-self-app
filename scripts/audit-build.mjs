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
const headers = fs.readFileSync("dist/_headers", "utf8");
if (!/https:\/\/:version\.:project\.pages\.dev\/\*\n\s+X-Robots-Tag: noindex/.test(headers))
  throw new Error("Preview deployments must send X-Robots-Tag: noindex");
if (/connect-src[^;]*\*\.supabase\.co/.test(headers))
  throw new Error("CSP connect-src must name the exact Supabase project, not *.supabase.co");
if (!/\/assets\/\*\n\s+Cache-Control: public, max-age=31536000, immutable/.test(headers))
  throw new Error("Fingerprinted /assets must be cached as immutable");
if (/no-store/.test(headers))
  throw new Error("Cache-Control: no-store was the private-test setting; remove it");
if (/cloudflareaccess|cf-access/i.test(headers + text))
  throw new Error("Cloudflare Access references found; this release is public");
if (!fs.readFileSync("dist/robots.txt", "utf8").includes("Allow: /$"))
  throw new Error("robots.txt should allow the homepage only");
console.log(
  "Build boundary PASS: no preview adapter, preview identities or detected service credentials.",
);
