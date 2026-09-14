import { it, expect, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../src/App";
import {
  emptySnapshot,
  type Adapter,
  type Receipt,
  type Snapshot,
} from "../src/data/types";

beforeEach(() => {
  localStorage.clear();
  history.replaceState({}, "", "/app");
});
it("shows loading and failure honestly, disables navigation while saving, and retries the same operation", async () => {
  let ready!: (s: Snapshot) => void;
  const opening = new Promise<Snapshot>((r) => (ready = r));
  const attempted: string[] = [];
  let rejectSave!: (e: Error) => void;
  let saved = false;
  const state = emptySnapshot();
  const adapter: Adapter = {
    preview: false,
    configured: true,
    async getUser() {
      return { id: "member-a" };
    },
    subscribe() {
      return () => {};
    },
    async signIn() {},
    async signOut() {},
    read() {
      return saved ? Promise.resolve(state) : opening;
    },
    execute(c) {
      attempted.push(c.operationId);
      if (attempted.length === 1)
        return new Promise<Receipt>((_, reject) => (rejectSave = reject));
      saved = true;
      state.goals.push({
        id: String(c.payload.id),
        owner_id: "member-a",
        words: String(c.payload.words),
        kind: "goal",
        meaning: null,
        created_at: new Date().toISOString(),
        version: 1,
      });
      state.selectedGoal = String(c.payload.id);
      return Promise.resolve({ id: String(c.payload.id), version: 1 });
    },
  };
  const u = userEvent.setup();
  render(<App adapter={adapter} />);
  await screen.findByText("Loading your goal and Record…");
  await act(async () => ready(emptySnapshot()));
  await u.click(
    await screen.findByRole("button", {
      name: "Start with a goal",
      exact: true,
    }),
  );
  await u.type(screen.getByLabelText("Your goal"), "Finish my own draft.");
  await u.click(screen.getByRole("button", { name: "Save my goal" }));
  expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Record", exact: true }),
  ).toBeDisabled();
  expect(screen.queryByText("Saved to your account.")).not.toBeInTheDocument();
  await act(async () =>
    rejectSave(new Error("Connection interrupted. Try this save again.")),
  );
  await screen.findByRole("alert");
  expect(screen.getByLabelText("Your goal")).toHaveValue(
    "Finish my own draft.",
  );
  expect(screen.queryByText("Saved to your account.")).not.toBeInTheDocument();
  await u.click(screen.getByRole("button", { name: "Save my goal" }));
  await waitFor(() => expect(attempted).toHaveLength(2));
  expect(attempted[1]).toBe(attempted[0]);
  await screen.findByText("Saved to your account.");
  expect(state.goals).toHaveLength(1);
});
