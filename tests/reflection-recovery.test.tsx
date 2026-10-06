import { beforeEach, expect, it } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import {
  applyLocal,
  currentSchedule,
  definition,
  emptySnapshot,
  type LocalStore,
} from "../src/data/domain";
import type { Command } from "../src/data/types";
import { foundation, action } from "./fixtures";
import { ChallengeRecord } from "../src/experience/ChallengeRecord";
import { MemberHome } from "../src/experience/MemberHome";
import { Help, SupportMode } from "../src/experience/ui";
import { guidanceExample } from "../src/experience/guidance";
beforeEach(() => {
  cleanup();
  localStorage.clear();
});
function setup() {
  let store: LocalStore = { snapshot: emptySnapshot(), receipts: {} };
  const send = (
    kind: Command["kind"],
    payload: Command["payload"],
    operationId = crypto.randomUUID(),
  ) => {
    store = applyLocal(
      store,
      { kind, payload, operationId, actorId: "a" },
      "a",
    ).store;
  };
  send("goal", { ...foundation, id: "g" });
  return { send, get: () => store.snapshot };
}
it("one-occurrence recovery restores original action, criterion and schedule after reporting; receipt retries do not duplicate", () => {
  const t = setup();
  t.send("commitment", {
    ...action,
    recurrence: { days: [0, 1, 2, 3, 4, 5, 6], until: "" },
  });
  t.send("outcome", {
    id: "c",
    goalId: "g",
    commitmentId: "c",
    version: 1,
    result: "did_not_happen",
    detail: "Missed practice",
    prevented: "Shift ran late",
    adjustment: "Try lunch",
  });
  const next = t.get().commitments.find((c) => c.state === "active")!;
  const payload = {
    ...action,
    goalId: "g",
    commitmentId: next.id,
    version: next.version,
    action: "Short practice",
    criterion: "One section",
    localDate: "2030-10-03",
    localTime: "13:00",
    reason: "Try lunch once",
    scope: "occurrence",
  };
  const { id, decision, milestoneId, ...revision } = payload;
  const op = crypto.randomUUID();
  t.send("reschedule", revision, op);
  t.send("reschedule", revision, op);
  expect(
    t.get().definitions.filter((d) => d.commitment_id === next.id),
  ).toHaveLength(2);
  expect(t.get().reports[0].result).toBe("did_not_happen");
  t.send("outcome", {
    id: next.id,
    goalId: "g",
    commitmentId: next.id,
    version: 2,
    result: "done",
    detail: "Practiced one section",
  });
  const third = t.get().commitments.find((c) => c.state === "active")!;
  expect(definition(t.get(), third.id, 1)?.action).toBe(action.action);
  expect(definition(t.get(), third.id, 1)?.criterion).toBe(action.criterion);
  expect(currentSchedule(t.get(), third.id)?.local_date).toBe("2030-10-03");
  expect(currentSchedule(t.get(), third.id)?.local_time).toBe("12:00");
  expect(third.repeat_template).toBeNull();
});
it("future scope carries the confirmed adjustment forward and paused additions never resume a challenge", () => {
  const t = setup();
  t.send("commitment", {
    ...action,
    recurrence: { days: [0, 1, 2, 3, 4, 5, 6], until: "" },
  });
  t.send("status", {
    goalId: "g",
    version: 2,
    status: "paused",
    detail: "Make room",
  });
  const before = structuredClone(t.get().schedules);
  t.send("commitment", { ...action, id: "other", localDate: "2030-11-01" });
  expect(t.get().goals[0].status).toBe("paused");
  expect(t.get().schedules.slice(0, 1)).toEqual(before);
  t.send("reschedule", {
    goalId: "g",
    commitmentId: "c",
    version: 1,
    action: "Adjusted",
    criterion: "One section",
    localDate: "2030-10-03",
    localTime: "13:00",
    timeZone: "America/Denver",
    reason: "Better fit",
    scope: "future",
  });
  t.send("outcome", {
    id: "c",
    goalId: "g",
    commitmentId: "c",
    version: 2,
    result: "done",
    detail: "Work before pause",
  });
  const next = t
    .get()
    .commitments.find((c) => c.series_id === "c" && c.state === "active")!;
  expect(definition(t.get(), next.id, 1)?.action).toBe("Adjusted");
  expect(currentSchedule(t.get(), next.id)?.local_time).toBe("13:00");
  expect(t.get().goals[0].status).toBe("paused");
  expect(t.get().evidence).toHaveLength(1);
});
it("completion shows actual reflection and original aspiration, and old missing fields remain honest", () => {
  const t = setup();
  t.send("status", {
    goalId: "g",
    version: 1,
    status: "completed",
    detail: "Three orders delivered",
    reflection: "I trust my craft",
    next: "Keep testing ideas",
  });
  let s = t.get();
  render(
    <ChallengeRecord goal={s.goals[0]} snapshot={s} navigate={() => {}} />,
  );
  expect(screen.getByText("I trust my craft")).toBeVisible();
  expect(screen.getByText("Keep testing ideas")).toBeVisible();
  expect(screen.getByText(foundation.vision)).toBeVisible();
  expect(screen.queryByText("Where you began")).toBeNull();
  cleanup();
  s = structuredClone(s);
  s.events[0].data.reflection = "";
  delete s.events[0].data.next;
  render(
    <ChallengeRecord goal={s.goals[0]} snapshot={s} navigate={() => {}} />,
  );
  expect(
    screen.getAllByText("Not recorded in this earlier entry."),
  ).toHaveLength(2);
});
it("paused Basecamp removes action controls without erasing the commitment", () => {
  const t = setup();
  t.send("commitment", action);
  t.send("status", {
    goalId: "g",
    version: 2,
    status: "paused",
    detail: "Pause",
  });
  const s = t.get();
  render(<MemberHome goal={s.goals[0]} snapshot={s} navigate={() => {}} />);
  expect(
    screen.getByRole("button", { name: "Review and resume" }),
  ).toBeVisible();
  expect(screen.queryByRole("button", { name: "Start timer" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Step check-in" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Step check-in" })).toBeNull();
  expect(s.commitments[0].state).toBe("active");
});
it("support modes differ without writing answers and a business presentation gets speaking guidance", () => {
  const field = "Choose an observable finish.";
  const example = guidanceExample(
    "Give a presentation at a business event",
    "step",
  );
  expect(example).toMatch(/Rehearse/);
  expect(example).not.toMatch(/customer/);
  const view = render(
    <SupportMode.Provider value="guided">
      <Help ambition="Give a talk" field={field} example={example} />
    </SupportMode.Provider>,
  );
  expect(screen.getByText(field)).toBeVisible();
  expect(screen.queryByRole("region")).toBeNull();
  view.rerender(
    <SupportMode.Provider value="on_request">
      <Help ambition="Give a talk" field={field} example={example} />
    </SupportMode.Provider>,
  );
  expect(screen.queryByText(field)).toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "Help me find the words" }),
  );
  expect(screen.getByRole("region")).toHaveTextContent(example);
});
it("future changes cannot silently end a routine by moving beyond its end date", () => {
  const t = setup();
  t.send("commitment", {
    ...action,
    recurrence: { days: [0, 1, 2, 3, 4, 5, 6], until: "2030-10-07" },
  });
  expect(() =>
    t.send("reschedule", {
      goalId: "g",
      commitmentId: "c",
      version: 1,
      action: "Short practice",
      criterion: "One section",
      localDate: "2030-10-08",
      localTime: "13:00",
      timeZone: "America/Denver",
      reason: "Change the time",
      scope: "future",
    }),
  ).toThrow(/repeat days|end date/);
  expect(t.get().commitments[0].revision).toBe(1);
});

