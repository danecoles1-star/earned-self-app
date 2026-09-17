import { it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../src/App";
import { applyLocal, emptySnapshot, type LocalStore } from "../src/data/domain";
import type { Adapter } from "../src/data/types";
import { foundation, action } from "./fixtures";
beforeEach(() => {
  localStorage.clear();
  history.replaceState({}, "", "/app");
});
it("reports a partial result, retains required explanation and offers deliberate next action", async () => {
  let data: LocalStore = { snapshot: emptySnapshot(), receipts: {} };
  for (const [kind, payload] of [
    ["goal", { id: "g", ...foundation }],
    ["commitment", action],
  ] as const)
    data = applyLocal(
      data,
      { kind, payload, actorId: "a", operationId: crypto.randomUUID() },
      "a",
    ).store;
  const adapter: Adapter = {
    preview: false,
    configured: true,
    async getUser() {
      return { id: "a" };
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
      const r = applyLocal(data, c, "a");
      data = r.store;
      return r.receipt;
    },
  };
  const u = userEvent.setup();
  render(<App adapter={adapter} />);
  await u.click(
    await screen.findByRole("button", { name: "Partly done", exact: true }),
  );
  await u.type(screen.getByLabelText("What prevented it?"), "Shift ran late");
  await u.type(screen.getByLabelText("What will you change?"), "Protect lunch");
  await u.click(
    screen.getByRole("button", { name: "Save preparation result" }),
  );
  await screen.findByRole("heading", {
    name: "The result is part of your Proof.",
  });
  expect(data.snapshot.reports[0].result).toBe("partly");
  expect(data.snapshot.goals[0].status).toBe("active");
  await u.click(screen.getByRole("button", { name: "Choose what comes next" }));
  await u.click(
    await screen.findByRole("button", { name: "Schedule next action" }),
  );
  await screen.findByRole("heading", { name: "Put the work on the calendar." });
  expect(screen.getByLabelText("Your next decision")).toHaveValue("recommit");
  expect(screen.getByLabelText("Action time")).toBeRequired();
});
