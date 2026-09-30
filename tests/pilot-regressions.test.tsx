import { beforeEach, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemberHome } from "../src/experience/MemberHome";
import { Preparation } from "../src/experience/Preparation";
import { Ambition } from "../src/experience/Ambition";
import { Decision } from "../src/experience/Actions";
import { App } from "../src/App";
import { emptySnapshot, type Goal, type Adapter } from "../src/data/types";
import { foundation } from "./fixtures";
import {
  loadDraft,
  saveDraft,
  archivedDrafts,
  archiveDraft,
  restoreDraft,
} from "../src/data/drafts";
const goal = (status: Goal["status"] = "draft"): Goal => ({
  ...foundation,
  id: "g",
  owner_id: "a",
  kind: "goal",
  created_at: "2026-01-01",
  revision: 1,
  version: 1,
  status,
});
function state(status: Goal["status"] = "draft", outstanding = false) {
  const s = emptySnapshot();
  s.goals = [goal(status)];
  s.selectedGoal = "g";
  if (outstanding) {
    s.commitments = [
      {
        id: "c",
        owner_id: "a",
        goal_id: "g",
        milestone_id: null,
        plan_revision: null,
        revision: 1,
        version: 1,
        state: "active",
        created_at: "2026-01-01",
      },
    ];
    s.definitions = [
      {
        commitment_id: "c",
        goal_id: "g",
        revision: 1,
        action: "Choose a working title",
        criterion: "One title",
        mode: "quick",
      },
    ];
  }
  return s;
}
beforeEach(() => {
  localStorage.clear();
  history.replaceState({}, "", "/app");
});
it("legacy draft with outstanding move routes to that move rather than preparation", async () => {
  const s = state("draft", true),
    navigate = vi.fn();
  render(<MemberHome goal={s.goals[0]} snapshot={s} navigate={navigate} />);
  await userEvent.click(screen.getByRole("button", { name: "Step check-in" }));
  expect(navigate).toHaveBeenCalledWith("/report/g");
  expect(
    screen.queryByRole("button", { name: "Prepare my challenge" }),
  ).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Add my move to a calendar" }),
  ).toBeNull();
});
it.each(["draft", "active", "paused", "completed"] as const)(
  "direct preparation entry is guarded for %s with open work",
  async (status) => {
    const s = state(status, true),
      navigate = vi.fn(),
      save = vi.fn();
    render(
      <Preparation
        goal={s.goals[0]}
        snapshot={s}
        navigate={navigate}
        save={save}
        saving={false}
        user={{ id: "a" }}
      />,
    );
    expect(screen.queryByRole("textbox")).toBeNull();
    await userEvent.click(
      screen.getByRole("button", { name: "Report what happened" }),
    );
    expect(navigate).toHaveBeenCalledWith("/report/g");
    expect(save).not.toHaveBeenCalled();
  },
);
it("active preparation cannot be reopened even after reporting", () => {
  const s = state("active");
  render(
    <Preparation
      goal={s.goals[0]}
      snapshot={s}
      navigate={vi.fn()}
      save={vi.fn()}
      saving={false}
      user={{ id: "a" }}
    />,
  );
  expect(
    screen.getByRole("button", { name: "View my challenge" }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("textbox")).toBeNull();
});
it("ambition menu does not offer blocked preparation", () => {
  const s = state("draft", true);
  render(<Ambition goal={s.goals[0]} snapshot={s} navigate={vi.fn()} />);
  expect(
    screen.queryByRole("button", { name: "Complete my preparation" }),
  ).toBeNull();
});
it.each(["changed_direction", "abandoned"] as const)(
  "ended %s ambition offers a new blank ambition",
  async (status) => {
    const s = state(status),
      navigate = vi.fn();
    render(<MemberHome goal={s.goals[0]} snapshot={s} navigate={navigate} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Choose my next challenge" }),
    );
    expect(navigate).toHaveBeenCalledWith("/new");
  },
);
it("completion is blocked before reflection when a move is still outstanding", async () => {
  const s = state("active", true);
  render(
    <Decision
      goal={s.goals[0]}
      snapshot={s}
      navigate={vi.fn()}
      save={vi.fn()}
      saving={false}
    />,
  );
  await userEvent.click(
    screen.getByRole("button", { name: "I accomplished it" }),
  );
  expect(
    screen.getByRole("button", { name: "Report what happened" }),
  ).toBeInTheDocument();
  expect(screen.queryByLabelText("What actually happened?")).toBeNull();
});
it("starting another ambition does not reuse a stale entry draft or erase saved work", async () => {
  history.replaceState({}, "", "/new");
  const old = {
    ...loadDraft(),
    words: "Old test ambition",
    meaning:
      "Synthetic draft used to verify local draft retention before sign-in.",
  };
  saveDraft(old);
  const s = state();
  const adapter: Adapter = {
    preview: false,
    configured: true,
    getUser: async () => ({ id: "a" }),
    subscribe: () => () => {},
    signIn: async () => {},
    signOut: async () => {},
    read: async () => s,
    execute: vi.fn(),
  };
  render(<App adapter={adapter} />);
  await userEvent.click(
    await screen.findByRole("button", { name: "Begin a fresh challenge" }),
  );
  await screen.findByRole("heading", { name: "What brings you here?" });
  expect(loadDraft().words).toBe("");
  expect(loadDraft().meaning).toBe("");
  expect(archivedDrafts(null)[0].words).toBe(old.words);
  expect(adapter.execute).not.toHaveBeenCalled();
});
it("a fresh visitor has no synthetic answers", () => {
  const d = loadDraft();
  expect(d.words).toBe("");
  expect(d.meaning).toBe("");
  expect(d.vision).toBe("");
});
it("acknowledged save with failed refresh stays on recovery screen and does not advance", async () => {
  history.replaceState({}, "", "/report/g");
  let reads = 0;
  const s = state("draft", true);
  const adapter: Adapter = {
    preview: false,
    configured: true,
    getUser: async () => ({ id: "a" }),
    subscribe: () => () => {},
    signIn: async () => {},
    signOut: async () => {},
    read: async () => {
      if (++reads === 2) throw Error("Connection lost");
      return s;
    },
    execute: vi.fn(async () => ({ id: "proof", version: 1 })),
  };
  render(<App adapter={adapter} />);
  await userEvent.click(
    await screen.findByRole("button", { name: "Done", exact: true }),
  );
  await userEvent.type(
    screen.getByLabelText("What happened?"),
    "Selected a title",
  );
  await userEvent.click(screen.getByRole("button", { name: "Save to Proof" }));
  await screen.findByRole("button", { name: "Reload saved work" });
  expect(location.pathname).toBe("/report/g");
  expect(
    screen.getByText("Saved. Reload your saved work to continue."),
  ).toBeInTheDocument();
  expect(adapter.execute).toHaveBeenCalledTimes(1);
  await userEvent.click(
    screen.getByRole("button", { name: "Reload saved work" }),
  );
  await waitFor(() => expect(location.pathname).toBe("/proof/proof"));
  expect(adapter.execute).toHaveBeenCalledTimes(1);
});

it("signed-out visitors cannot see a draft bound to another account", async () => {
  history.replaceState({}, "", "/start");
  saveDraft({
    ...loadDraft(),
    boundOwner: "someone-else",
    words: "Private identity",
    vision: "Private vision",
  });
  const adapter: Adapter = {
    preview: false,
    configured: true,
    getUser: async () => null,
    subscribe: () => () => {},
    signIn: async () => {},
    signOut: async () => {},
    read: async () => emptySnapshot(),
    execute: vi.fn(),
  };
  render(<App adapter={adapter} />);
  await screen.findByRole("heading", {
    name: "Sign in to open your saved draft.",
  });
  expect(screen.queryByDisplayValue("Private vision")).toBeNull();
  expect(screen.queryByRole("textbox")).toBeNull();
});

it("archived drafts can be restored and stay scoped to their owner", () => {
  const d = { ...loadDraft(), words: "My unfinished writing", boundOwner: "a" };
  archiveDraft(d);
  expect(archivedDrafts(null)).toEqual([]);
  expect(archivedDrafts("b")).toEqual([]);
  expect(archivedDrafts("a")).toEqual([d]);
  restoreDraft(d);
  expect(loadDraft()).toEqual(d);
  expect(archivedDrafts("a")).toEqual([]);
});
