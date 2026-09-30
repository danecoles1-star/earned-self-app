import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { StepTimer, elapsedTime } from "../src/experience/StepTimer";
import {
  applyLocal,
  emptySnapshot,
  currentMilestone,
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
  fireEvent.click(screen.getByRole("button", { name: "Start step" }));
  act(() => vi.advanceTimersByTime(65000));
  expect(screen.getByLabelText("Elapsed time")).toHaveTextContent("00:01:05");
  view.unmount();
  vi.setSystemTime(180000);
  render(<StepTimer identity="a:step:1" />);
  expect(screen.getByLabelText("Elapsed time")).toHaveTextContent("00:01:20");
  fireEvent.click(screen.getByRole("button", { name: "Pause timer" }));
  act(() => vi.advanceTimersByTime(10000));
  expect(screen.getByLabelText("Elapsed time")).toHaveTextContent("00:01:20");
  expect(elapsedTime({ elapsed: 0, started: 200000 }, 180000)).toBe(0);
});
it("timer is isolated by account and step", () => {
  localStorage.setItem(
    "earned-self:timer:a:step:1",
    JSON.stringify({ elapsed: 60000, started: null }),
  );
  render(<StepTimer identity="b:step:1" />);
  expect(screen.getByLabelText("Elapsed time")).toHaveTextContent("00:00:00");
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
