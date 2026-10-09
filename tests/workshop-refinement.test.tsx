import { beforeEach, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { App } from "../src/App";
import { createPreviewAdapter } from "../src/preview/adapter";
import { applyLocal, emptySnapshot } from "../src/data/domain";
import { foundation } from "./fixtures";
import { Homepage } from "../src/components/Homepage";
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  history.replaceState({}, "", "/app");
});
it("keeps all areas reachable from empty Now and Plan, without refresh or creating a challenge", async () => {
  const owner = "local-preview-member";
  const store = applyLocal(
    { snapshot: emptySnapshot(), receipts: {} },
    {
      kind: "goal",
      payload: { ...foundation, id: "p", area: "physical" },
      actorId: owner,
      operationId: crypto.randomUUID(),
    },
    owner,
  ).store;
  localStorage.setItem(
    "earned-self:LOCAL-PREVIEW-ONLY:personal:v1",
    JSON.stringify(store),
  );
  localStorage.setItem("earned-self:LOCAL-PREVIEW-ONLY:session", "yes");
  const adapter = createPreviewAdapter();
  render(<App adapter={adapter} />);
  await screen.findByRole("button", { name: "Professional", exact: true });
  fireEvent.click(
    screen.getByRole("button", { name: "Professional", exact: true }),
  );
  await screen.findByRole("heading", { name: "What could you become here?" });
  fireEvent.click(
    screen.getByRole("button", { name: "Personal", exact: true }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Plan", exact: true }));
  expect(
    screen.getByRole("button", { name: "Physical", exact: true }),
  ).toBeVisible();
  fireEvent.click(
    screen.getByRole("button", { name: "Physical", exact: true }),
  );
  await screen.findByRole("heading", { name: "Your Plan" });
  expect(
    screen.getByRole("region", { name: "All milestones & steps" }),
  ).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "All milestones & steps" }),
  ).toBeNull();
  expect(
    screen.getAllByRole("button", { name: "Add step", exact: true }),
  ).toHaveLength(1);
  expect(
    screen.getAllByRole("button", { name: "Add milestone", exact: true }),
  ).toHaveLength(1);
  expect(
    screen
      .getByRole("button", { name: "Create wallpaper" })
      .querySelector("img"),
  ).not.toBeNull();
  expect((await adapter.read()).goals).toHaveLength(1);
});
it("carries only the chosen example area into onboarding", () => {
  const start = vi.fn();
  render(<Homepage start={start} signIn={() => {}} signedIn={false} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Personal", exact: true }),
  );
  fireEvent.click(screen.getByRole("button", { name: /Make it mine/ }));
  expect(start).toHaveBeenCalledWith("vision", "personal");
});
