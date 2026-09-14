import { describe, it, expect, beforeEach } from "vitest";
import {
  applyLocal,
  emptySnapshot,
  actionStatus,
  required,
  type LocalStore,
} from "../src/data/domain";
import type { Command } from "../src/data/types";
import { canUseDraft, loadDraft, saveDraft } from "../src/data/drafts";
const actor = "account-a";
function command(
  kind: Command["kind"],
  payload: Record<string, unknown>,
): Command {
  return { kind, payload, actorId: actor, operationId: crypto.randomUUID() };
}
function setup() {
  let store: LocalStore = { snapshot: emptySnapshot(), receipts: {} };
  const run = (c: Command) => {
    const r = applyLocal(store, c, actor);
    store = r.store;
    return r.receipt;
  };
  run(
    command("goal", {
      id: "g",
      words: "Write my essay. 私の言葉 ✨",
      kind: "vision",
    }),
  );
  return { run, get: () => store };
}
describe("durable loop state contract", () => {
  it("starts honestly empty", () =>
    expect(emptySnapshot().evidence).toEqual([]));
  it("keeps exact member words", () =>
    expect(setup().get().snapshot.goals[0].words).toBe(
      "Write my essay. 私の言葉 ✨",
    ));
  it("rejects blank and oversized action text without truncation", () => {
    expect(() => required("   ", "Action")).toThrow();
    expect(() => required("x".repeat(10001), "Action")).toThrow(
      /not been shortened/,
    );
  });
  it("replays one operation once and rejects changed payload", () => {
    const t = setup(),
      c = command("commitment", {
        id: "c",
        goalId: "g",
        mode: "quick",
        action: "Write",
        criterion: "Paragraph",
      });
    expect(t.run(c)).toEqual(t.run(c));
    expect(t.get().snapshot.commitments).toHaveLength(1);
    expect(() =>
      t.run({ ...c, payload: { ...c.payload, action: "Changed" } }),
    ).toThrow(/changed/);
  });
  it("does not infer miss from date", () => {
    const t = setup();
    t.run(
      command("commitment", {
        id: "c",
        goalId: "g",
        mode: "deliberate",
        action: "Write",
        criterion: "Paragraph",
        localDate: "2000-01-01",
      }),
    );
    expect(actionStatus(t.get().snapshot, "c")).toBe("unreported");
  });
  it("allows one current commitment per goal", () => {
    const t = setup(),
      p = {
        goalId: "g",
        mode: "quick",
        action: "Write",
        criterion: "Paragraph",
      };
    t.run(command("commitment", { ...p, id: "c" }));
    expect(() => t.run(command("commitment", { ...p, id: "d" }))).toThrow(
      /current commitment/,
    );
  });
  it("keeps a miss when another commitment is made", () => {
    const t = setup();
    t.run(
      command("commitment", {
        id: "c",
        goalId: "g",
        mode: "quick",
        action: "Write",
        criterion: "Paragraph",
      }),
    );
    t.run(
      command("outcome", {
        id: "e",
        goalId: "g",
        commitmentId: "c",
        version: 1,
        result: "did_not_happen",
      }),
    );
    t.run(
      command("commitment", {
        id: "d",
        goalId: "g",
        mode: "quick",
        action: "Try after lunch",
        criterion: "Paragraph saved",
      }),
    );
    expect(actionStatus(t.get().snapshot, "c")).toBe("did_not_happen");
    expect(t.get().snapshot.commitments).toHaveLength(2);
  });
  it("keeps one evidence identity while optional detail gains revisions", () => {
    const t = setup();
    t.run(
      command("commitment", {
        id: "c",
        goalId: "g",
        mode: "quick",
        action: "Write",
        criterion: "Paragraph",
      }),
    );
    const c = command("outcome", {
      id: "e",
      goalId: "g",
      commitmentId: "c",
      version: 1,
      result: "done",
    });
    t.run(c);
    t.run(c);
    t.run(
      command("detail", {
        goalId: "g",
        evidenceId: "e",
        version: 1,
        detail: "Written.",
        reflection: "Lunch worked.",
      }),
    );
    expect(t.get().snapshot.evidence).toHaveLength(1);
    expect(t.get().snapshot.reports).toHaveLength(2);
    expect(t.get().snapshot.evidence[0].revision).toBe(2);
  });
  it("blocks mixed-goal evidence and changed account submissions", () => {
    const t = setup();
    t.run(
      command("commitment", {
        id: "c",
        goalId: "g",
        mode: "quick",
        action: "Write",
        criterion: "Paragraph",
      }),
    );
    expect(() =>
      t.run(
        command("outcome", {
          id: "e",
          goalId: "other",
          commitmentId: "c",
          version: 1,
          result: "done",
        }),
      ),
    ).toThrow(/unavailable/);
    expect(() =>
      t.run({ ...command("goal", { words: "x", kind: "goal" }), actorId: "b" }),
    ).toThrow(/account changed/);
  });
  it("goal switching only changes selection", () => {
    const t = setup();
    t.run(command("goal", { id: "g2", kind: "goal", words: "Another goal" }));
    t.run(command("select", { goalId: "g" }));
    expect(t.get().snapshot.selectedGoal).toBe("g");
    expect(t.get().snapshot.evidence).toHaveLength(0);
  });
});
describe("pre-auth draft ownership", () => {
  beforeEach(() => localStorage.clear());
  it("preserves draft across a fresh read", () => {
    const d = loadDraft();
    d.words = "My exact words.\n✨";
    saveDraft(d);
    expect(loadDraft()).toEqual(d);
  });
  it("requires the original account for a bound draft", () => {
    const d = { ...loadDraft(), boundOwner: "a" };
    expect(canUseDraft(d, "b")).toBe(false);
    expect(canUseDraft(d, "a")).toBe(true);
  });
});
