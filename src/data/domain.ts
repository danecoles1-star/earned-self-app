import {
  emptySnapshot,
  type Snapshot,
  type Command,
  type Receipt,
  type Result,
} from "./types";
export function required(value: unknown, label: string, max = 10000): string {
  if (typeof value !== "string" || !value.trim())
    throw new Error(`${label} is required.`);
  if (value.length > max)
    throw new Error(
      `${label} must be ${max.toLocaleString()} characters or fewer. Your text has not been shortened.`,
    );
  return value;
}
export function currentAction(s: Snapshot, goalId: string) {
  return s.commitments.find(
    (c) => c.goal_id === goalId && c.state === "active",
  );
}
export function definition(s: Snapshot, id: string, revision: number) {
  return s.definitions.find(
    (d) => d.commitment_id === id && d.revision === revision,
  );
}
export function currentReport(s: Snapshot, id: string, revision: number) {
  return s.reports.find((r) => r.evidence_id === id && r.revision === revision);
}
export function actionStatus(s: Snapshot, id: string): Result | "unreported" {
  const e = s.evidence.find((e) => e.commitment_id === id);
  return e
    ? (currentReport(s, e.id, e.revision)?.result ?? "unreported")
    : "unreported";
}
export function validateCommand(c: Command) {
  const p = c.payload;
  if (c.kind === "goal") {
    required(p.words, "Your goal");
    if (!["goal", "vision"].includes(String(p.kind)))
      throw new Error("Choose goal or vision.");
  }
  if (c.kind === "commitment") {
    required(p.action, "Action");
    required(p.criterion, "Done criterion");
    if (!["deliberate", "quick"].includes(String(p.mode)))
      throw new Error("Choose a commitment mode.");
  }
  if (
    c.kind === "outcome" &&
    !["done", "partly", "did_not_happen"].includes(String(p.result))
  )
    throw new Error("Choose what happened.");
  for (const name of ["meaning", "detail", "reflection", "location"]) {
    const v = p[name];
    if (typeof v === "string" && v.length > 10000)
      throw new Error(
        `${name} must be 10,000 characters or fewer. Your text has not been shortened.`,
      );
  }
}
export { emptySnapshot };
export type LocalStore = {
  snapshot: Snapshot;
  receipts: Record<string, { signature: string; receipt: Receipt }>;
};
// Pure local test engine. Used only by isolated preview and tests, never the Supabase adapter.
export function applyLocal(
  store: LocalStore,
  c: Command,
  owner: string,
): { store: LocalStore; receipt: Receipt } {
  if (c.actorId !== owner)
    throw new Error(
      "Your account changed. Sign in to the original account before retrying.",
    );
  validateCommand(c);
  const signature = JSON.stringify(c);
  const replay = store.receipts[c.operationId];
  if (replay) {
    if (replay.signature !== signature)
      throw new Error("This save has changed. Review it and save again.");
    return { store, receipt: replay.receipt };
  }
  const next = structuredClone(store),
    s = next.snapshot,
    p = c.payload,
    id = String(p.id ?? crypto.randomUUID()),
    now = new Date().toISOString();
  let receipt: Receipt = { id, version: 1 };
  if (c.kind === "goal") {
    s.goals.push({
      id,
      owner_id: owner,
      words: String(p.words),
      kind: p.kind as "goal" | "vision",
      meaning: String(p.meaning || "") || null,
      created_at: now,
      version: 1,
    });
    s.selectedGoal = id;
  } else if (c.kind === "support") {
    if (!["guided", "on_request"].includes(String(p.mode)))
      throw new Error("Choose a support mode.");
    s.supportMode = p.mode as "guided" | "on_request";
    receipt = { id: owner, version: 1 };
  } else if (c.kind === "select") {
    if (!s.goals.some((g) => g.id === p.goalId))
      throw new Error("Goal unavailable.");
    s.selectedGoal = String(p.goalId);
    receipt = { id: String(p.goalId), version: 1 };
  } else if (c.kind === "commitment") {
    if (!s.goals.some((g) => g.id === p.goalId))
      throw new Error("Goal unavailable.");
    if (currentAction(s, String(p.goalId)))
      throw new Error("Record the current commitment before choosing another.");
    s.commitments.push({
      id,
      owner_id: owner,
      goal_id: String(p.goalId),
      revision: 1,
      version: 1,
      state: "active",
      created_at: now,
    });
    s.definitions.push({
      commitment_id: id,
      goal_id: String(p.goalId),
      revision: 1,
      action: String(p.action),
      criterion: String(p.criterion),
      mode: p.mode as "quick" | "deliberate",
    });
    if (p.localDate || p.location)
      s.schedules.push({
        id: crypto.randomUUID(),
        commitment_id: id,
        goal_id: String(p.goalId),
        commitment_revision: 1,
        local_date: String(p.localDate || "") || null,
        local_time: String(p.localTime || "") || null,
        time_zone: String(p.timeZone || "") || null,
        starts_at: String(p.startsAt || "") || null,
        location: String(p.location || "") || null,
      });
  } else if (c.kind === "outcome") {
    const commit = s.commitments.find(
      (v) => v.id === p.commitmentId && v.goal_id === p.goalId,
    );
    if (!commit) throw new Error("Commitment unavailable.");
    if (s.evidence.some((e) => e.commitment_id === commit.id))
      throw new Error(
        "This commitment already has a result. Open its Record entry.",
      );
    if (commit.version !== p.version)
      throw new Error("This commitment changed. Reload its current version.");
    const schedule = s.schedules.find((x) => x.commitment_id === commit.id);
    s.evidence.push({
      id,
      goal_id: commit.goal_id,
      commitment_id: commit.id,
      commitment_revision: commit.revision,
      schedule_id: schedule?.id ?? null,
      revision: 1,
      version: 1,
      recorded_at: now,
    });
    s.reports.push({
      evidence_id: id,
      goal_id: commit.goal_id,
      revision: 1,
      result: p.result as Result,
      detail: String(p.detail || "") || null,
      reflection: String(p.reflection || "") || null,
      occurred_on: String(p.occurredOn || "") || null,
      recorded_at: now,
    });
    commit.state = "reported";
    commit.version++;
  } else if (c.kind === "detail") {
    const e = s.evidence.find(
      (e) => e.id === p.evidenceId && e.goal_id === p.goalId,
    );
    if (!e) throw new Error("Entry unavailable.");
    if (e.version !== p.version)
      throw new Error("This entry changed. Reload before saving.");
    const r = currentReport(s, e.id, e.revision)!;
    e.revision++;
    e.version++;
    s.reports.push({
      ...r,
      revision: e.revision,
      detail: String(p.detail || "") || null,
      reflection: String(p.reflection || "") || null,
      recorded_at: now,
    });
    receipt = { id: e.id, version: e.version };
  }
  next.receipts[c.operationId] = { signature, receipt };
  return { store: next, receipt };
}
