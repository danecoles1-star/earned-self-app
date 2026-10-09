import { expect, it } from "vitest";
import { applyLocal, emptySnapshot } from "../src/data/domain";
import { completedProgress } from "../src/experience/progress";
import { foundation, action } from "./fixtures";

function fixture() {
  const owner = "review-member";
  let store = { snapshot: emptySnapshot(), receipts: {} };
  const send = (
    kind: Parameters<typeof applyLocal>[1]["kind"],
    payload: Record<string, unknown>,
  ) => {
    store = applyLocal(
      store,
      { kind, payload, actorId: owner, operationId: crypto.randomUUID() },
      owner,
    ).store;
  };
  send("goal", { ...foundation, id: "g", area: "professional" });
  for (const [id, result] of [
    ["done", "done"],
    ["partial", "partly"],
    ["missed", "did_not_happen"],
  ] as const) {
    send("commitment", { ...action, id });
    send("outcome", {
      goalId: "g",
      commitmentId: id,
      version: 1,
      result,
      detail: "Recorded work",
      prevented: "Time",
      adjustment: "Protect time",
      occurredOn: new Date().toISOString().slice(0, 10),
    });
  }
  return store.snapshot;
}
it("counts completed steps but preserves partial and missed evidence", () => {
  const s = fixture();
  expect(completedProgress(s)).toEqual({
    steps: 1,
    milestones: 0,
    challenges: 0,
  });
  expect(s.evidence).toHaveLength(3);
});
it("uses the current report revision rather than a superseded completion", () => {
  const s = fixture();
  const e = s.evidence.find((e) => e.commitment_id === "done")!;
  const r = s.reports.find((r) => r.evidence_id === e.id)!;
  e.revision = 2;
  s.reports.push({ ...r, revision: 2, result: "partly" });
  expect(completedProgress(s).steps).toBe(0);
});
it("scopes totals to the selected challenge or area", () => {
  expect(completedProgress(fixture(), ["another-challenge"])).toEqual({
    steps: 0,
    milestones: 0,
    challenges: 0,
  });
});
it("counts milestone completion once and never counts attempts as completion", () => {
  const s = fixture();
  const base = {
    goal_id: "g",
    recorded_at: "2030-10-01",
    data: { milestoneId: "m" },
  };
  s.events.push({ ...base, id: "a", kind: "milestone_attempt" });
  expect(completedProgress(s).milestones).toBe(0);
  s.events.push(
    { ...base, id: "b", kind: "milestone" },
    { ...base, id: "c", kind: "milestone" },
  );
  expect(completedProgress(s).milestones).toBe(1);
});
it("counts only explicitly completed challenges", () => {
  const s = fixture();
  s.goals[0].status = "paused";
  expect(completedProgress(s).challenges).toBe(0);
  s.goals[0].status = "completed";
  expect(completedProgress(s).challenges).toBe(1);
});
