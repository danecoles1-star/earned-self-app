import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { StepTimer, elapsedTime } from "../src/experience/StepTimer";
import {
  applyLocal,
  emptySnapshot,
  currentMilestone,
  currentAction,
  currentSchedule,
  type LocalStore,
} from "../src/data/domain";
import type { Command } from "../src/data/types";
import { foundation, action, mid } from "./fixtures";
beforeEach(() => localStorage.clear());
afterEach(() => vi.useRealTimers());
it("timer counts wall time across reload and pauses without losing elapsed time", () => {
  vi.useFakeTimers();
  vi.setSystemTime(100000);
  const view = render(<StepTimer identity="a:step:1" />);
  fireEvent.click(screen.getByRole("button", { name: "Start timer" }));
  act(() => vi.advanceTimersByTime(65000));
  expect(screen.getByLabelText("Elapsed time")).toHaveTextContent("01:05");
  view.unmount();
  vi.setSystemTime(180000);
  render(<StepTimer identity="a:step:1" />);
  expect(screen.getByLabelText("Elapsed time")).toHaveTextContent("01:20");
  fireEvent.click(screen.getByRole("button", { name: "Pause timer" }));
  act(() => vi.advanceTimersByTime(10000));
  expect(screen.getByLabelText("Elapsed time")).toHaveTextContent("01:20");
  expect(elapsedTime({ elapsed: 0, started: 200000 }, 180000)).toBe(0);
});
it("timer is isolated by account and step", () => {
  localStorage.setItem(
    "earned-self:timer:a:step:1",
    JSON.stringify({ elapsed: 60000, started: null }),
  );
  render(<StepTimer identity="b:step:1" />);
  expect(screen.getByLabelText("Elapsed time")).toHaveTextContent("00:00");
});
it("pending onboarding action saves no Proof and can be reported later", () => {
  let store: LocalStore = { snapshot: emptySnapshot(), receipts: {} };
  const send = (kind: Command["kind"], payload: Command["payload"]) =>
    (store = applyLocal(
      store,
      { kind, payload, actorId: "a", operationId: crypto.randomUUID() },
      "a",
    ).store);
  send("goal", { id: "g", ...foundation });
  send("first_move", {
    id: "first",
    goalId: "g",
    action: "Write a sentence",
    criterion: "One sentence",
    result: "",
    detail: "",
  });
  expect(store.snapshot.evidence).toHaveLength(0);
  expect(store.snapshot.commitments[0].state).toBe("active");
  send("outcome", {
    id: "proof",
    goalId: "g",
    commitmentId: "first",
    version: 1,
    result: "done",
    detail: "Wrote it",
  });
  expect(store.snapshot.evidence).toHaveLength(1);
});
it("planned steps cannot be consumed twice; milestone attempts do not advance", () => {
  let store: LocalStore = { snapshot: emptySnapshot(), receipts: {} };
  const send = (kind: Command["kind"], payload: Command["payload"]) =>
    (store = applyLocal(
      store,
      { kind, payload, actorId: "a", operationId: crypto.randomUUID() },
      "a",
    ).store);
  send("goal", { id: "g", ...foundation });
  send("planned_step", {
    id: "queued",
    goalId: "g",
    milestoneId: mid,
    action: "Cost",
    criterion: "Costs saved",
  });
  send("commitment", { ...action, plannedStepId: "queued" });
  send("outcome", {
    id: "proof",
    goalId: "g",
    commitmentId: "c",
    version: 1,
    result: "done",
    detail: "Done",
  });
  expect(() =>
    send("commitment", { ...action, id: "another", plannedStepId: "queued" }),
  ).toThrow(/Planned step/);
  send("milestone", {
    goalId: "g",
    version: store.snapshot.goals[0].version,
    milestoneId: mid,
    result: "attempted",
    detail: "Need more practice",
  });
  expect(currentMilestone(store.snapshot, store.snapshot.goals[0])?.id).toBe(
    mid,
  );
  expect(
    store.snapshot.events.some((e) => e.kind === "milestone_attempt"),
  ).toBe(true);
});

