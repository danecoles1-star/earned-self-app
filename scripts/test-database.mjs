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
pass("All migrations compile in embedded PostgreSQL");
await db.exec(
  "CREATE SCHEMA supabase_migrations; CREATE TABLE supabase_migrations.schema_migrations(version text); INSERT INTO supabase_migrations.schema_migrations VALUES ('202609130001'),('202609130002'),('202609150001'),('202609180001'),('202609300001');",
);
await db.exec(
  fs.readFileSync("docs/Earned_Self_Supabase_Verification_v4.sql", "utf8"),
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
const queuedId = randomUUID();
await command(a, "commitment", { ...c, id: queuedId, localDate: "2030-10-02" });
assert.equal(
  (await state()).commitments.filter((c) => c.state === "active").length,
  2,
);
await command(a, "outcome", {
  id: queuedId,
  goalId: goal,
  commitmentId: queuedId,
  version: 1,
  result: "done",
  detail: "Queue test",
});
pass("Multiple scheduled steps coexist without changing the first");
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
assert.equal(s.evidence.length, 2);
assert.equal(s.commitments[0].state, "reported");
assert.equal(
  s.reports.find((r) => r.evidence_id === evidence).occurred_on,
  null,
);
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
assert.equal(s.evidence.length, 2);
assert.equal(
  s.reports.find((r) => r.evidence_id === evidence).result,
  "did_not_happen",
);
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
assert.equal(s.evidence.length, 2);
assert.equal(s.reports.length, 3);
assert.equal(s.evidence.find((e) => e.id === evidence).revision, 2);
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
// First-action import uses the same authenticated command boundary.
await as(a);
const firstGoal = randomUUID(),
  firstMove = randomUUID(),
  firstOp = randomUUID();
await command(a, "goal", { ...payload, id: firstGoal });
const firstPayload = {
  id: firstMove,
  goalId: firstGoal,
  action: "Draft one opening sentence",
  criterion: "One sentence written",
  result: "done",
  detail: "I wrote an opening sentence.",
};
await rejected(
  () => command(a, "first_move", { ...firstPayload, detail: "  " }),
  /clear before saving/i,
);
await rejected(
  () => command(a, "first_move", { ...firstPayload, result: "partly" }),
  /clear before saving/i,
);
assert.equal(
  (await state()).evidence.filter((e) => e.goal_id === firstGoal).length,
  0,
);
pass(
  "First-action import requires a fact and explanations for an incomplete result",
);
const firstReceipt = await command(a, "first_move", firstPayload, firstOp);
assert.deepEqual(
  await command(a, "first_move", firstPayload, firstOp),
  firstReceipt,
);
let firstState = await state();
assert.equal(firstState.goals.find((g) => g.id === firstGoal).status, "draft");
assert.equal(
  firstState.commitments.find((c) => c.id === firstMove).state,
  "reported",
);
assert.equal(
  firstState.schedules.filter((c) => c.commitment_id === firstMove).length,
  0,
);
assert.equal(
  firstState.evidence.filter((e) => e.goal_id === firstGoal).length,
  1,
);
pass(
  "First-action import is atomic and idempotent without inventing a schedule or activation",
);
await rejected(
  () => command(a, "first_move", { ...firstPayload, id: randomUUID() }),
  /already imported/i,
);
await rejected(
  () =>
    command(a, "first_move", { ...firstPayload, detail: "Changed" }, firstOp),
  /changed/i,
);
pass("Duplicate first-action imports and changed retries are rejected");
await as(b);
await rejected(
  () => command(b, "first_move", { ...firstPayload, id: randomUUID() }),
  /own draft/i,
);
assert.equal(
  (await state()).evidence.some((e) => e.id === firstMove),
  false,
);
pass("First-action import cannot read or write another account");
// Basecamp regression checks exercise real SQL commands and row ownership.
await as(a);
const bg = randomUUID(),
  pending = randomUUID();
await command(a, "goal", { ...payload, id: bg });
await command(a, "first_move", {
  goalId: bg,
  id: pending,
  action: "Write one sentence",
  criterion: "One sentence",
  result: "",
  detail: "",
  prevented: "",
  adjustment: "",
});
let bs = await state();
assert.equal(bs.commitments.find((c) => c.id === pending).state, "active");
assert.equal(bs.evidence.filter((e) => e.goal_id === bg).length, 0);
pass("Save-later retains pending first step without inventing Proof");
await command(a, "outcome", {
  id: randomUUID(),
  goalId: bg,
  commitmentId: pending,
  version: 1,
  result: "done",
  detail: "Sentence written",
});
const queued = randomUUID();
await command(a, "planned_step", {
  goalId: bg,
  id: queued,
  milestoneId: payload.milestones[0].id,
  action: "Edit opening",
  criterion: "Opening edited",
});
const bc = {
  ...c,
  id: randomUUID(),
  goalId: bg,
  plannedStepId: queued,
  localDate: "2030-10-01",
};
await command(a, "commitment", bc);
bs = await state();
const prior = bs.goals.find((g) => g.id === bg);
const extra = {
  ...payload.milestones[0],
  id: randomUUID(),
  title: "Submit essay",
  localDate: "2030-12-15",
};
await command(a, "plan", {
  ...payload,
  id: undefined,
  goalId: bg,
  version: prior.version,
  milestones: [...payload.milestones, extra],
});
bs = await state();
assert.equal(bs.goals.find((g) => g.id === bg).milestones.length, 2);
pass(
  "Active challenge accepts appended milestones while retaining current step",
);
await rejected(
  () =>
    command(a, "plan", {
      ...payload,
      id: undefined,
      goalId: bg,
      version: bs.goals.find((g) => g.id === bg).version,
      words: "Rewritten challenge",
      milestones: [
        ...payload.milestones,
        extra,
        { ...extra, id: randomUUID(), localDate: "2031-01-01" },
      ],
    }),
  /unchanged|existing/i,
);
pass("Appending milestones cannot rewrite prior agreements");
await command(a, "outcome", {
  id: randomUUID(),
  goalId: bg,
  commitmentId: bc.id,
  version: 1,
  result: "done",
  detail: "Edited opening",
});
await rejected(
  () => command(a, "commitment", { ...bc, id: randomUUID() }),
  /planned step/i,
);
pass("A queued step can become current only once");
bs = await state();
await command(a, "milestone", {
  goalId: bg,
  version: bs.goals.find((g) => g.id === bg).version,
  milestoneId: payload.milestones[0].id,
  result: "attempted",
  detail: "Not ready yet; practice editing",
});
bs = await state();
assert.equal(
  bs.events.filter((e) => e.goal_id === bg && e.kind === "milestone").length,
  0,
);
assert.equal(
  bs.events.filter((e) => e.goal_id === bg && e.kind === "milestone_attempt")
    .length,
  1,
);
pass("Milestone attempt records reflection without advancing the path");
await command(a, "milestone", {
  goalId: bg,
  version: bs.goals.find((g) => g.id === bg).version,
  milestoneId: payload.milestones[0].id,
  result: "done",
  detail: "Draft ready",
});
await rejected(
  () =>
    command(a, "planned_step", {
      goalId: bg,
      id: randomUUID(),
      milestoneId: payload.milestones[0].id,
      action: "Late step",
      criterion: "Done",
    }),
  /unfinished/i,
);
pass("Completed milestones reject new preparation steps");
await as(b);
await rejected(
  () =>
    command(b, "planned_step", {
      goalId: bg,
      id: randomUUID(),
      milestoneId: extra.id,
      action: "Other owner",
      criterion: "Blocked",
    }),
  /unavailable/i,
);
assert.equal(
  (await state()).events.some((e) => e.goal_id === bg),
  false,
);
pass("Queued steps and attempt reflections remain account-private");
// Queue / recurring-session regression: real SQL under authenticated RLS.
await as(a);
const qg = randomUUID(),
  qs = randomUUID();
await command(a, "goal", { ...payload, id: qg });
await command(a, "commitment", {
  ...c,
  id: qs,
  goalId: qg,
  localDate: "2030-11-02",
  localTime: "06:00",
  recurrence: { days: [0, 1, 2, 3, 4, 5, 6], until: "2030-11-04" },
});
const qo = randomUUID(),
  qp = {
    id: qs,
    goalId: qg,
    commitmentId: qs,
    version: 1,
    result: "done",
    detail: "Session completed",
  };
await command(a, "outcome", qp, qo);
await command(a, "outcome", qp, qo);
let queue = (await state()).commitments.filter(
  (c) => c.goal_id === qg && c.state === "active",
);
assert.equal(queue.length, 1);
assert.equal(
  (await state()).evidence.filter((e) => e.goal_id === qg).length,
  1,
);
assert.equal(
  new Date(
    (await state()).schedules.find(
      (s) => s.commitment_id === queue[0].id,
    ).starts_at,
  ).toISOString(),
  "2030-11-03T13:00:00.000Z",
);
pass(
  "Recurring check-in is atomic and idempotent across DST; next local time remains 6 AM",
);
await as(b);
await rejected(
  () =>
    command(b, "stop_repeat", {
      goalId: qg,
      commitmentId: queue[0].id,
      version: 1,
    }),
  /unavailable/,
);
await as(a);
await command(a, "stop_repeat", {
  goalId: qg,
  commitmentId: queue[0].id,
  version: 1,
});
await command(a, "outcome", {
  ...qp,
  id: queue[0].id,
  commitmentId: queue[0].id,
  version: 2,
});
assert.equal(
  (await state()).commitments.filter(
    (c) => c.goal_id === qg && c.state === "active",
  ).length,
  0,
);
pass(
  "Stop repetition is owner scoped and preserves current session and previous Proof",
);

for (const [day, time] of [
  ["2026-03-07", "02:30"],
  ["2026-10-31", "01:30"],
]) {
  const dg = randomUUID(),
    ds = randomUUID();
  await command(a, "goal", { ...payload, id: dg });
  await command(a, "commitment", {
    ...c,
    id: ds,
    goalId: dg,
    localDate: day,
    localTime: time,
    recurrence: { days: [0, 1, 2, 3, 4, 5, 6], until: "" },
  });
  await command(a, "outcome", {
    id: ds,
    goalId: dg,
    commitmentId: ds,
    version: 1,
    result: "done",
    detail: "Done",
  });
  const snap = await state(),
    next = snap.commitments.find(
      (x) => x.goal_id === dg && x.state === "active",
    );
  assert.equal(snap.evidence.filter((x) => x.goal_id === dg).length, 1);
  assert.equal(
    snap.schedules.find((x) => x.commitment_id === next.id).starts_at,
    null,
  );
  await rejected(
    () =>
      command(a, "outcome", {
        id: next.id,
        goalId: dg,
        commitmentId: next.id,
        version: 1,
        result: "done",
        detail: "Done",
      }),
    /time|schedule/i,
  );
  pass(
    "Clock-change gap/fold saves completed Proof and requires a time for the next session",
  );
}
const beforeVision = (await state()).goals.find((x) => x.id === qg);
await command(a, "vision", {
  goalId: qg,
  version: beforeVision.version,
  vision: "Healthy enough to climb mountains into my 70s",
});
assert.equal(
  (await state()).goals.find((x) => x.id === qg).words,
  beforeVision.words,
);
assert.equal(
  (await state()).goals.find((x) => x.id === qg).vision,
  "Healthy enough to climb mountains into my 70s",
);
await rejected(
  () =>
    command(a, "vision", {
      goalId: qg,
      version: beforeVision.version,
      vision: "Stale",
    }),
  /changed/,
);
await as(b);
await rejected(
  () =>
    command(b, "vision", {
      goalId: qg,
      version: beforeVision.version + 1,
      vision: "Foreign",
    }),
  /unavailable/,
);
await as(a);
pass("Vision edits preserve challenge and enforce owner and version checks");

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
