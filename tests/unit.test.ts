import { describe, it, expect, beforeEach } from "vitest";
import {
  applyLocal,
  emptySnapshot,
  actionStatus,
  isOverdue,
  required,
  type LocalStore,
} from "../src/data/domain";
import { scheduledInstant } from "../src/data/time";
import { emptyFoundation, type Command } from "../src/data/types";
import { loadDraft, saveDraft, canUseDraft } from "../src/data/drafts";
import { foundation, action, mid } from "./fixtures";
const command = (
  kind: Command["kind"],
  payload: Record<string, unknown>,
): Command => ({
  kind,
  payload,
  actorId: "a",
  operationId: crypto.randomUUID(),
});
function setup() {
  let store: LocalStore = { snapshot: emptySnapshot(), receipts: {} };
  const run = (c: Command) => {
    const r = applyLocal(store, c, "a");
    store = r.store;
    return r.receipt;
  };
  run(command("goal", { id: "g", ...foundation }));
  return { run, get: () => store.snapshot };
}
describe("structured pursuit contract", () => {
  it("allows incomplete drafts, never auto-activates", () => {
    const t = setup();
    t.run(command("goal", { id: "draft", ...emptyFoundation() }));
    expect(t.get().goals[1].status).toBe("draft");
    expect(() =>
      t.run(command("commitment", { ...action, goalId: "draft" })),
    ).toThrow();
  });
  it("requires meaningful planning, affirmation and complete scheduling", () => {
    for (const field of [
      "vision",
      "words",
      "outcome",
      "meaning",
      "constraints",
      "capabilities",
      "unknowns",
      "affirmed",
    ]) {
      const t = setup();
      t.run(
        command("plan", {
          goalId: "g",
          version: 1,
          ...foundation,
          [field]: field === "affirmed" ? false : "",
        }),
      );
      expect(() => t.run(command("commitment", action))).toThrow();
    }
    for (const field of ["localDate", "localTime", "timeZone"]) {
      const t = setup();
      expect(() =>
        t.run(command("commitment", { ...action, [field]: "" })),
      ).toThrow();
    }
  });
  it("retains original words and draft revisions", () => {
    const t = setup();
    t.run(
      command("plan", {
        goalId: "g",
        version: 1,
        ...foundation,
        vision: "My words 自分 ✨",
      }),
    );
    expect(t.get().goalHistory[0].vision).toBe(foundation.vision);
    expect(t.get().goals[0].vision).toBe("My words 自分 ✨");
  });
  it("replays idempotently and rejects changed payload, duplicates and spoofed owner", () => {
    const t = setup(),
      c = command("commitment", action);
    expect(t.run(c)).toEqual(t.run(c));
    expect(() =>
      t.run({ ...c, payload: { ...action, action: "Other" } }),
    ).toThrow(/changed/);
    expect(() => t.run(command("commitment", { ...action, id: "x" }))).toThrow(
      /current commitment/,
    );
    expect(() => t.run({ ...c, actorId: "b" })).toThrow(/account changed/);
  });
  it("requires milestone ownership and deadline ordering", () => {
    const t = setup();
    expect(() =>
      t.run(command("commitment", { ...action, milestoneId: "foreign" })),
    ).toThrow(/milestone/);
    expect(() =>
      t.run(command("commitment", { ...action, localDate: "2031-01-01" })),
    ).toThrow(/deadline/);
  });
  it("past due is unreported and cannot be hidden by rescheduling", () => {
    const t = setup();
    t.run(command("commitment", { ...action, localDate: "2000-01-01" }));
    expect(actionStatus(t.get(), "c")).toBe("unreported");
    expect(isOverdue(t.get(), "c")).toBe(true);
    expect(() =>
      t.run(
        command("reschedule", {
          goalId: "g",
          commitmentId: "c",
          version: 1,
          action: "Try",
          criterion: "Done",
          localDate: "2030-10-02",
          localTime: "12:00",
          timeZone: "America/Denver",
          reason: "New",
        }),
      ),
    ).toThrow(/needs an update/);
  });
  it("keeps misses and requires a revised decision on return", () => {
    const t = setup();
    t.run(command("commitment", action));
    const p = {
      id: "e",
      goalId: "g",
      commitmentId: "c",
      version: 1,
      result: "partly",
    };
    expect(() => t.run(command("outcome", p))).toThrow(/prevented/);
    t.run(
      command("outcome", {
        ...p,
        prevented: "Overloaded day",
        adjustment: "Protect lunch",
      }),
    );
    expect(() =>
      t.run(command("commitment", { ...action, id: "next" })),
    ).toThrow(/earlier result/);
    t.run(
      command("commitment", {
        ...action,
        id: "next",
        decision: "address_blocker",
        reason: "Protect lunch",
      }),
    );
    expect(actionStatus(t.get(), "c")).toBe("partly");
    expect(t.get().goals[0].status).toBe("active");
  });
  it("keeps schedules, reasons and immutable definitions across repeated changes", () => {
    const t = setup();
    t.run(command("commitment", action));
    for (let i = 1; i <= 3; i++)
      t.run(
        command("reschedule", {
          goalId: "g",
          commitmentId: "c",
          version: i,
          action: "Revised " + i,
          criterion: "Costs",
          localDate: `2030-10-0${i + 1}`,
          localTime: "12:00",
          timeZone: "America/Denver",
          reason: "Change " + i,
        }),
      );
    expect(t.get().schedules).toHaveLength(4);
    expect(t.get().definitions[0].action).toBe(action.action);
    expect(t.get().events.filter((e) => e.kind === "reschedule")).toHaveLength(
      3,
    );
  });
  it("preserves milestone deadline history independently of actions", () => {
    const t = setup();
    t.run(command("commitment", action));
    t.run(
      command("milestone_schedule", {
        goalId: "g",
        version: 2,
        milestoneId: mid,
        localDate: "2030-12-02",
        localTime: "17:00",
        timeZone: "America/Denver",
        reason: "Need another test",
      }),
    );
    expect(t.get().goalHistory[0].milestones[0].localDate).toBe("2030-12-01");
    expect(t.get().goals[0].milestones[0].localDate).toBe("2030-12-02");
  });
  it("distinguishes preparation, milestone and major accomplishment", () => {
    const t = setup();
    t.run(command("commitment", action));
    t.run(
      command("outcome", {
        id: "e",
        goalId: "g",
        commitmentId: "c",
        version: 1,
        result: "done",
      }),
    );
    t.run(
      command("milestone", {
        goalId: "g",
        version: 2,
        milestoneId: mid,
        detail: "Six costs",
      }),
    );
    expect(t.get().goals[0].status).toBe("active");
    expect(() =>
      t.run(command("commitment", { ...action, id: "next" })),
    ).toThrow(/milestone/);
    t.run(
      command("status", {
        goalId: "g",
        version: 3,
        status: "completed",
        detail: "Three orders delivered",
        reflection: "Demand is real",
        next: "Test capacity",
      }),
    );
    expect(t.get().goals[0].status).toBe("completed");
  });
  it("keeps pause, changed direction and abandonment distinct", () => {
    for (const status of ["paused", "changed_direction", "abandoned"]) {
      const t = setup();
      t.run(
        command("status", {
          goalId: "g",
          version: 1,
          status,
          detail: "My decision",
        }),
      );
      expect(t.get().goals[0].status).toBe(status);
      expect(t.get().evidence).toHaveLength(0);
    }
  });
  it("retains reflection revisions and rejects stale updates", () => {
    const t = setup();
    t.run(command("commitment", action));
    t.run(
      command("outcome", {
        id: "e",
        goalId: "g",
        commitmentId: "c",
        version: 1,
        result: "done",
      }),
    );
    const c = command("detail", {
      goalId: "g",
      evidenceId: "e",
      version: 1,
      reflection: "My conclusion",
    });
    t.run(c);
    expect(t.get().reports).toHaveLength(2);
    expect(() => t.run({ ...c, operationId: crypto.randomUUID() })).toThrow(
      /changed/,
    );
  });
  it("rejects unknown fields and oversized words without truncating", () => {
    expect(() => required("x".repeat(10001), "Words")).toThrow(/shortened/);
    const t = setup();
    expect(() =>
      t.run(command("goal", { id: "other", ...foundation, owner_id: "b" })),
    ).toThrow(/Unsupported/);
  });
});
describe("time zones", () => {
  it("uses the declared zone", () =>
    expect(scheduledInstant("2030-01-01", "12:00", "America/Denver")).toBe(
      "2030-01-01T19:00:00.000Z",
    ));
  it.each([
    ["2026-03-08", "02:30"],
    ["2026-11-01", "01:30"],
  ])("rejects DST gap/fold %s %s", (d, t) =>
    expect(() => scheduledInstant(d, t, "America/Denver")).toThrow(
      /clock changes/,
    ),
  );
});
describe("preauth drafts", () => {
  beforeEach(() => localStorage.clear());
  it("retains writing and ownership", () => {
    const d = { ...loadDraft(), vision: "My vision ✨", boundOwner: "a" };
    saveDraft(d);
    expect(loadDraft()).toEqual(d);
    expect(canUseDraft(d, "b")).toBe(false);
  });
});
