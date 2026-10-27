import { beforeEach, expect, it, vi } from "vitest";
import {
  render,
  screen,
  within,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../src/App";
import { createPreviewAdapter } from "../src/preview/adapter";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  history.replaceState({}, "", "/app");
  localStorage.setItem("earned-self:LOCAL-PREVIEW-ONLY:session", "yes");
});
it("lets a new member explore all example panels without creating challenges or Proof", async () => {
  const adapter = createPreviewAdapter();
  const command = vi.spyOn(adapter, "execute");
  render(<App adapter={adapter} />);
  await waitForElementToBeRemoved(
    await screen.findByText("Loading your goal and Proof…"),
  );
  await userEvent.click(
    await screen.findByRole("button", { name: "Preview Now, Plan & Proof" }),
  );
  const preview = within(
    screen.getByRole("region", { name: "Design preview" }),
  );
  await userEvent.click(preview.getByRole("button", { name: "Begin" }));
  expect(
    preview.getByRole("heading", { name: "Check your route and essentials" }),
  ).toBeVisible();
  await userEvent.click(
    preview.getByRole("button", { name: "Plan", exact: true }),
  );
  expect(
    preview.getByRole("heading", { name: "Build toward Kings Peak." }),
  ).toBeVisible();
  await userEvent.click(
    preview.getByRole("button", { name: "Proof", exact: true }),
  );
  expect(
    preview.getByText(/This example is not a completed step/),
  ).toBeVisible();
  await userEvent.click(preview.getByRole("button", { name: "Close preview" }));
  expect(screen.queryByRole("region", { name: "Design preview" })).toBeNull();
  expect((await adapter.read()).goals).toHaveLength(0);
  expect((await adapter.read()).evidence).toHaveLength(0);
  expect(command).not.toHaveBeenCalled();
});
it("carries discovery intent into onboarding without pretending to call AI", async () => {
  render(<App adapter={createPreviewAdapter()} />);
  await waitForElementToBeRemoved(
    await screen.findByText("Loading your goal and Proof…"),
  );
  await userEvent.click(
    await screen.findByRole("button", { name: /Help me find my challenge/ }),
  );
  expect(
    screen.getByText(/AI challenge recommendations are not connected/),
  ).toBeVisible();
  await userEvent.click(
    screen.getByRole("button", { name: "Explore my direction" }),
  );
  await userEvent.click(
    await screen.findByRole("button", { name: "Physical", exact: true }),
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Continue", exact: true }),
  );
  expect(
    await screen.findByRole("heading", {
      name: "What would you like to trust yourself to do?",
    }),
  ).toBeVisible();
});
it("opens existing-challenge onboarding with required identity questions", async () => {
  render(<App adapter={createPreviewAdapter()} />);
  await waitForElementToBeRemoved(
    await screen.findByText("Loading your goal and Proof…"),
  );
  await userEvent.click(
    await screen.findByRole("button", { name: /I have a challenge/ }),
  );
  await userEvent.click(
    await screen.findByRole("button", { name: "Professional", exact: true }),
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Continue", exact: true }),
  );
  expect(
    await screen.findByRole("heading", { name: "Who will you become?" }),
  ).toBeVisible();
});
