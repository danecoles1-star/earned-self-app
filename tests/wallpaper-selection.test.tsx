import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Wallpaper } from "../src/experience/Carry";
import { foundation } from "./fixtures";
import type { Goal } from "../src/data/types";

const goal: Goal = {
  ...foundation,
  id: "g",
  owner_id: "a",
  kind: "goal",
  created_at: "",
  version: 1,
  revision: 1,
  status: "active",
};
const fillText = vi.fn();
beforeEach(() => {
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: { ready: Promise.resolve() },
  });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillText,
    measureText: (text: string) => ({ width: text.length * 30 }),
    createLinearGradient: () => ({ addColorStop: vi.fn() }),
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
    (callback) => callback(new Blob(["png"], { type: "image/png" })),
  );
  vi.stubGlobal(
    "Image",
    class {
      naturalWidth = 1170;
      naturalHeight = 2532;
      src = "";
      decode() {
        return Promise.resolve();
      }
    },
  );
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn(() => "blob:preview"),
    revokeObjectURL: vi.fn(),
  });
  fillText.mockClear();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("exports saved challenge, chosen milestone and becoming without changing the goal", async () => {
  render(<Wallpaper goal={goal} navigate={() => {}} />);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Preview lock screen" }),
    ).toBeEnabled(),
  );
  expect(screen.getByLabelText("Words to carry")).toHaveValue(goal.words);
  fireEvent.click(
    screen.getByRole("button", { name: "Milestone", exact: true }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Launch shop", exact: true }),
  );
  await waitFor(() =>
    expect(fillText).toHaveBeenCalledWith("Launch shop", 585, 850),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Becoming", exact: true }),
  );
  expect(screen.getByLabelText("Words to carry")).toHaveValue(goal.vision);
  await waitFor(() =>
    expect(fillText).toHaveBeenCalledWith(goal.vision, 585, 850),
  );
  fireEvent.change(screen.getByLabelText("Words to carry"), {
    target: { value: "My wallpaper only" },
  });
  expect(goal.vision).toBe(foundation.vision);
  expect(
    screen.getByRole("button", { name: "Becoming", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
});
it("explains unavailable milestones and offers five plain brand colors", async () => {
  render(<Wallpaper goal={{ ...goal, milestones: [] }} navigate={() => {}} />);
  expect(
    screen.getByRole("button", { name: "Milestone", exact: true }),
  ).toBeDisabled();
  expect(
    screen.getByText("Add a milestone in Plan to use it here."),
  ).toBeVisible();
  expect(document.querySelectorAll(".wallpaper-swatch")).toHaveLength(5);
  fireEvent.click(
    screen.getByRole("button", { name: "Earned Gold", exact: true }),
  );
  expect(
    screen.getByRole("button", { name: "Earned Gold", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Preview lock screen" }),
    ).toBeEnabled(),
  );
});
it("blocks export when a single word would overflow instead of clipping it", async () => {
  render(<Wallpaper goal={goal} navigate={() => {}} />);
  fireEvent.change(screen.getByLabelText("Words to carry"), {
    target: { value: "x".repeat(100) },
  });
  await screen.findByRole("alert");
  expect(
    screen.getByRole("button", { name: "Preview lock screen" }),
  ).toBeDisabled();
});
