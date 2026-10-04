import { beforeEach, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../src/App";
import { applyLocal, emptySnapshot, type LocalStore } from "../src/data/domain";
import { loadDraft, saveDraft } from "../src/data/drafts";
import { newEntryExperience } from "../src/experience/Onboarding";
import type { Adapter, User } from "../src/data/types";
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  history.replaceState({}, "", "/start");
});
function setup(signedIn = false) {
  let user: User | null = signedIn
    ? { id: "member-a", email: "member@example.invalid" }
    : null;
  let notify: (u: User | null) => void = () => {};
  let store: LocalStore = { snapshot: emptySnapshot(), receipts: {} };
  const adapter: Adapter = {
    preview: false,
    configured: true,
    getUser: async () => user,
    subscribe: (cb) => {
      notify = cb;
      return () => {};
    },
    signIn: async () => {},
    signOut: async () => {
      user = null;
      notify(null);
    },
    passwordSignIn: async () => {
      user = { id: "member-a", email: "member@example.invalid" };
      notify(user);
    },
    read: async () => structuredClone(store.snapshot),
    execute: async (c) => {
      const result = applyLocal(store, c, user!.id);
      store = result.store;
      return result.receipt;
    },
  };
  return { adapter, state: () => store.snapshot };
}
it("requires confirmation after sign-in before saving an onboarding draft and pending first step to Basecamp", async () => {
  const x = newEntryExperience();
  x.step = 10;
  x.first.action = "Choose a training route";
  x.first.criterion = "One route selected";
  const draft = {
    ...loadDraft(),
    words: "Hike Kings Peak",
    vision: "Become resilient",
    experience: x,
  };
  saveDraft(draft);
  const { adapter, state } = setup();
  const u = userEvent.setup();
  render(<App adapter={adapter} />);
  await u.click(await screen.findByRole("button", { name: "Sign in to save" }));
  await u.type(
    await screen.findByLabelText("Email address"),
    "member@example.invalid",
  );
  await u.type(screen.getByLabelText("Password"), "synthetic-password");
  await u.click(screen.getByRole("button", { name: "Log in", exact: true }));
  await screen.findByRole("heading", { name: "Save this plan?" });
  expect(state().goals).toHaveLength(0);
  expect(loadDraft().boundOwner).toBeNull();
  await u.click(
    screen.getByRole("button", { name: "Save this plan", exact: true }),
  );
  await screen.findByText("Saved to your account.");
  await waitFor(() => expect(location.pathname).toBe("/app"));
  expect(state().goals).toHaveLength(1);
  expect(state().commitments).toHaveLength(1);
  expect(state().reports).toHaveLength(0);
  expect(loadDraft().id).not.toBe(draft.id);
});
it("returns a remembered session to Basecamp without an email request", async () => {
  history.replaceState({}, "", "/");
  const { adapter } = setup(true);
  render(<App adapter={adapter} />);
  await waitFor(() => expect(location.pathname).toBe("/app"));
  expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
});
it("keeps a failed legacy callback on login and preserves its draft", async () => {
  const draft = {
    ...loadDraft(),
    words: "Hike Kings Peak",
    vision: "Become resilient",
  };
  saveDraft(draft);
  history.replaceState({}, "", "/auth/callback?error=access_denied");
  const { adapter } = setup();
  render(<App adapter={adapter} />);
  await screen.findByLabelText("Password");
  expect(location.pathname).toBe("/auth");
  expect(loadDraft().id).toBe(draft.id);
});
it("lets a member start fresh without saving or losing the unclaimed draft", async () => {
  const draft = {
    ...loadDraft(),
    words: "An earlier plan",
    vision: "My earlier vision",
  };
  saveDraft(draft);
  history.replaceState({}, "", "/resume-entry");
  const { adapter, state } = setup(true);
  const u = userEvent.setup();
  render(<App adapter={adapter} />);
  await screen.findByRole("heading", { name: "Save this plan?" });
  await u.click(
    screen.getByRole("button", { name: "Start fresh", exact: true }),
  );
  expect(state().goals).toHaveLength(0);
  expect(loadDraft().id).not.toBe(draft.id);
  expect(
    Object.values(localStorage).some((value) => value.includes(draft.id)),
  ).toBe(true);
  expect(location.pathname).toBe("/start");
});
it("shows the signed-in account email in account settings", async () => {
  history.replaceState({}, "", "/settings");
  const { adapter } = setup(true);
  render(<App adapter={adapter} />);
  await screen.findByText("Signed in as");
  expect(screen.getByText("member@example.invalid")).toBeInTheDocument();
});
