import { it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../src/App";
import { applyLocal, emptySnapshot, type LocalStore } from "../src/data/domain";
import type { Adapter } from "../src/data/types";
beforeEach(() => {
  localStorage.clear();
  history.replaceState({}, "", "/app");
});
it("runs the whole authenticated component loop with saved state and a return commitment", async () => {
  let data: LocalStore = { snapshot: emptySnapshot(), receipts: {} };
  const adapter: Adapter = {
    preview: false,
    configured: true,
    async getUser() {
      return { id: "test-account", email: "test@example.invalid" };
    },
    subscribe() {
      return () => {};
    },
    async signIn() {},
    async signOut() {},
    async read() {
      return structuredClone(data.snapshot);
    },
    async execute(c) {
      const r = applyLocal(data, c, "test-account");
      data = r.store;
      return r.receipt;
    },
  };
  const u = userEvent.setup();
  render(<App adapter={adapter} />);
  await screen.findByRole("heading", { name: "Your goal belongs here." });
  await u.click(
    screen.getByRole("button", { name: "Start with a goal", exact: true }),
  );
  await u.type(screen.getByLabelText("Your goal"), "Finish my essay.");
  await u.click(screen.getByRole("button", { name: "Save my goal" }));
  await screen.findByRole("heading", { name: "Make the next move clear." });
  await u.type(screen.getByLabelText("Your action"), "Write one paragraph.");
  await u.type(screen.getByLabelText("Done means"), "A paragraph in my draft.");
  await u.click(screen.getByRole("button", { name: "Review my commitment" }));
  await u.click(screen.getByRole("button", { name: "Save my commitment" }));
  await screen.findByRole("heading", { name: "Write one paragraph." });
  await u.click(screen.getByRole("button", { name: "Done", exact: true }));
  await screen.findByRole("heading", { name: "Write one paragraph." });
  await screen.findByText("Occurrence date not specified.", { exact: false });
  await u.click(
    screen.getByRole("button", { name: "Add factual detail or reflection" }),
  );
  await u.type(
    screen.getByLabelText("What happened (optional)"),
    "The paragraph is in my draft.",
  );
  await u.type(
    screen.getByLabelText("What I learned (optional)"),
    "A short start helped.",
  );
  await u.click(screen.getByRole("button", { name: "Save optional detail" }));
  await screen.findByText("A short start helped.");
  expect(data.snapshot.evidence).toHaveLength(1);
  expect(data.snapshot.reports).toHaveLength(2);
  await u.click(
    screen.getByRole("button", { name: "Make another commitment" }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Quick", exact: true }),
    ).toHaveAttribute("aria-pressed", "true"),
  );
});
