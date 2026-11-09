import { describe, it, expect } from "vitest";
import { applyLocal, type LocalStore } from "../src/data/domain";
import {
  emptySnapshot,
  emptyFoundation,
  type Command,
} from "../src/data/types";
import { calendarContent } from "../src/experience/exports";
const cmd = (
  kind: Command["kind"],
  payload: Record<string, unknown>,
  actorId = "a",
): Command => ({ kind, payload, actorId, operationId: crypto.randomUUID() });
function setup() {
  let store: LocalStore = { snapshot: emptySnapshot(), receipts: {} };
  store = applyLocal(
    store,
    cmd("goal", {
      id: "g",
      ...emptyFoundation(),
      vision: "Speak with courage",
      words: "Present my research",
    }),
    "a",
  ).store;
  return store;
}
const first = () =>
  cmd("first_move", {
    id: "first",
    goalId: "g",
    action: "Rehearse the opening",
    criterion: "Speak it aloud once",
    result: "done",
    detail: "Rehearsed aloud and recorded my opening.",
    prevented: "",
    adjustment: "",
  });
describe("first action import", () => {
  it("records an honest report without activating or inventing a schedule", () => {
    const c = first();
    const out = applyLocal(setup(), c, "a");
    expect(out.store.snapshot.goals[0].status).toBe("draft");
    expect(out.store.snapshot.schedules).toHaveLength(0);
    expect(out.store.snapshot.commitments[0].state).toBe("reported");
    expect(out.store.snapshot.definitions[0].mode).toBe("quick");
    expect(applyLocal(out.store, c, "a").store.snapshot.evidence).toHaveLength(
      1,
    );
  });
  it("rejects another owner, missing account and duplicate first move", () => {
    const s = setup();
    expect(() => applyLocal(s, { ...first(), actorId: "b" }, "a")).toThrow();
    expect(() =>
      applyLocal(
        s,
        { ...first(), payload: { ...first().payload, goalId: "other" } },
        "a",
      ),
    ).toThrow();
    const done = applyLocal(s, first(), "a").store;
    expect(() => applyLocal(done, first(), "a")).toThrow();
  });
  it("requires a factual report and explanations for a partial result", () => {
    for (const patch of [
      { detail: " " },
      { action: "" },
      { criterion: "" },
      { result: "partly", prevented: "", adjustment: "" },
    ]) {
      const c = first();
      c.payload = { ...c.payload, ...patch };
      expect(() => applyLocal(setup(), c, "a")).toThrow();
    }
  });
});
it("escapes calendar content and preserves a stable event identity", () => {
  const s: any = {
    starts_at: "2026-10-01T12:00:00Z",
    commitment_id: "123",
    commitment_revision: 2,
    location: "Home\nBEGIN:BAD",
  };
  const d: any = {
    action: "Talk; practice, again",
    criterion: "One honest attempt",
  };
  const content = calendarContent(d, s, 30, "https://example.test");
  expect(content).toContain("UID:123@earned-self");
  expect(content).toContain("SEQUENCE:2");
  expect(content).toContain("SUMMARY:Talk\\; practice\\, again");
  expect(content).toContain("LOCATION:Home\\nBEGIN:BAD");
  expect(content).toContain("DTEND:20261001T123000Z");
});
