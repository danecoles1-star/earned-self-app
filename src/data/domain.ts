import {
  emptySnapshot,
  emptyFoundation,
  type Snapshot,
  type Command,
  type Receipt,
  type Result,
  type Foundation,
  type Goal,
  type PursuitState,
} from "./types";
import { checkRecurrence, nextOccurrence } from "./recurrence";
import { scheduledInstant } from "./time";
export { emptySnapshot };
export function required(value: unknown, label: string, max = 10000): string {
  if (typeof value !== "string" || !value.trim())
    throw new Error(`${label} is required.`);
  if (value.length > max)
    throw new Error(
      `${label} must be ${max.toLocaleString()} characters or fewer. Your text has not been shortened.`,
    );
  return value;
}
export const foundationKeys = Object.keys(emptyFoundation());
const allowed: Record<Command["kind"], string[]> = {
  vision: ["goalId", "version", "vision"],
  stop_repeat: ["goalId", "commitmentId", "version"],
  planned_step: ["goalId", "id", "milestoneId", "action", "criterion"],
  first_move: [
    "id",
    "goalId",
    "action",
    "criterion",
    "result",
    "detail",
    "prevented",
    "adjustment",
  ],
  goal: ["id", ...foundationKeys],
  plan: ["goalId", "version", ...foundationKeys],
  commitment: [
    "id",
    "goalId",
    "milestoneId",
    "plannedStepId",
    "recurrence",
    "action",
    "criterion",
    "localDate",
    "localTime",
    "timeZone",
    "location",
    "decision",
    "reason",
  ],
  reschedule: [
    "goalId",
    "commitmentId",
    "version",
    "action",
    "criterion",
    "localDate",
    "localTime",
    "timeZone",
    "location",
    "reason",
  ],
  milestone_schedule: [
    "goalId",
    "version",
    "milestoneId",
    "localDate",
    "localTime",
    "timeZone",
    "reason",
  ],
  milestone: [
    "goalId",
    "version",
    "milestoneId",
    "detail",
    "result",
    "remaining",
  ],
  status: ["goalId", "version", "status", "detail", "reflection", "next"],
  outcome: [
    "id",
    "goalId",
    "commitmentId",
    "version",
    "result",
    "detail",
    "reflection",
    "occurredOn",
    "prevented",
    "adjustment",
  ],
  detail: ["goalId", "evidenceId", "version", "detail", "reflection"],
  select: ["goalId"],
  support: ["mode"],
};
export function currentAction(s: Snapshot, goalId: string) {
  const queue = s.commitments
    .filter((c) => c.goal_id === goalId && c.state === "active")
    .sort(
      (a, b) =>
        (currentSchedule(s, a.id)?.starts_at || "").localeCompare(
          currentSchedule(s, b.id)?.starts_at || "",
        ) ||
        a.created_at.localeCompare(b.created_at) ||
        a.id.localeCompare(b.id),
    );
  // An in-progress session stays selected on this device when another step is added.
  const pinned = queue.find((c) => {
    try {
      const t = JSON.parse(
        localStorage.getItem(
          `earned-self:timer:${c.owner_id}:${c.id}:${c.revision}`,
        ) || "null",
      );
      return t && (t.started !== null || t.elapsed > 0);
    } catch {
      return false;
    }
  });
  return pinned || queue[0];
}
export function currentMilestone(s: Snapshot, g: Goal) {
  return g.milestones.find(
    (m) =>
      !s.events.some(
        (e) =>
          e.goal_id === g.id &&
          e.kind === "milestone" &&
          e.data.milestoneId === m.id,
      ),
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
export function currentSchedule(s: Snapshot, id: string) {
  return s.schedules.find(
    (v) => v.commitment_id === id && v.state === "current",
  );
}
export function actionStatus(s: Snapshot, id: string): Result | "unreported" {
  const e = s.evidence.find((e) => e.commitment_id === id);
  return e
    ? (currentReport(s, e.id, e.revision)?.result ?? "unreported")
    : "unreported";
}
export function isOverdue(s: Snapshot, id: string, now = Date.now()) {
  const schedule = currentSchedule(s, id);
  return (
    actionStatus(s, id) === "unreported" &&
    !!schedule?.starts_at &&
    Date.parse(schedule.starts_at) < now
  );
}
export function ready(g: Foundation) {
  for (const [key, label] of Object.entries({
    vision: "Your vision",
    words: "Major accomplishment",
    outcome: "Observable outcome",
    meaning: "Why this matters now",
    constraints: "Constraints or risks",
    capabilities: "Capabilities to develop",
    unknowns: "Unknowns to resolve",
  }))
    required(g[key as keyof Foundation], label);
  if (!g.affirmed)
    throw new Error(
      "Affirm that this accomplishment is meaningful, demanding and worth preparing for.",
    );
  if (!g.milestones.length)
    throw new Error("Add at least one preparation milestone.");
  let prior = -Infinity;
  for (const m of g.milestones) {
    required(m.title, "Milestone");
    required(m.criterion, "Milestone completion criteria");
    const instant = Date.parse(
      scheduledInstant(m.localDate, m.localTime, m.timeZone),
    );
    if (instant < prior)
      throw new Error(
        "Milestone deadlines must follow their preparation order.",
      );
    prior = instant;
  }
}
export function validateCommand(c: Command) {
  const p = c.payload;
  if (
    !allowed[c.kind] ||
    Object.keys(p).some((k) => !allowed[c.kind].includes(k))
  )
    throw new Error("Unsupported save fields.");
  for (const [k, v] of Object.entries(p))
    if (typeof v === "string" && v.length > 10000)
      throw new Error(
        `${k} must be 10,000 characters or fewer. Your text has not been shortened.`,
      );
  if (c.kind === "goal" || c.kind === "plan") {
    for (const k of foundationKeys.filter(
      (k) => !["milestones", "affirmed"].includes(k),
    ))
      if (typeof p[k] !== "string") throw new Error("Invalid pursuit text.");
    if (
      typeof p.affirmed !== "boolean" ||
      !Array.isArray(p.milestones) ||
      p.milestones.length > 30
    )
      throw new Error("Use up to 30 ordered milestones.");
    const ids = new Set();
    for (const m of p.milestones) {
      if (
        !m ||
        typeof m !== "object" ||
        Object.keys(m).sort().join() !==
          "criterion,id,localDate,localTime,timeZone,title"
      )
        throw new Error("Invalid milestone fields.");
      for (const v of Object.values(m))
        if (typeof v !== "string" || v.length > 10000)
          throw new Error("Invalid milestone text.");
      required(m.id, "Milestone identity");
      if (ids.has(m.id))
        throw new Error("Milestone identities must be unique.");
      ids.add(m.id);
    }
  }
  if (["commitment", "reschedule"].includes(c.kind)) {
    required(p.action, "Action");
    required(p.criterion, "Done criterion");
    scheduledInstant(p.localDate, p.localTime, p.timeZone);
    if (c.kind === "commitment")
      checkRecurrence(p.recurrence, String(p.localDate));
  }
  if (c.kind === "reschedule") required(p.reason, "What will change");
  if (c.kind === "planned_step") {
    required(p.action, "Step");
    required(p.criterion, "Completion criterion");
  }
  if (
    c.kind === "milestone" &&
    p.result !== undefined &&
    !["done", "attempted"].includes(String(p.result))
  )
    throw new Error("Choose a milestone result.");
  if (c.kind === "first_move") {
    required(p.action, "Action");
    required(p.criterion, "Done criterion");
    if (p.result !== "") required(p.detail, "What happened");
  }
  if (c.kind === "outcome" || (c.kind === "first_move" && p.result !== "")) {
    if (!["done", "partly", "did_not_happen"].includes(String(p.result)))
      throw new Error("Choose what happened.");
    if (p.result !== "done") {
      required(p.prevented, "What prevented it");
      required(p.adjustment, "What you will change");
    }
    if (
      p.occurredOn &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(String(p.occurredOn)) ||
        Date.parse(String(p.occurredOn)) > Date.now() + 86400000)
    )
      throw new Error("Choose a valid occurrence date, not in the future.");
  }
}
export type LocalStore = {
  snapshot: Snapshot;
  receipts: Record<string, { signature: string; receipt: Receipt }>;
};
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
  const signature = JSON.stringify(c),
    replay = store.receipts[c.operationId];
  if (replay) {
    if (replay.signature !== signature)
      throw new Error("This save changed. Review it before saving again.");
    return { store, receipt: replay.receipt };
  }
  const next = structuredClone(store),
    s = next.snapshot,
    p = c.payload,
    id = String(p.id ?? crypto.randomUUID()),
    now = new Date().toISOString();
  let receipt: Receipt = { id, version: 1 };
  const event = (
    goalId: string,
    kind: Snapshot["events"][number]["kind"],
    data: Record<string, string>,
  ) =>
    s.events.push({
      id: crypto.randomUUID(),
      goal_id: goalId,
      kind,
      data,
      recorded_at: now,
    });
  const foundation = () =>
    Object.fromEntries(
      foundationKeys.map((k) => [k, p[k]]),
    ) as unknown as Foundation;
  if (c.kind === "goal") {
    if (s.goals.some((g) => g.id === id))
      throw new Error("Pursuit already exists.");
    const g: Goal = {
      ...foundation(),
      id,
      owner_id: owner,
      kind: "goal",
      created_at: now,
      version: 1,
      revision: 1,
      status: "draft",
    };
    s.goals.push(g);
    s.goalHistory.push({
      ...structuredClone(foundation()),
      goal_id: id,
      revision: 1,
      recorded_at: now,
    });
    s.selectedGoal = id;
  } else if (c.kind === "support") {
    if (!["guided", "on_request"].includes(String(p.mode)))
      throw new Error("Choose a support mode.");
    s.supportMode = p.mode as Snapshot["supportMode"];
    receipt = { id: owner, version: 1 };
  } else {
    const g = s.goals.find((g) => g.id === p.goalId && g.owner_id === owner);
    if (!g) throw new Error("Pursuit unavailable.");
    const current = currentAction(s, g.id),
      milestone = currentMilestone(s, g);
    const version = () => {
      if (g.version !== p.version)
        throw new Error("This pursuit changed. Reload before saving.");
    };
    if (c.kind === "vision") {
      version();
      g.vision = required(p.vision, "Your vision");
      g.version++;
      g.revision++;
      s.goalHistory.push({
        ...structuredClone(g),
        goal_id: g.id,
        revision: g.revision,
        recorded_at: now,
      });
      receipt = { id: g.id, version: g.version };
    } else if (c.kind === "stop_repeat") {
      const step = s.commitments.find(
        (c) =>
          c.goal_id === g.id && c.id === p.commitmentId && c.state === "active",
      );
      if (!step || step.version !== p.version)
        throw new Error("This step changed. Reload before saving.");
      step.recurrence = null;
      step.version++;
      receipt = { id: step.id, version: step.version };
      event(g.id, "stop_repeat", {
        commitmentId: step.id,
        detail:
          "Future repetitions stopped; current session remains to check in.",
      });
    } else if (c.kind === "planned_step") {
      if (
        !["draft", "active", "paused"].includes(g.status) ||
        !g.milestones.some((m) => m.id === p.milestoneId) ||
        s.events.some(
          (e) =>
            e.goal_id === g.id &&
            e.kind === "milestone" &&
            e.data.milestoneId === p.milestoneId,
        )
      )
        throw new Error("Choose an unfinished milestone.");
      if (s.events.some((e) => e.data.stepId === p.id))
        throw new Error("Step already planned.");
      event(g.id, "planned_step", {
        stepId: String(p.id),
        milestoneId: String(p.milestoneId),
        action: String(p.action),
        criterion: String(p.criterion),
      });
    } else if (c.kind === "first_move") {
      if (g.status !== "draft" || s.commitments.some((c) => c.goal_id === g.id))
        throw new Error(
          "First move already imported or preparation has started",
        );
      s.commitments.push({
        id,
        owner_id: owner,
        goal_id: g.id,
        milestone_id: null,
        plan_revision: null,
        revision: 1,
        version: 1,
        state: p.result === "" ? "active" : "reported",
        created_at: now,
      });
      s.definitions.push({
        commitment_id: id,
        goal_id: g.id,
        revision: 1,
        action: String(p.action),
        criterion: String(p.criterion),
        mode: "quick",
      });
      if (p.result !== "") {
        s.evidence.push({
          id,
          goal_id: g.id,
          commitment_id: id,
          commitment_revision: 1,
          schedule_id: null,
          revision: 1,
          recorded_at: now,
          version: 1,
        });
        s.reports.push({
          evidence_id: id,
          goal_id: g.id,
          revision: 1,
          result: p.result as Result,
          detail: String(p.detail),
          reflection: null,
          occurred_on: null,
          recorded_at: now,
          prevented: String(p.prevented || ""),
          adjustment: String(p.adjustment || ""),
        });
      }
    } else if (c.kind === "select") {
      s.selectedGoal = g.id;
      receipt = { id: g.id, version: 1 };
    } else if (c.kind === "plan") {
      version();
      if (g.status !== "draft" || current) {
        if (!["active", "paused"].includes(g.status))
          throw new Error(
            "Finish the current step before changing preparation.",
          );
        const next = foundation();
        if (
          foundationKeys
            .filter((k) => k !== "milestones")
            .some(
              (k) =>
                JSON.stringify(next[k as keyof Foundation]) !==
                JSON.stringify(g[k as keyof Foundation]),
            ) ||
          next.milestones.length <= g.milestones.length ||
          g.milestones.some(
            (m, i) => JSON.stringify(m) !== JSON.stringify(next.milestones[i]),
          )
        )
          throw new Error(
            "Keep existing agreements unchanged. Add new milestones at the end.",
          );
        ready(next);
      }
      Object.assign(g, foundation());
      g.revision++;
      g.version++;
      s.goalHistory.push({
        ...structuredClone(foundation()),
        goal_id: g.id,
        revision: g.revision,
        recorded_at: now,
      });
      receipt = { id: g.id, version: g.version };
    } else if (c.kind === "milestone_schedule") {
      version();
      if (!["active", "paused"].includes(g.status))
        throw new Error(
          "Only active or paused preparation can be rescheduled.",
        );
      const m = g.milestones.find((m) => m.id === p.milestoneId);
      if (
        !m ||
        s.events.some(
          (e) =>
            e.goal_id === g.id &&
            e.kind === "milestone" &&
            e.data.milestoneId === m.id,
        )
      )
        throw new Error("Unfinished milestone unavailable.");
      required(p.reason, "Why this deadline is changing");
      const instant = scheduledInstant(p.localDate, p.localTime, p.timeZone);
      if (
        current?.milestone_id === m.id &&
        (currentSchedule(s, current.id)?.starts_at ?? "") > instant
      )
        throw new Error(
          "Milestone deadline cannot precede its scheduled action.",
        );
      Object.assign(m, {
        localDate: String(p.localDate),
        localTime: String(p.localTime),
        timeZone: String(p.timeZone),
      });
      ready(g);
      g.revision++;
      g.version++;
      s.goalHistory.push({
        ...structuredClone(g),
        goal_id: g.id,
        revision: g.revision,
        recorded_at: now,
      });
      event(g.id, "milestone_schedule", {
        milestoneId: m.id,
        detail: String(p.reason),
      });
      receipt = { id: g.id, version: g.version };
    } else if (c.kind === "commitment") {
      if (!["draft", "active", "paused"].includes(g.status))
        throw new Error(
          "This pursuit has ended. Start a new pursuit for a new direction.",
        );

      ready(g);
      const selectedMilestone = g.milestones.find(
        (m) =>
          m.id === p.milestoneId &&
          !s.events.some(
            (e) =>
              e.goal_id === g.id &&
              e.kind === "milestone" &&
              e.data.milestoneId === m.id,
          ),
      );
      if (!selectedMilestone)
        throw new Error("Choose the current preparation milestone.");
      const instant = scheduledInstant(p.localDate, p.localTime, p.timeZone);

      if (
        ![
          "continue",
          "recommit",
          "change_approach",
          "address_blocker",
        ].includes(String(p.decision))
      )
        throw new Error("Choose your next decision.");
      const last = s.evidence.filter((e) => e.goal_id === g.id).at(-1),
        lastReport = last && currentReport(s, last.id, last.revision);

      if (p.decision !== "continue") required(p.reason, "Revised plan");
      if (
        p.plannedStepId &&
        (!s.events.some(
          (e) =>
            e.goal_id === g.id &&
            e.kind === "planned_step" &&
            e.data.stepId === p.plannedStepId &&
            e.data.milestoneId === p.milestoneId,
        ) ||
          s.events.some(
            (e) =>
              e.goal_id === g.id &&
              e.kind === "decision" &&
              e.data.plannedStepId === p.plannedStepId,
          ))
      )
        throw new Error("Planned step unavailable.");
      if (s.commitments.some((c) => c.id === id))
        throw new Error("Commitment already exists.");
      s.commitments.push({
        id,
        owner_id: owner,
        goal_id: g.id,
        milestone_id: selectedMilestone.id,
        recurrence: checkRecurrence(p.recurrence, String(p.localDate)),
        series_id: p.recurrence ? id : null,
        plan_revision: g.revision,
        revision: 1,
        version: 1,
        state: "active",
        created_at: now,
      });
      s.definitions.push({
        commitment_id: id,
        goal_id: g.id,
        revision: 1,
        action: String(p.action),
        criterion: String(p.criterion),
        mode: "deliberate",
      });
      s.schedules.push({
        id: crypto.randomUUID(),
        commitment_id: id,
        goal_id: g.id,
        commitment_revision: 1,
        local_date: String(p.localDate),
        local_time: String(p.localTime),
        time_zone: String(p.timeZone),
        starts_at: instant,
        location: String(p.location || "") || null,
        state: "current",
        created_at: now,
      });
      if (g.status !== "active")
        event(g.id, "status", {
          from: g.status,
          to: "active",
          detail: "Preparation and next action scheduled.",
        });
      g.status = "active";
      g.version++;
      event(g.id, "decision", {
        plannedStepId: String(p.plannedStepId || ""),
        decision: String(p.decision),
        detail: String(p.reason || ""),
        commitmentId: id,
      });
    } else if (c.kind === "reschedule") {
      if (!current || current.id !== p.commitmentId)
        throw new Error("Commitment unavailable.");
      if (current.version !== p.version)
        throw new Error("This commitment changed. Reload its current version.");
      if (!["active", "paused"].includes(g.status))
        throw new Error("Only an active or paused pursuit can be rescheduled.");
      if (isOverdue(s, current.id))
        throw new Error(
          "Your commitment needs an update. Report what happened before committing again.",
        );
      const m = g.milestones.find((m) => m.id === current.milestone_id);
      if (!m) throw new Error("Preparation milestone unavailable.");
      const instant = scheduledInstant(p.localDate, p.localTime, p.timeZone);

      const old = currentSchedule(s, current.id);
      if (old) old.state = "superseded";
      current.revision++;
      current.version++;
      s.definitions.push({
        commitment_id: current.id,
        goal_id: g.id,
        revision: current.revision,
        action: String(p.action),
        criterion: String(p.criterion),
        mode: "deliberate",
      });
      s.schedules.push({
        id: crypto.randomUUID(),
        commitment_id: current.id,
        goal_id: g.id,
        commitment_revision: current.revision,
        local_date: String(p.localDate),
        local_time: String(p.localTime),
        time_zone: String(p.timeZone),
        starts_at: instant,
        location: String(p.location || "") || null,
        state: "current",
        created_at: now,
      });
      event(g.id, "reschedule", {
        commitmentId: current.id,
        detail: String(p.reason),
      });
      receipt = { id: current.id, version: current.version };
    } else if (c.kind === "outcome") {
      const commit = s.commitments.find(
        (v) => v.id === p.commitmentId && v.goal_id === g.id,
      );
      if (!commit) throw new Error("Commitment unavailable.");
      if (commit.state === "cancelled") throw new Error("This step has ended.");
      if (s.evidence.some((e) => e.commitment_id === commit.id))
        throw new Error(
          "This commitment already has a result. Open its Proof entry.",
        );
      if (commit.version !== p.version)
        throw new Error("This commitment changed. Reload its current version.");
      const schedule = currentSchedule(s, commit.id);
      if (commit.milestone_id && !schedule?.starts_at)
        throw new Error("Choose a session time before checking in.");
      s.evidence.push({
        id,
        goal_id: g.id,
        commitment_id: commit.id,
        commitment_revision: commit.revision,
        schedule_id: schedule?.id ?? null,
        revision: 1,
        version: 1,
        recorded_at: now,
      });
      s.reports.push({
        evidence_id: id,
        goal_id: g.id,
        revision: 1,
        result: p.result as Result,
        detail: String(p.detail || "") || null,
        reflection: String(p.reflection || "") || null,
        occurred_on: String(p.occurredOn || "") || null,
        prevented: String(p.prevented || "") || null,
        adjustment: String(p.adjustment || "") || null,
        recorded_at: now,
      });
      commit.state = "reported";
      commit.version++;
      if (commit.recurrence && schedule?.local_date) {
        const day = nextOccurrence(schedule.local_date, commit.recurrence);
        if (day) {
          const nextId = crypto.randomUUID();
          const d = definition(s, commit.id, commit.revision)!;
          s.commitments.push({
            ...commit,
            id: nextId,
            state: "active",
            revision: 1,
            version: 1,
            created_at: now,
          });
          s.definitions.push({ ...d, commitment_id: nextId, revision: 1 });
          let startsAt: string | null = null;
          try {
            startsAt = scheduledInstant(
              day,
              schedule.local_time?.slice(0, 5),
              schedule.time_zone,
            );
          } catch {}
          s.schedules.push({
            ...schedule,
            id: crypto.randomUUID(),
            commitment_id: nextId,
            commitment_revision: 1,
            local_date: day,
            local_time: startsAt ? schedule.local_time : null,
            starts_at: startsAt,
            created_at: now,
          });
        }
      }
    } else if (c.kind === "detail") {
      const e = s.evidence.find(
        (e) => e.id === p.evidenceId && e.goal_id === g.id,
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
    } else if (c.kind === "milestone") {
      version();
      if (g.status !== "active" || !milestone || milestone.id !== p.milestoneId)
        throw new Error(
          "Report current work before completing the current milestone.",
        );
      required(p.detail, "What completed this milestone");
      const remaining = s.commitments.filter(
        (c) =>
          c.goal_id === g.id &&
          c.milestone_id === milestone.id &&
          c.state === "active",
      );
      if (p.result !== "attempted" && remaining.length) {
        if (!["stop", "carry"].includes(String(p.remaining)))
          throw new Error("Choose what happens to remaining steps.");
        const next =
          g.milestones[
            g.milestones.findIndex((m) => m.id === milestone.id) + 1
          ];
        if (p.remaining === "carry" && !next)
          throw new Error(
            "Add the next milestone before carrying steps forward.",
          );
        for (const c of remaining) {
          if (p.remaining === "carry") c.milestone_id = next.id;
          else {
            c.state = "cancelled";
            c.recurrence = null;
          }
          c.version++;
        }
      }
      event(
        g.id,
        p.result === "attempted" ? "milestone_attempt" : "milestone",
        {
          milestoneId: milestone.id,
          detail: String(p.detail),
        },
      );
      g.version++;
      receipt = { id: g.id, version: g.version };
    } else if (c.kind === "status") {
      version();
      const state = p.status as PursuitState;
      if (
        ![
          "active",
          "paused",
          "changed_direction",
          "completed",
          "abandoned",
        ].includes(state) ||
        state === g.status ||
        ["changed_direction", "completed", "abandoned"].includes(g.status)
      )
        throw new Error("Choose a valid next state.");
      required(
        p.detail,
        state === "completed" ? "What actually happened" : "Your decision",
      );
      if (state === "active") {
        ready(g);
        if (
          !current ||
          !current.milestone_id ||
          !currentSchedule(s, current.id)?.starts_at
        )
          throw new Error(
            "Schedule the next action before returning to active.",
          );
      }
      if (state === "completed") {
        ready(g);
        if (current)
          throw new Error(
            "Report outstanding work before completing the major accomplishment.",
          );
        required(p.reflection, "Your reflection");
        required(p.next, "What comes next");
      }
      event(g.id, "status", {
        from: g.status,
        to: state,
        detail: String(p.detail),
        reflection: String(p.reflection || ""),
        next: String(p.next || ""),
      });
      g.status = state;
      g.version++;
      receipt = { id: g.id, version: g.version };
    }
  }
  next.receipts[c.operationId] = { signature, receipt };
  return { store: next, receipt };
}
