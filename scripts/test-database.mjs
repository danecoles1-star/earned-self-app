import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
const db = new PGlite();
let checks = 0;
const pass = (name) => {
  checks++;
  console.log("PASS " + name);
};
await db.exec(
  `CREATE SCHEMA auth; CREATE ROLE authenticated; CREATE ROLE anon; GRANT USAGE ON SCHEMA public,auth TO authenticated,anon; CREATE TABLE auth.users(id uuid PRIMARY KEY); CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT jsonb_build_object('is_anonymous',coalesce(nullif(current_setting('request.jwt.claim.is_anonymous',true),''),'false')::boolean) $$; CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;`,
);
for (const file of fs.readdirSync("supabase/migrations").sort())
  await db.exec(fs.readFileSync("supabase/migrations/" + file, "utf8"));
pass("All three migrations compile in embedded PostgreSQL");
await db.exec(
  "CREATE SCHEMA supabase_migrations; CREATE TABLE supabase_migrations.schema_migrations(version text); INSERT INTO supabase_migrations.schema_migrations VALUES ('202609130001'),('202609130002'),('202609150001');",
);
await db.exec(
  fs.readFileSync("docs/Earned_Self_Supabase_Verification_v2.sql", "utf8"),
);
pass("Read-only installed-schema verifier passes");

const a = randomUUID(),
  b = randomUUID();
await db.query("INSERT INTO auth.users VALUES ($1),($2)", [a, b]);
async function as(user, role = "authenticated") {
  await db.exec("RESET ROLE");
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [
    user ?? "",
  ]);
  await db.exec("SET ROLE " + role);
}
async function command(actor, kind, payload, operation = randomUUID()) {
  const { rows } = await db.query(
    "SELECT public.es_command($1,$2,$3,$4::jsonb) result",
    [actor, operation, kind, JSON.stringify(payload)],
  );
  return rows[0].result;
}
async function state() {
  return (await db.query("SELECT public.es_read_state() s")).rows[0].s;
}
async function rejected(fn, match) {
  await assert.rejects(fn, match);
}
await as(a);
assert.equal((await state()).goals.length, 0);
pass("New account starts empty");
const goal = randomUUID(),
  op = randomUUID(),
  payload = {
    id: goal,
    words: "Publish a short essay.\n自分の言葉 ✨",
    vision: "Become a published writer",
    outcome: "Essay published",
    constraints: "Keep my job",
    capabilities: "Edit clearly",
    unknowns: "Publication fit",
    affirmed: true,
    milestones: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        title: "Draft essay",
        criterion: "Draft ready",
        localDate: "2030-12-01",
        localTime: "17:00",
        timeZone: "America/Denver",
      },
    ],
    meaning: "Something I have put off.",
  };
const first = await command(a, "goal", payload, op),
  again = await command(a, "goal", payload, op);
assert.deepEqual(first, again);
assert.equal((await state()).goals.length, 1);
assert.equal((await state()).goals[0].words, payload.words);
pass("Goal idempotency and exact Unicode words");
await rejected(
  () => command(a, "goal", { ...payload, words: "Changed" }, op),
  /changed/,
);
pass("Changed payload with same operation rejected");
await as(b);
assert.equal((await state()).goals.length, 0);
await rejected(
  () =>
    command(b, "commitment", {
      id: randomUUID(),
      goalId: goal,
      action: "X",
      criterion: "Y",
      milestoneId: "11111111-1111-4111-8111-111111111111",
      decision: "continue",
    }),
  /unavailable/,
);
await rejected(() => command(a, "select", { goalId: goal }), /account changed/);
pass("Cross-account reads, parent writes and actor spoofing blocked");
await as(a);
await rejected(
  () =>
    db.query("INSERT INTO public.es_goals(id,owner_id) VALUES($1,$2)", [
      randomUUID(),
      a,
    ]),
  /permission denied/,
);
await rejected(
  () => db.query("SELECT * FROM public.es_operations"),
  /permission denied/,
);
pass("Direct browser DML and receipt reads denied");
const cid = randomUUID(),
  cOp = randomUUID();
const c = {
  id: cid,
  goalId: goal,
  action: "Write the opening paragraph.",
  criterion: "A paragraph saved in my draft.",
  milestoneId: "11111111-1111-4111-8111-111111111111",
  decision: "continue",
  localDate: "2020-01-10",
  localTime: "12:00",
  timeZone: "America/Denver",
  location: "Desk",
};
await command(a, "commitment", c, cOp);
await command(a, "commitment", c, cOp);
let s = await state();
assert.equal(s.commitments.length, 1);
assert.equal(s.evidence.length, 0);
assert.ok(s.schedules[0].starts_at);
pass("One commitment; past due remains unreported");
await rejected(
  () => command(a, "commitment", { ...c, id: randomUUID() }),
  /current commitment/,
);
pass("Second current commitment rejected");
const evidence = cid,
  outcomeOp = randomUUID(),
  outcome = {
    id: evidence,
    goalId: goal,
    commitmentId: cid,
    version: 1,
    result: "did_not_happen",
    prevented: "Work ran late",
    adjustment: "Protect lunch",
  };
