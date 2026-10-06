import { beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { applyLocal, emptySnapshot, type LocalStore } from "../src/data/domain";
import { resultLabel, type Command } from "../src/data/types";
import { foundation, action } from "./fixtures";
import { ProofList, Ambition } from "../src/experience/Ambition";
import {
  ChallengeRecord,
  completionRecord,
} from "../src/experience/ChallengeRecord";
import { MemberHome } from "../src/experience/MemberHome";

beforeEach(() => {
  cleanup();
  localStorage.clear();
  history.replaceState({}, "", "/manage");
});
function setup() {
  let store: LocalStore = { snapshot: emptySnapshot(), receipts: {} };
  const send = (kind: Command["kind"], payload: Command["payload"]) => {
    store = applyLocal(
      store,
      { kind, payload, actorId: "a", operationId: crypto.randomUUID() },
      "a",
    ).store;
  };
  send("goal", { ...foundation, id: "g" });
  return { send, get: () => store.snapshot };
}
it("completed transformations remain accessible from all evidence when another challenge is active", () => {
  const t = setup();
  t.send("status", {
    goalId: "g",
    version: 1,
    status: "completed",
    detail: "Three orders delivered",
    reflection: "I trust my craft",
    next: "Keep testing ideas",
  });
  t.send("goal", {
    ...foundation,
    id: "new",
    words: "Exhibit my next collection",
  });
  const s = t.get();
  s.goals.find((g) => g.id === "new")!.status = "active";
  const navigate = vi.fn();
  render(<ProofList snapshot={s} navigate={navigate} />);
  fireEvent.click(screen.getByRole("button", { name: "View all evidence" }));
  const completed = screen.getByRole("region", {
    name: "Completed challenges",
  });
  const support = screen.getByRole("region", { name: "Supporting history" });
  expect(
    completed.compareDocumentPosition(support) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(within(completed).getByText("Three orders delivered")).toBeVisible();
  expect(within(completed).getByText("I trust my craft")).toBeVisible();
  fireEvent.change(screen.getByLabelText("Show supporting history"), {
    target: { value: "active" },
  });
  expect(within(completed).getByText("I trust my craft")).toBeVisible();
  expect(within(support).getByText("Exhibit my next collection")).toBeVisible();
  fireEvent.click(
    within(completed).getByRole("button", { name: /Revisit what changed/ }),
  );
  expect(navigate).toHaveBeenCalledWith("/proof/challenge/g");
});
it("ongoing Proof keeps missed attempts honest and does not claim challenge completion", () => {
  const t = setup();
  t.send("commitment", action);
  t.send("outcome", {
    id: "c",
    goalId: "g",
    commitmentId: "c",
    version: 1,
    result: "did_not_happen",
    detail: "Work ran late",
    prevented: "A shift",
    adjustment: "Protect morning time",
  });
  t.send("milestone", {
    goalId: "g",
    version: t.get().goals[0].version,
    milestoneId: foundation.milestones[0].id,
    result: "attempted",
    detail: "Two pieces remain",
  });
  render(<ProofList snapshot={t.get()} navigate={() => {}} />);
  expect(screen.getByText("Step missed")).toBeVisible();
  expect(screen.getByText("Milestone attempt")).toBeVisible();
  expect(screen.queryByText("Challenge completed")).toBeNull();
  expect(screen.queryByText("What changed")).toBeNull();
  expect(screen.queryByText(foundation.vision)).toBeNull();
  fireEvent.click(screen.getByText("Milestone attempt"));
  expect(screen.getByText("Two pieces remain")).toBeVisible();
});
it("older completed records do not invent transformation and link to the full record", () => {
  const t = setup();
  t.get().goals[0].status = "completed";
  const navigate = vi.fn();
  render(<ProofList snapshot={t.get()} navigate={navigate} />);
  expect(
    screen.getByText(/Accomplishment details were not recorded/),
  ).toBeVisible();
  expect(screen.queryByText("What changed")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: /Revisit what changed/ }));
  expect(navigate).toHaveBeenCalledWith("/proof/challenge/g");
});
it("the completed record uses saved revision evidence, not a later aspiration as a before state", () => {
  const t = setup();
  t.send("status", {
    goalId: "g",
    version: 1,
    status: "completed",
    detail: "Three orders delivered",
    reflection: "I trust my craft",
    next: "Keep testing ideas",
  });
  const s = t.get();
  s.goals[0].words = "Later wording";
  s.goals[0].vision = "Later aspiration";
  expect(completionRecord(s, s.goals[0]).completed.words).toBe(
    foundation.words,
  );
  render(
    <ChallengeRecord snapshot={s} goal={s.goals[0]} navigate={() => {}} />,
  );
  expect(screen.getByText(foundation.vision)).toBeVisible();
  expect(screen.getByText("Keep testing ideas")).toBeVisible();
  expect(screen.queryByText("Later aspiration")).toBeNull();
  expect(screen.queryByText("Before")).toBeNull();
});
it("Basecamp retains the current step details and timer but removes work controls while paused", () => {
  const t = setup();
  t.send("commitment", action);
  const navigate = vi.fn();
  const view = render(
    <MemberHome
      goal={t.get().goals[0]}
      snapshot={t.get()}
      navigate={navigate}
    />,
  );
  expect(screen.getByText("Who I am becoming")).toBeVisible();
  expect(
    screen.getByRole("region", { name: "Step details & calendar" }),
  ).toBeVisible();
  expect(screen.getByText("Done means: " + action.criterion)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Start timer" }));
  fireEvent.click(screen.getByRole("button", { name: "Step check-in" }));
  expect(navigate).toHaveBeenCalledWith("/report/g");
  const clock = JSON.parse(localStorage.getItem("earned-self:timer:a:c:1")!);
  expect(clock.started).toBeNull();
  const s = structuredClone(t.get());
  s.goals[0].status = "paused";
  view.rerender(
    <MemberHome goal={s.goals[0]} snapshot={s} navigate={navigate} />,
  );
  expect(screen.queryByRole("button", { name: "Start timer" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Step check-in" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Review and resume" }));
  expect(navigate).toHaveBeenCalledWith("/resume/g");
  expect(s.evidence).toHaveLength(0);
});
it("Plan shows the current milestone first and keeps the complete plan and preparation reachable", () => {
  const t = setup();
  t.send("commitment", action);
  const navigate = vi.fn();
  render(
    <Ambition
      goal={t.get().goals[0]}
      snapshot={t.get()}
      navigate={navigate}
      save={vi.fn()}
      saving={false}
    />,
  );
  expect(screen.getByRole("heading", { name: "Your Plan" })).toBeVisible();
  expect(screen.queryByText("Who I am becoming")).toBeNull();
  expect(
    screen.getByRole("navigation", { name: "Your milestone path" }),
  ).toBeVisible();
  expect(screen.getAllByText("Launch shop")[0]).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "My preparation" }));
  expect(
    screen.getByRole("heading", { name: "Your preparation" }),
  ).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Back to Your Plan" }));
  expect(screen.getByRole("heading", { name: "Your Plan" })).toBeVisible();
});