it("scheduled queue retains active timer, creates exactly one next repetition, and stops explicitly", () => {
  let store: LocalStore = { snapshot: emptySnapshot(), receipts: {} };
  const send = (
    kind: Command["kind"],
    payload: Command["payload"],
    operationId = crypto.randomUUID(),
  ) => {
    const c = { kind, payload, actorId: "a", operationId };
    store = applyLocal(store, c, "a").store;
    return c;
  };
  send("goal", { id: "g", ...foundation });
  send("commitment", { ...action, id: "later", localDate: "2030-11-04" });
  send("commitment", {
    ...action,
    id: "repeat",
    localDate: "2030-11-02",
    localTime: "06:00",
    recurrence: { days: [0, 1, 2, 3, 4, 5, 6], until: "2030-11-04" },
  });
  expect(currentAction(store.snapshot, "g")?.id).toBe("repeat");
  localStorage.setItem(
    "earned-self:timer:a:later:1",
    JSON.stringify({ elapsed: 60000, started: null }),
  );
  expect(currentAction(store.snapshot, "g")?.id).toBe("later");
  localStorage.clear();
  const outcome = send("outcome", {
    id: "proof",
    goalId: "g",
    commitmentId: "repeat",
    version: 1,
    result: "done",
    detail: "Stretched",
    reflection: "Keep preparing",
  });
  store = applyLocal(store, outcome, "a").store;
  const next = store.snapshot.commitments.find(
    (c) => c.series_id === "repeat" && c.state === "active",
  )!;
  expect(store.snapshot.evidence).toHaveLength(1);
  expect(
    store.snapshot.commitments.filter(
      (c) => c.series_id === "repeat" && c.state === "active",
    ),
  ).toHaveLength(1);
  expect(currentSchedule(store.snapshot, next.id)?.starts_at).toBe(
    "2030-11-03T13:00:00.000Z",
  );
  expect(currentMilestone(store.snapshot, store.snapshot.goals[0])?.id).toBe(
    mid,
  );
  send("stop_repeat", {
    goalId: "g",
    commitmentId: next.id,
    version: next.version,
  });
  send("outcome", {
    id: "proof2",
    goalId: "g",
    commitmentId: next.id,
    version: 2,
    result: "done",
    detail: "Stretched",
  });
  expect(
    store.snapshot.commitments.filter(
      (c) => c.series_id === "repeat" && c.state === "active",
    ),
  ).toHaveLength(0);
});
it("readiness can advance early with explicit carry while preserving genuine Proof", () => {
  let store: LocalStore = { snapshot: emptySnapshot(), receipts: {} };
  const send = (kind: Command["kind"], payload: Command["payload"]) =>
    (store = applyLocal(
      store,
      { kind, payload, actorId: "a", operationId: crypto.randomUUID() },
      "a",
    ).store);
  send("goal", { id: "g", ...foundation });
  send("commitment", action);
  expect(() =>
    send("milestone", {
      goalId: "g",
      version: store.snapshot.goals[0].version,
      milestoneId: mid,
      detail: "Ready",
      result: "done",
    }),
  ).toThrow(/remaining/);
  send("milestone", {
    goalId: "g",
    version: store.snapshot.goals[0].version,
    milestoneId: mid,
    detail: "Ready",
    result: "done",
    remaining: "carry",
  });
  expect(store.snapshot.commitments[0].milestone_id).toBe(
    foundation.milestones[1].id,
  );
  expect(store.snapshot.evidence).toHaveLength(0);
});

it.each([
  ["2026-03-07", "02:30"],
  ["2026-10-31", "01:30"],
])(
  "saves Proof before a clock-change occurrence needs a new time: %s",
  (day, time) => {
    let store: LocalStore = { snapshot: emptySnapshot(), receipts: {} };
    const send = (kind: Command["kind"], payload: Command["payload"]) =>
      (store = applyLocal(
        store,
        { kind, payload, actorId: "a", operationId: crypto.randomUUID() },
        "a",
      ).store);
    send("goal", { id: "g", ...foundation });
    send("commitment", {
      ...action,
      localDate: day,
      localTime: time,
      recurrence: { days: [0, 1, 2, 3, 4, 5, 6], until: "" },
    });
    send("outcome", {
      id: "proof",
      goalId: "g",
      commitmentId: "c",
      version: 1,
      result: "done",
      detail: "Done",
    });
    expect(store.snapshot.evidence).toHaveLength(1);
    const next = currentAction(store.snapshot, "g")!;
    expect(currentSchedule(store.snapshot, next.id)?.starts_at).toBeNull();
    expect(() =>
      send("outcome", {
        id: "invalid",
        goalId: "g",
        commitmentId: next.id,
        version: 1,
        result: "done",
        detail: "Done",
      }),
    ).toThrow();
  },
);
it("Vision edits preserve challenge and history and reject stale or foreign saves", () => {
  let store: LocalStore = { snapshot: emptySnapshot(), receipts: {} };
  const send = (kind: Command["kind"], payload: Command["payload"]) =>
    (store = applyLocal(
      store,
      { kind, payload, actorId: "a", operationId: crypto.randomUUID() },
      "a",
    ).store);
  send("goal", { id: "g", ...foundation });
  send("vision", {
    goalId: "g",
    version: 1,
    vision: "Healthy enough to climb mountains into my 70s",
  });
  expect(store.snapshot.goals[0].words).toBe(foundation.words);
  expect(store.snapshot.goalHistory[0].vision).toBe(foundation.vision);
  expect(store.snapshot.goals[0].vision).toContain("70s");
  expect(() =>
    send("vision", { goalId: "g", version: 1, vision: "Stale" }),
  ).toThrow(/changed/);
  expect(() =>
    applyLocal(
      store,
      {
        kind: "vision",
        payload: { goalId: "g", version: 2, vision: "Foreign" },
        actorId: "b",
        operationId: crypto.randomUUID(),
      },
      "b",
    ),
  ).toThrow();
});

it("timer keeps hours explicit for long sessions", () => {
  localStorage.setItem(
    "earned-self:timer:a:long:1",
    JSON.stringify({ elapsed: 3661000, started: null }),
  );
  render(<StepTimer identity="a:long:1" />);
  expect(screen.getByLabelText("Elapsed time")).toHaveTextContent("01:01:01");
  expect(screen.getByLabelText("Elapsed time")).toHaveClass("timer-hours");
});
