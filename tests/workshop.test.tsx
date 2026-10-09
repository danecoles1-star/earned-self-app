import { beforeEach, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { applyLocal, emptySnapshot, type LocalStore } from "../src/data/domain";
import { type Command, type GrowthArea } from "../src/data/types";
import { foundation } from "./fixtures";
import { AreaTabs, AreaContext, AreaAssignment } from "../src/experience/Areas";
import { Onboarding, newEntryExperience } from "../src/experience/Onboarding";
import { emptyFoundation } from "../src/data/types";
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
function setup() {
  let store: LocalStore = { snapshot: emptySnapshot(), receipts: {} };
  return {
    run(
      kind: Command["kind"],
      payload: Command["payload"],
      operationId = crypto.randomUUID(),
      actorId = "owner",
    ) {
      const result = applyLocal(
        store,
        { kind, payload, actorId, operationId },
        "owner",
      );
      store = result.store;
      return result.receipt;
    },
    get: () => store.snapshot,
  };
}
it("keeps three area challenges distinct without inventing Proof or changing commitments", () => {
  const s = setup();
  for (const area of ["physical", "professional", "personal"] as GrowthArea[])
    s.run("goal", { ...foundation, id: area, area });
  expect(s.get().goals.map((g) => g.area)).toEqual([
    "physical",
    "professional",
    "personal",
  ]);
  expect(s.get().evidence).toHaveLength(0);
  s.run("select", { goalId: "physical" });
  expect(s.get().selectedGoal).toBe("physical");
  expect(s.get().goals).toHaveLength(3);
  expect(s.get().commitments).toHaveLength(0);
});
it("assigns legacy area explicitly with history, versions and replay safety", () => {
  const s = setup();
  s.run("goal", { ...foundation, id: "old" });
  expect(s.get().goals[0].area).toBeNull();
  const op = crypto.randomUUID(),
    payload = { goalId: "old", version: 1, area: "personal" };
  const first = s.run("area", payload, op);
  expect(s.run("area", payload, op)).toEqual(first);
  expect(s.get().events.filter((e) => e.kind === "area")).toHaveLength(1);
  expect(s.get().goals[0]).toMatchObject({
    words: foundation.words,
    vision: foundation.vision,
    revision: 1,
    version: 2,
    area: "personal",
  });
  expect(() => s.run("area", { ...payload, area: "physical" })).toThrow(
    /changed|Reload/,
  );
  expect(() =>
    s.run("area", { ...payload, version: 2, area: "other" }),
  ).toThrow(/Choose/);
  expect(() =>
    s.run("area", { ...payload, version: 2 }, crypto.randomUUID(), "other"),
  ).toThrow();
});
it("area switch labels are accessible and disabled during save", () => {
  const choose = vi.fn();
  const view = render(
    <AreaContext.Provider
      value={{ area: "physical", choose, goals: [], busy: false }}
    >
      <AreaTabs />
    </AreaContext.Provider>,
  );
  expect(screen.getByRole("button", { name: "Physical" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  fireEvent.click(screen.getByRole("button", { name: "Professional" }));
  expect(choose).toHaveBeenCalledWith("professional");
  view.rerender(
    <AreaContext.Provider
      value={{ area: "physical", choose, goals: [], busy: true }}
    >
      <AreaTabs />
    </AreaContext.Provider>,
  );
  expect(screen.getByRole("button", { name: "Personal" })).toBeDisabled();
});
it("onboarding requires an authored area choice and offers opt-in guidance", () => {
  const change = vi.fn();
  render(
    <Onboarding
      draft={{
        ...emptyFoundation(),
        id: "d",
        operationId: "op",
        boundOwner: null,
        experience: newEntryExperience(),
      }}
      change={change}
      signedIn={false}
      saving={false}
      error=""
      onFinish={vi.fn()}
      back={vi.fn()}
    />,
  );
  expect(
    screen.getByRole("button", { name: "Continue", exact: true }),
  ).toBeDisabled();
  fireEvent.click(
    screen.getByRole("button", { name: "Professional", exact: true }),
  );
  expect(change).toHaveBeenCalledWith({ area: "professional" });
  fireEvent.click(
    screen.getByRole("button", { name: "Help when I ask", exact: true }),
  );
  expect(change.mock.calls.at(-1)?.[0].experience.supportMode).toBe("guided");
});

it("keeps legacy assignment out of area navigation and available only where requested", () => {
  const choose = vi.fn();
  const value = {
    area: null,
    choose,
    goals: [],
    busy: false,
    assignment: <button>Assign existing challenge</button>,
  };
  const view = render(
    <AreaContext.Provider value={value}>
      <AreaTabs />
    </AreaContext.Provider>,
  );
  expect(
    screen.queryByRole("button", { name: "Assign existing challenge" }),
  ).toBeNull();
  expect(choose).not.toHaveBeenCalled();
  view.rerender(
    <AreaContext.Provider value={value}>
      <AreaTabs />
      <AreaAssignment />
    </AreaContext.Provider>,
  );
  expect(
    screen.getAllByRole("button", { name: "Assign existing challenge" }),
  ).toHaveLength(1);
  expect(choose).not.toHaveBeenCalled();
});