await command(a, "outcome", outcome, outcomeOp);
await command(a, "outcome", outcome, outcomeOp);
s = await state();
assert.equal(s.evidence.length, 1);
assert.equal(s.commitments[0].state, "reported");
assert.equal(s.reports[0].occurred_on, null);
pass(
  "Atomic miss and replay preserve one evidence identity; unknown occurrence",
);
await rejected(() => command(a, "outcome", outcome), /already has a result/);
pass("Different operation cannot duplicate an attempt result");
const next = randomUUID();
await command(a, "commitment", {
  ...c,
  id: next,
  decision: "recommit",
  reason: "Protect lunch",
  localDate: "2030-10-01",
  location: "",
});
s = await state();
assert.equal(s.evidence.length, 1);
assert.equal(s.reports[0].result, "did_not_happen");
assert.equal(s.commitments.filter((c) => c.state === "active").length, 1);
pass("Miss remains after return commitment");
await command(a, "detail", {
  goalId: goal,
  evidenceId: evidence,
  version: 1,
  detail: "Work ran late.",
  reflection: "I want to try after lunch.",
});
s = await state();
assert.equal(s.evidence.length, 1);
assert.equal(s.reports.length, 2);
assert.equal(s.evidence[0].revision, 2);
await rejected(
  () =>
    command(a, "detail", {
      goalId: goal,
      evidenceId: evidence,
      version: 1,
      detail: "Stale",
    }),
  /changed/,
);
pass(
  "Optional detail is a revision, not a second accomplishment; stale edit rejected",
);
await as(b);
await rejected(
  () =>
    command(b, "detail", {
      goalId: goal,
      evidenceId: evidence,
      version: 2,
      detail: "Overwrite",
    }),
  /unavailable/,
);
assert.equal(
  (await db.query("SELECT * FROM public.es_evidence")).rows.length,
  0,
);
pass("Cross-account evidence read and correction denied");
await as(a);
const goalB = randomUUID();
await command(a, "goal", {
  id: goalB,
  ...payload,
  id: goalB,
  words: "Another independent goal.",
});
await command(a, "select", { goalId: goal });
s = await state();
assert.equal(s.selectedGoal, goal);
assert.equal(s.commitments.filter((c) => c.goal_id === goalB).length, 0);
pass("Goal A to B to A preserves independent plans");
await rejected(
  () =>
    command(a, "commitment", {
      ...c,
      id: randomUUID(),
      goalId: goalB,
      localTime: "",
    }),
  /required/,
);
await rejected(
  () =>
    command(a, "commitment", {
      ...c,
      id: randomUUID(),
      goalId: goalB,
      milestoneId: randomUUID(),
    }),
  /milestone/,
);
pass("Required action time and milestone membership enforced by SQL");

