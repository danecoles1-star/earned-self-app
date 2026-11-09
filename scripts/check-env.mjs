// Fails a build that would ship without a working account connection.
// Runs before `vite build`. Reads the same variables Vite will embed:
// .env, .env.production, .env.production.local and the process environment
// (Cloudflare / GitHub Actions variables).
import { loadEnv } from "vite";

const mode = process.env.ES_BUILD_MODE || "production";
const env = loadEnv(mode, process.cwd(), "VITE_");
const expectedRef = process.env.ES_EXPECTED_SUPABASE_REF || "vovmkiuxmtnedfosoxds";
const problems = [];

const url = env.VITE_SUPABASE_URL || "";
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

if (!url) problems.push("VITE_SUPABASE_URL is missing.");
else if (url !== `https://${expectedRef}.supabase.co`)
  problems.push(
    `VITE_SUPABASE_URL is ${url}, expected https://${expectedRef}.supabase.co.`,
  );

if (!key) problems.push("VITE_SUPABASE_PUBLISHABLE_KEY is missing.");
else if (!key.startsWith("sb_publishable_"))
  problems.push("VITE_SUPABASE_PUBLISHABLE_KEY must be a publishable key (sb_publishable_…).");

for (const name of Object.keys(env))
  if (/SECRET|SERVICE_ROLE|PRIVATE/i.test(name))
    problems.push(`${name} must never be a VITE_ variable: it would be published in the app.`);

if (env.VITE_AI_ONBOARDING_PREVIEW === "true")
  problems.push("VITE_AI_ONBOARDING_PREVIEW is a development-only flag. Remove it for production builds.");

if (problems.length) {
  console.error("\nBuild stopped: production configuration needs attention.\n");
  for (const p of problems) console.error("  • " + p);
  console.error("\nSet these in Cloudflare (or .env.production.local for a local build). See DEPLOY.md.\n");
  process.exit(1);
}
console.log(`Environment check PASS: Supabase project ${expectedRef}, publishable key present.`);