it("opens a focused resume form without reusing the pause reason or changing scheduled work", async () => {
  const { Decision } = await import("../src/experience/Actions");
  const t = setup();
  t.send("commitment", action);
  const g = t.get().goals[0];
  g.status = "paused";
  localStorage.setItem(
    `earned-self:decision:${g.owner_id}:${g.id}`,
    JSON.stringify({ detail: "I injured my ankle" }),
  );
  history.replaceState({}, "", "/resume/g");
  const before = JSON.stringify(t.get());
  render(
    <Decision
      goal={g}
      snapshot={t.get()}
      saving={false}
      save={async () => {}}
      navigate={() => {}}
    />,
  );
  expect(
    screen.getByRole("heading", { name: "Resume your challenge" }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Why are you ready to return?")).toHaveValue("");
  expect(
    screen.getByRole("button", { name: "Resume challenge", exact: true }),
  ).toBeDisabled();
  expect(
    screen.getAllByRole("heading", { name: "Review your scheduled work" }),
  ).toHaveLength(1);
  expect(
    screen.getByRole("button", { name: "Stay paused" }),
  ).toBeInTheDocument();
  expect(JSON.stringify(t.get())).toBe(before);
});
it("keeps decision drafts separate when moving between pause and accomplishment", async () => {
  const { Decision } = await import("../src/experience/Actions");
  const t = setup();
  const g = t.get().goals[0];
  g.status = "active";
  history.replaceState({}, "", "/decision/g");
  render(
    <Decision
      goal={g}
      snapshot={t.get()}
      saving={false}
      save={async () => {}}
      navigate={() => {}}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Pause for now" }));
  fireEvent.change(screen.getByLabelText("Why are you making this decision?"), {
    target: { value: "Rest my ankle" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Go back" }));
  fireEvent.click(screen.getByRole("button", { name: "I accomplished it" }));
  expect(screen.getByLabelText("What actually happened?")).toHaveValue("");
});
it("moves the Plan marker only with milestone completion and keeps vision editing secondary", async () => {
  const { Ambition } = await import("../src/experience/Ambition");
  const t = setup();
  const g = t.get().goals[0];
  history.replaceState({}, "", "/manage");
  const props = {
    goal: g,
    snapshot: t.get(),
    saving: false,
    save: async () => {},
    navigate: () => {},
  };
  const view = render(<Ambition {...props} />);
  const current = () =>
    document.querySelector('.journey-path [aria-current="step"]');
  const initialPosition = current()?.getAttribute("aria-controls");
  expect(current()).toHaveTextContent(g.milestones[0].title);
  expect(
    screen
      .getByRole("button", { name: "Refine my vision", hidden: true })
      .closest("details")?.open,
  ).toBe(false);
  view.rerender(<Ambition {...props} goal={{ ...g, status: "paused" }} />);
  expect(current()?.getAttribute("aria-controls")).toBe(initialPosition);
  const attempted = structuredClone(t.get());
  attempted.events.push({
    id: "attempt",
    goal_id: g.id,
    kind: "milestone_attempt",
    data: { milestoneId: g.milestones[0].id },
    recorded_at: "2030-01-01",
  });
  view.rerender(<Ambition {...props} snapshot={attempted} />);
  expect(current()?.getAttribute("aria-controls")).toBe(initialPosition);
  const changed = structuredClone(t.get());
  changed.events.push({
    id: "milestone-proof",
    goal_id: g.id,
    kind: "milestone",
    data: { milestoneId: g.milestones[0].id },
    recorded_at: "2030-01-01",
  });
  view.rerender(<Ambition {...props} snapshot={changed} />);
  if (g.milestones.length > 1) {
    expect(current()).toHaveTextContent(g.milestones[1].title);
    expect(current()?.getAttribute("aria-controls")).not.toBe(initialPosition);
  } else expect(current()).toBeNull();
});