await rejected(
  () =>
    command(a, "goal", {
      id: randomUUID(),
      kind: "goal",
      words: "Fake",
      owner_id: b,
    }),
  /Unsupported/,
);
pass("Unknown and ownership payload fields rejected");
let before = await state();
await rejected(
  () =>
    command(a, "commitment", {
      id: randomUUID(),
      goalId: goalB,
      action: "Prepare",
      criterion: "Done",
      milestoneId: "11111111-1111-4111-8111-111111111111",
      decision: "continue",
      localDate: "2026-03-08",
      localTime: "02:30",
      timeZone: "America/Denver",
    }),
  /does not exist/,
);
s = await state();
assert.equal(s.commitments.length, before.commitments.length);
pass("DST gap rejected with no partial commitment");
await rejected(
  () =>
    command(a, "commitment", {
      id: randomUUID(),
      goalId: goalB,
      action: "Prepare",
      criterion: "Done",
      milestoneId: "11111111-1111-4111-8111-111111111111",
      decision: "continue",
      localDate: "2026-11-01",
      localTime: "01:30",
      timeZone: "America/Denver",
    }),
  /repeats/,
);
pass("DST repeated time requires an unambiguous time");
await as(null, "anon");
await rejected(() => state(), /permission denied/);
await rejected(
  () => db.query("SELECT * FROM public.es_goals"),
  /permission denied/,
);
pass("Anonymous access denied");
await as(a);
await db.query(
  "SELECT set_config('request.jwt.claim.is_anonymous','true',false)",
);
assert.equal((await state()).goals.length, 0);
await rejected(() => command(a, "select", { goalId: goal }), /account changed/);
await db.query(
  "SELECT set_config('request.jwt.claim.is_anonymous','false',false)",
);
pass("Anonymous-authenticated identities also denied");
await as(a);
const orphanOp = randomUUID();
await rejected(
  () =>
    command(
      a,
      "commitment",
      {
        id: randomUUID(),
        goalId: goalB,
        action: "",
        criterion: "x",
        milestoneId: "11111111-1111-4111-8111-111111111111",
        decision: "continue",
      },
      orphanOp,
    ),
  /criterion/,
);
await db.exec("RESET ROLE");
assert.equal(
  (
    await db.query("SELECT * FROM public.es_operations WHERE operation_id=$1", [
      orphanOp,
    ])
  ).rows.length,
  0,
);
pass("Failed command leaves no receipt or partial data");
await as(a);
s = await state();
assert.equal(s.goals.find((g) => g.id === goal).status, "active");
assert.equal(s.goals.find((g) => g.id === goalB).status, "draft");
pass("Draft and active pursuits are distinct");
const current = s.commitments.find((c) => c.id === next);
const reschedule = {
  goalId: goal,
  commitmentId: next,
  version: current.version,
  action: "Protected lunch",
  criterion: "Paragraph",
  localDate: "2030-10-02",
  localTime: "12:00",
  timeZone: "America/Denver",
  reason: "Protect preparation",
};
await command(a, "reschedule", reschedule);
s = await state();
assert.equal(s.definitions.filter((d) => d.commitment_id === next).length, 2);
assert.equal(s.schedules.filter((x) => x.commitment_id === next).length, 2);
await rejected(() => command(a, "reschedule", reschedule), /changed/);
pass("Rescheduling keeps prior definition and schedule; stale revision denied");
let g = s.goals.find((g) => g.id === goal);
await command(a, "milestone_schedule", {
  goalId: goal,
  version: g.version,
  milestoneId: payload.milestones[0].id,
  localDate: "2030-12-02",
  localTime: "17:00",
  timeZone: "America/Denver",
  reason: "More preparation",
});
s = await state();
assert.equal(
  s.goalHistory.find((h) => h.goal_id === goal && h.revision === 1)
    .milestones[0].localDate,
  "2030-12-01",
);
pass("Milestone deadline revision retains original plan");
g = s.goals.find((g) => g.id === goal);
await command(a, "status", {
  goalId: goal,
  version: g.version,
  status: "paused",
  detail: "Resolve blocker",
});
s = await state();
g = s.goals.find((g) => g.id === goal);
assert.equal(g.status, "paused");
await command(a, "status", {
  goalId: goal,
  version: g.version,
  status: "active",
  detail: "Ready to return",
});
s = await state();
g = s.goals.find((g) => g.id === goal);
await rejected(
  () =>
    command(a, "status", {
      goalId: goal,
      version: g.version,
      status: "completed",
      detail: "Done",
      reflection: "Learned",
      next: "Another",
    }),
  /outstanding/,
);
await command(a, "outcome", {
  id: randomUUID(),
  goalId: goal,
  commitmentId: next,
  version: 2,
  result: "done",
});
await command(a, "milestone", {
  goalId: goal,
  version: g.version,
  milestoneId: payload.milestones[0].id,
  detail: "Draft completed",
});
s = await state();
g = s.goals.find((g) => g.id === goal);
assert.equal(g.status, "active");
await command(a, "status", {
  goalId: goal,
  version: g.version,
  status: "completed",
  detail: "Published essay",
  reflection: "My own conclusion",
  next: "Write again",
});
s = await state();
assert.equal(s.goals.find((g) => g.id === goal).status, "completed");
pass(
  "Pause, resume, preparation completion and major completion remain distinct",
);
await as(b);
assert.equal(
  (await db.query("SELECT * FROM public.es_pursuit_events")).rows.length,
  0,
);
await rejected(
  () =>
    db.exec(
      "INSERT INTO public.es_pursuit_events(owner_id,goal_id,kind,data) VALUES(gen_random_uuid(),gen_random_uuid(),'status','{}')",
    ),
  /permission denied/,
);
pass("New event history has owner RLS and no direct browser writes");
await db.exec("RESET ROLE");
await db.query("DELETE FROM auth.users WHERE id=$1", [a]);
assert.equal(
  (await db.query("SELECT * FROM public.es_goals WHERE owner_id=$1", [a])).rows
    .length,
  0,
);
assert.equal(
  (await db.query("SELECT * FROM public.es_operations WHERE owner_id=$1", [a]))
    .rows.length,
  0,
);
pass("Account deletion cascades owned data and receipts");
await db.close();
console.log(
  `DATABASE ${checks} checks passed. Ephemeral local PostgreSQL only; no remote Supabase connection.`,
);
